
import { auth, observeAuth, registerUser, loginUser, logoutUser } from "./auth.js";
import { PRODUCTS } from "./data.js";
import { getDemoRole, toggleDemoRole, requireAuth } from "./guards.js";

const GUEST_SEARCH_LIMIT = 3;
const BLOCKED_PAGES = ["login", "register", "blocked"];
const page = document.body.dataset.page;
let authReady = false;

function qs(id) {
  return document.getElementById(id);
}

function getGuestSearchRemaining() {
  const value = localStorage.getItem("guestSearchRemaining");
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : GUEST_SEARCH_LIMIT;
}

function setGuestSearchRemaining(value) {
  localStorage.setItem("guestSearchRemaining", String(Math.max(0, value)));
}

function decrementGuestSearchRemaining() {
  const next = Math.max(0, getGuestSearchRemaining() - 1);
  setGuestSearchRemaining(next);
  return next;
}

function resetGuestSearchRemaining() {
  localStorage.removeItem("guestSearchRemaining");
}

function isGuestBlocked() {
  return getGuestSearchRemaining() <= 0;
}

function shouldRedirectGuestToBlocked() {
  return authReady && !auth.currentUser && isGuestBlocked() && !BLOCKED_PAGES.includes(page);
}

function redirectGuestToBlocked() {
  if (shouldRedirectGuestToBlocked()) {
    window.location.href = "blocked.html";
    return true;
  }
  return false;
}

function money(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function setMessage(node, text, success = false) {
  if (!node) return;
  node.textContent = text;
  node.className = `form-message${success ? " success" : ""}`;
}

function safeReturnUrl(defaultUrl) {
  const raw = new URLSearchParams(window.location.search).get("returnUrl");
  if (!raw) return defaultUrl;
  if (raw.startsWith("/")) return `.${raw}`;
  if (raw.startsWith("./") || raw.startsWith("../")) return raw;
  return defaultUrl;
}

function buildReturnUrl() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  return `../../${currentPage}`;
}

function siteUrls() {
  const inPages = window.location.pathname.includes("/pages/");
  const inLogon = window.location.pathname.includes("/logon/");
  return {
    login: inPages ? "./login.html" : inLogon ? "./pages/login.html" : "logon/pages/login.html",
    register: inPages ? "./register.html" : inLogon ? "./register.html" : "logon/pages/register.html",
    home: inPages ? "../index.html" : inLogon ? "../index.html" : "index.html",
  };
}

function renderHeader() {
  const accountEl = document.querySelector(".account");
  const adminButton = document.getElementById("adminBtn");
  const roleEl = document.querySelector("[data-header-role]");
  const authActions = document.querySelector("[data-auth-actions]");
  const user = auth.currentUser;
  const urls = siteUrls();
  const returnUrl = buildReturnUrl();

  if (adminButton) {
    const isAdmin = Boolean(user?.email?.toLowerCase() === "administrator@aol.com");
    adminButton.style.display = isAdmin ? "inline-block" : "none";
  }

  if (roleEl) {
    roleEl.textContent = user ? user.email : "Guest";
  }

  if (accountEl) {
    if (user) {
      resetGuestSearchRemaining();
      accountEl.innerHTML = `
        <span class="badge user">${user.email}</span>
        <button id="logoutBtn" type="button">Đăng xuất</button>
      `;
      qs("logoutBtn")?.addEventListener("click", async () => {
        await logoutUser();
        window.location.href = urls.home;
      });
    } else {
      const remaining = getGuestSearchRemaining();
      accountEl.innerHTML = `
        <span class="badge-guest" style="margin-right:12px;">Remaining Search: ${remaining}</span>
        <a href="${urls.login}?returnUrl=${encodeURIComponent(returnUrl)}">Đăng nhập</a>
        <a href="${urls.register}?returnUrl=${encodeURIComponent(returnUrl)}">Đăng Kí</a>
      `;
    }
    return;
  }

  if (!authActions) return;

  if (user) {
    authActions.innerHTML = `
      <span class="badge user">${user.email}</span>
      <button class="btn btn-ghost" id="logoutBtn" type="button">Đăng xuất</button>
    `;
    qs("logoutBtn")?.addEventListener("click", async () => {
      await logoutUser();
      window.location.href = urls.home;
    });
    return;
  }

  authActions.innerHTML = `
    <a class="btn btn-ghost" href="${urls.login}">Đăng nhập</a>
    <a class="btn btn-primary" href="${urls.register}">Đăng ký</a>
  `;
}

function renderOverview() {
  const steps = qs("lessonSteps");
  const fileList = qs("fileList");
  const quickNote = qs("quickNote");

  if (steps) {
    steps.innerHTML = `
      <article class="step-card">
        <div class="step-num">1</div>
        <h3>Tạo Firebase project</h3>
        <p>Tạo project, thêm Web App và copy <code>firebaseConfig</code>.</p>
      </article>
      <article class="step-card">
        <div class="step-num">2</div>
        <h3>Bật Authentication</h3>
        <p>Bật Email/Password trong Firebase Console.</p>
      </article>
      <article class="step-card">
        <div class="step-num">3</div>
        <h3>Dán config thật</h3>
        <p>Dán object config vào <code>js/firebase-config.js</code>.</p>
      </article>
      <article class="step-card">
        <div class="step-num">4</div>
        <h3>Đăng ký và đăng nhập</h3>
        <p>Dùng tài khoản Firebase thật, không dùng user mẫu.</p>
      </article>
      <article class="step-card">
        <div class="step-num">5</div>
        <h3>Mở Shop</h3>
        <p>Shop chỉ mở khi đã đăng nhập.</p>
      </article>
      <article class="step-card">
        <div class="step-num">6</div>
        <h3>Đổi role minh họa</h3>
        <p>Vào Admin để đổi role demo và học phân quyền trước khi sang Firestore.</p>
      </article>
    `;
  }

  if (fileList) {
    fileList.innerHTML = `
      <article class="file-card">
        <div class="step-num">A</div>
        <h3>js/firebase-config.js</h3>
        <p>Dán config thật của Firebase Web App.</p>
      </article>
      <article class="file-card">
        <div class="step-num">B</div>
        <h3>js/auth.js</h3>
        <p>Khởi tạo Firebase Auth và export các hàm đăng ký, đăng nhập, đăng xuất.</p>
      </article>
      <article class="file-card">
        <div class="step-num">C</div>
        <h3>js/app.js</h3>
        <p>Nối form và cập nhật giao diện theo trạng thái đăng nhập.</p>
      </article>
    `;
  }

  if (quickNote) {
    quickNote.innerHTML = `
      <div class="locked-state">
        <strong>Điều học sinh cần nhớ</strong>
        <p class="tiny" style="margin-top:8px;">
          Firebase Authentication chỉ xử lý ai đang đăng nhập. Quyền admin minh họa sẽ học tiếp ở bài Firestore.
        </p>
      </div>
      <div class="status-line"><span>Không có user mẫu</span><strong>✔</strong></div>
      <div class="status-line"><span>Không có localStorage user database</span><strong>✔</strong></div>
      <div class="status-line"><span>Không có mock login/register</span><strong>✔</strong></div>
    `;
  }
}

function handleLoginPage() {
  const form = qs("loginForm");
  if (!form) return;

  const returnUrl = safeReturnUrl("../pages/shop.html");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      await loginUser(String(data.email || ""), String(data.password || ""));
      window.location.href = returnUrl;
    } catch (error) {
      setMessage(qs("loginMessage"), error?.message || "Đăng nhập thất bại.");
    }
  });
}

function handleRegisterPage() {
  const form = qs("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (String(data.password || "") !== String(data.confirmPassword || "")) {
      setMessage(qs("registerMessage"), "Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      await registerUser(String(data.email || ""), String(data.password || ""));
      setMessage(qs("registerMessage"), "Tạo tài khoản Firebase thành công. Chuyển sang đăng nhập...", true);
      window.setTimeout(() => {
        window.location.href = "./login.html";
      }, 650);
    } catch (error) {
      setMessage(qs("registerMessage"), error?.message || "Đăng ký thất bại.");
    }
  });
}

function renderShopLoading() {
  const hero = qs("shopHero");
  const info = qs("shopInfo");
  if (hero) {
    hero.innerHTML = `
      <div class="eyebrow">Bước 5 · Shop</div>
      <h1>Đang kiểm tra đăng nhập</h1>
      <p class="lead">Firebase đang xác định đây là guest hay user đã đăng nhập.</p>
    `;
  }
  if (info) {
    info.innerHTML = `<div class="locked-state"><strong>Đang tải...</strong><p class="tiny" style="margin-top:8px;">Đợi Firebase Auth phản hồi.</p></div>`;
  }
}

function renderShopLocked() {
  const hero = qs("shopHero");
  const list = qs("productGrid");
  const info = qs("shopInfo");
  if (hero) {
    hero.innerHTML = `
      <div class="eyebrow">Bước 5 · Shop</div>
      <h1>Shop đang khóa</h1>
      <p class="lead">Chỉ người đã đăng nhập bằng Firebase Authentication thật mới vào được shop.</p>
      <div class="action-row" style="margin-top:20px;">
        <a class="btn btn-primary" href="./login.html?returnUrl=%2Fpages%2Fshop.html">Đăng nhập ngay</a>
        <a class="btn btn-ghost" href="./register.html">Đăng ký tài khoản</a>
      </div>
    `;
  }
  if (list) {
    list.innerHTML = PRODUCTS.slice(0, 3).map((item) => `
      <article class="product-card" style="opacity:.55;">
        <div class="product-name">${item.name}</div>
        <div class="product-meta">${item.category}</div>
        <div class="price">${money(item.price)}</div>
        <button class="btn btn-ghost btn-full" disabled>Đăng nhập để xem</button>
      </article>
    `).join("");
  }
  if (info) {
    info.innerHTML = `
      <div class="locked-state">
        <strong>Yêu cầu bắt buộc</strong>
        <p class="tiny" style="margin-top:8px;">
          1. Đăng ký tài khoản Firebase thật.<br>
          2. Đăng nhập bằng tài khoản đó.<br>
          3. Quay lại shop để xem trạng thái mở khóa.
        </p>
      </div>
    `;
  }
}

function renderShopOpen(user) {
  const hero = qs("shopHero");
  const list = qs("productGrid");
  const info = qs("shopInfo");
  if (hero) {
    hero.innerHTML = `
      <div class="eyebrow">Bước 5 · Shop</div>
      <h1>Xin chào, ${user.email}</h1>
      <p class="lead">Bạn đã đăng nhập thành công bằng Firebase Authentication. Shop bây giờ mới mở.</p>
      <div class="action-row" style="margin-top:20px;">
        <span class="badge user">${user.email}</span>
        <button class="btn btn-ghost" id="shopLogoutBtn" type="button">Đăng xuất</button>
      </div>
    `;
  }

  if (list) {
    list.innerHTML = PRODUCTS.map((item) => `
      <article class="product-card">
        <div class="product-name">${item.name}</div>
        <div class="product-meta">${item.category}</div>
        <div class="price">${money(item.price)}</div>
        <button class="btn btn-primary btn-full" type="button">Thêm minh họa</button>
      </article>
    `).join("");
  }

  if (info) {
    info.innerHTML = `
      <div class="locked-state">
        <strong>Điểm cần nhớ</strong>
        <p class="tiny" style="margin-top:8px;">
          Authentication là “ai đang đăng nhập”. Authorization là “người đó được làm gì”.
        </p>
      </div>
    `;
  }

  qs("shopLogoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    window.location.href = "../index.html";
  });
}

function renderShop() {
  if (!authReady) {
    renderShopLoading();
    return;
  }

  const result = requireAuth();
  if (!result.allowed) {
    renderShopLocked();
    window.location.href = result.redirect;
    return;
  }

  renderShopOpen(result.user);
}

function renderAdminLoading() {
  const hero = qs("adminHero");
  const panel = qs("adminPanel");
  if (hero) {
    hero.innerHTML = `
      <div class="eyebrow">Bước 6 · Admin</div>
      <h1>Đang kiểm tra đăng nhập</h1>
      <p class="lead">Trang admin chỉ mở sau khi xác thực Firebase hoàn tất.</p>
    `;
  }
  if (panel) panel.innerHTML = "";
}

function renderAdminLocked() {
  const hero = qs("adminHero");
  const panel = qs("adminPanel");
  if (hero) {
    hero.innerHTML = `
      <div class="eyebrow">Bước 6 · Admin</div>
      <h1>Admin trong bài này là demo</h1>
      <p class="lead">Muốn vào đây thì trước hết phải đăng nhập bằng Firebase Authentication thật.</p>
      <div class="action-row" style="margin-top:20px;">
        <a class="btn btn-primary" href="./login.html?returnUrl=%2Fpages%2Fadmin.html">Đăng nhập ngay</a>
        <a class="btn btn-ghost" href="./register.html">Đăng ký tài khoản</a>
      </div>
    `;
  }
  if (panel) {
    panel.innerHTML = `
      <div class="notice">Chưa đăng nhập nên chưa thể đổi role minh họa.</div>
    `;
  }
}

function renderAdminOpen(user) {
  const hero = qs("adminHero");
  const panel = qs("adminPanel");
  const role = getDemoRole();

  if (hero) {
    hero.innerHTML = `
      <div class="eyebrow">Bước 6 · Admin</div>
      <h1>Khu quản trị minh họa</h1>
      <p class="lead">
        Đăng nhập bằng <strong>${user.email}</strong>. Bấm nút dưới đây để đổi role minh họa giữa <strong>User</strong> và <strong>Admin</strong>.
      </p>
      <div class="action-row" style="margin-top:20px;">
        <span class="badge ${role === "admin" ? "admin" : "guest"}">Role hiện tại: ${role}</span>
        <button class="btn btn-primary" id="toggleRoleBtn" type="button">Đổi role minh họa</button>
        <button class="btn btn-ghost" id="adminLogoutBtn" type="button">Đăng xuất</button>
      </div>
    `;
  }

  if (panel) {
    panel.innerHTML = role === "admin"
      ? `
        <div class="notice success">
          Role admin đang bật. Đây chỉ là bước học minh họa trước khi chuyển sang Firestore.
        </div>
        <div class="locked-state" style="margin-top:16px;">
          <strong>Tiếp theo</strong>
          <p class="tiny" style="margin-top:8px;">
            Khi học Firestore, role thật sẽ được đọc từ collection users.
          </p>
        </div>
      `
      : `
        <div class="notice">
          Role user đang bật. Bấm “Đổi role minh họa” để xem admin được mở như thế nào.
        </div>
        <div class="locked-state" style="margin-top:16px;">
          <strong>Ghi nhớ</strong>
          <p class="tiny" style="margin-top:8px;">
            Đây chưa phải phân quyền thật. Phân quyền thật sẽ làm ở bài Firestore.
          </p>
        </div>
      `;
  }

  qs("toggleRoleBtn")?.addEventListener("click", () => {
    toggleDemoRole();
    renderAdminOpen(user);
  });

  qs("adminLogoutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    window.location.href = "../index.html";
  });
}

function renderPage() {
  switch (page) {
    case "home":
      renderOverview();
      break;
    case "login":
      handleLoginPage();
      break;
    case "register":
      handleRegisterPage();
      break;
    case "shop":
      renderShop();
      break;
    case "admin":
      if (!authReady) {
        renderAdminLoading();
      } else if (!auth.currentUser) {
        renderAdminLocked();
        window.location.href = "./login.html?returnUrl=%2Fpages%2Fadmin.html";
      } else {
        renderAdminOpen(auth.currentUser);
      }
      break;
    default:
      break;
  }
}

renderHeader();
if (!redirectGuestToBlocked()) {
  renderPage();
}

observeAuth((user) => {
  authReady = true;
  if (user) {
    resetGuestSearchRemaining();
  }
  renderHeader();

  if (!redirectGuestToBlocked()) {
    if (page === "shop") {
      renderShop();
    } else if (page === "admin") {
      if (!auth.currentUser) {
        renderAdminLocked();
        return;
      }
      renderAdminOpen(auth.currentUser);
    }
  }
});










const adminButton = document.getElementById("adminBtn");

