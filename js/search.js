import { auth, observeAuth } from "./auth.js";

const API_BASE_URL = "https://opencritic-api.p.rapidapi.com";
const FALLBACK_GAMES = [
  {
    name: "Minecraft",
    image: "images/placeholder.png",
    averageScore: 92,
    Genres: [{ name: "Sandbox" }],
    description: "Sandbox sáng tạo với thế giới mở không giới hạn.",
  },
  {
    name: "The Witcher 3",
    image: "images/placeholder.png",
    averageScore: 95,
    Genres: [{ name: "RPG" }],
    description: "Hành trình phiêu lưu fantasy đậm chất kể chuyện.",
  },
  {
    name: "Fortnite",
    image: "images/placeholder.png",
    averageScore: 88,
    Genres: [{ name: "Battle Royale" }],
    description: "Trò chơi bắn súng kết hợp xây dựng và đối kháng.",
  },
];
const API_OPTIONS = {
  method: "GET",
  headers: {
    "x-rapidapi-key": "fe7f18dd34msh28d6ac0d74956fbp12b4afjsnb31038159c43",
    "x-rapidapi-host": "opencritic-api.p.rapidapi.com",
    "Content-Type": "application/json",
  },
  mode: "cors",
};

function getSearchQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("q")?.trim() || "";
}

function getNestedValue(source, keys) {
  let current = source;

  for (const key of keys) {
    if (!current || typeof current !== "object") return "";
    current = current[key];
  }

  return current;
}

function getGameImage(game) {
  const candidates = [
    getNestedValue(game, ["images", "square"]),
    getNestedValue(game, ["images", "banner"]),
    getNestedValue(game, ["images", "boxart"]),
    getNestedValue(game, ["images", "thumbnail"]),
    getNestedValue(game, ["images", "logo"]),
    game?.image,
    game?.imageSrc,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim()) || "images/placeholder.png";
}

function getGameGenre(game) {
  const genres = game?.Genres || game?.genres || [];
  if (Array.isArray(genres)) {
    return genres.map((item) => item?.name || item).filter(Boolean).join(", ");
  }
  return game?.type || "";
}

function normalizeGame(game) {

  console.log("Raw game:", game);

  return {

    id: game?.id || null,

    name: game?.name || "Không rõ tên",

    image: getGameImage(game),

    score:
      game?.averageScore ??
      game?.medianScore ??
      game?.topCriticScore ??
      "N/A",
      

    type: getGameGenre(game),

    description:
      game?.description ||
      "Không có mô tả hiện có.",

  };

}


function renderResults(query, games = [], errorMessage = "") {
  const resultsContainer = document.getElementById("searchResults");
  if (!resultsContainer) return;

  if (!query) {
    resultsContainer.innerHTML = `
      <p class="empty-state">Nhập tên trò chơi để bắt đầu tìm kiếm.</p>
    `;
    return;
  }

  if (errorMessage) {
    resultsContainer.innerHTML = `
      <p class="empty-state">${errorMessage}</p>
    `;
    return;
  }

  if (!games.length) {
    resultsContainer.innerHTML = `
      <p class="empty-state">Không tìm thấy trò chơi nào phù hợp với từ khóa “${query}”.</p>
    `;
    return;
  }

  
  resultsContainer.innerHTML = games
    .map(
      (game) => `
        <article class="result-card">
          <img src="${game.image}" alt="${game.name}">
          <div class="result-content">
            <h3>${game.name}</h3>
            <p>⭐ ${game.score}</p>
            <p>${game.type}</p>
            <p class="result-description">${game.description}</p>
            <a href="reviews.html?id=${game.id}" style="

    display:inline-block;

    margin-top:12px;

    padding:8px 18px;

    color:white;

    text-decoration:none;

    font-family:Tahoma;

    font-size:12px;

    font-weight:bold;

    border-radius:5px;

    border:1px solid #24418f;

    background:
    linear-gradient(
        to bottom,

        #64B6EE,

        #4C9ADD 45%,

        #427BD2 46%,

        #3364C0

    );

}">
                Xem đánh giá
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

async function fetchGamesFromApi(query) {
  const url = `${API_BASE_URL}/game/search?criteria=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { ...API_OPTIONS, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch {
        result = text;
      }
    }

    const payload = Array.isArray(result)
      ? result
      : result?.games || result?.data || result?.results || result?.items || [result];

    if (Array.isArray(payload) && payload.length) {
      return payload;
    }
  } catch {
    // Fall back to demo data if the API is unavailable or rate-limited.
  } finally {
    window.clearTimeout(timeoutId);
  }

  const fallbackMatches = FALLBACK_GAMES.filter((game) => {
    const haystack = `${game.name} ${game.description} ${(game.Genres || []).map((genre) => genre?.name || genre).join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  if (fallbackMatches.length) {
    return fallbackMatches;
  }

  return FALLBACK_GAMES;
}

let authStateReady = false;
let domReady = document.readyState !== "loading";
let searchPageInitialized = false;

function isUserLoggedIn() {
  return Boolean(auth.currentUser);
}

function getGuestSearchRemaining() {
  const value = localStorage.getItem("guestSearchRemaining");
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 3;
}

function setGuestSearchRemaining(value) {
  localStorage.setItem("guestSearchRemaining", String(Math.max(0, value)));
}

function decrementGuestSearchRemaining() {
  const next = Math.max(0, getGuestSearchRemaining() - 1);
  setGuestSearchRemaining(next);
  return next;
}

function isGuestBlocked() {
  return getGuestSearchRemaining() <= 0;
}

function bindSearchForm() {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");

  if (!searchForm || !searchInput) return;

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();

    if (!query) {
      window.location.href = "search.html";
      return;
    }

    if (!isUserLoggedIn()) {
      if (isGuestBlocked()) {
        window.location.href = "blocked.html";
        return;
      }
      const remaining = decrementGuestSearchRemaining();
      if (remaining <= 0) {
        window.location.href = "blocked.html";
        return;
      }
    }

    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
  });
}

async function initSearchPage() {
  bindSearchForm();
  const query = getSearchQuery();
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.value = query;
  }

  if (!isUserLoggedIn() && isGuestBlocked()) {
    window.location.href = "blocked.html";
    return;
  }

  if (!query) {
    renderResults(query);
    return;
  }

  if (!isUserLoggedIn()) {
    const remaining = decrementGuestSearchRemaining();
    if (remaining <= 0) {
      window.location.href = "blocked.html";
      return;
    }
  }

  renderResults(query, [], "Đang tìm kiếm...");

  try {
    const rawGames = await fetchGamesFromApi(query);

    console.log("API Response:", rawGames);
    console.log("First Game:", rawGames[0]);
    const games = rawGames.map(normalizeGame).filter(Boolean);
    renderResults(query, games);
  } catch {
    renderResults(query, FALLBACK_GAMES.map(normalizeGame), "Hiển thị dữ liệu mẫu vì API hiện không phản hồi.");
  }
}

function tryInitSearchPage() {
  if (!searchPageInitialized && authStateReady && domReady) {
    searchPageInitialized = true;
    initSearchPage();
  }
}

observeAuth(() => {
  authStateReady = true;
  tryInitSearchPage();
});

if (domReady) {
  tryInitSearchPage();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    domReady = true;
    tryInitSearchPage();
  });
}
async function checkRateLimit(sampleQuery = "test") {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 4000);
  const url = `${API_BASE_URL}/game/search?criteria=${encodeURIComponent(sampleQuery)}`;

  try {
    const response = await fetch(url, { ...API_OPTIONS, signal: controller.signal });

    console.log("Rate limit headers:");
    console.log("x-ratelimit-requests-remaining:", response.headers.get("x-ratelimit-requests-remaining"));
    console.log("x-ratelimit-requests-reset:", response.headers.get("x-ratelimit-requests-reset"));
    console.log("x-ratelimit-limit:", response.headers.get("x-ratelimit-limit") || response.headers.get("x-ratelimit-requests-limit"));

    return response;
  } catch (err) {
    console.error("Rate limit check failed:", err);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

checkRateLimit();
