
function getGameId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadReviews() {

    const gameId = getGameId();

    const container = document.getElementById("reviews");
if (!gameId) {

    container.innerHTML = `

        <div class="error-box">

            <h2>⚠ Không thể tải dữ liệu trò chơi</h2>

            <p>
                Gamepedia AI không thể xác định trò chơi mà bạn yêu cầu.
            </p>

            <p>
                Điều này có thể xảy ra vì:
            </p>

            <ul class="error-list">

                <li>Liên kết không hợp lệ hoặc đã bị thay đổi.</li>

                <li>Trò chơi không còn tồn tại trong cơ sở dữ liệu OpenCritic.</li>

                <li>Bạn đã mở trang này trực tiếp mà không thông qua chức năng tìm kiếm.</li>

            </ul>

            <p>
                <strong>Khuyến nghị:</strong><br>
                Sử dụng thanh tìm kiếm phía trên để tìm trò chơi mong muốn,<br>
                hoặc quay trở lại Trang chủ để bắt đầu lại.
            </p>

            <div class="error-buttons">

                <a href="index.html" class="retro-btn">
                    🏠 Trang chủ
                </a>

                <a href="search.html" class="retro-btn">
                    🔍 Tìm kiếm trò chơi
                </a>

            </div>

        </div>

        <style>
        .error-box{

    width:700px;

    margin:50px auto;

    padding:30px;

    text-align:center;

    border:1px solid #3364C0;

    background:#F5F9FF;

    box-shadow:0 0 8px rgba(0,0,0,.25);

    font-family:Tahoma, Arial;

}

.error-icon{

    width:64px;

    height:64px;

    margin-bottom:15px;

}

.error-list{

    display:inline-block;

    text-align:left;

    margin:15px auto;

    padding-left:20px;

    font-family:Tahoma;

    font-size:13px;

    color:#333;

}
    
.error-box h2{

    color:#1E2791;

    margin-bottom:15px;

    font-size:24px;

}

.error-box p{

    color:#333;

    margin:10px 0;

    line-height:22px;

    font-size:14px;

}

.error-buttons{

    margin-top:25px;

}

.retro-btn{

    display:inline-block;

    margin:5px;

    padding:10px 20px;

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

}

.retro-btn:hover{

    background:
    linear-gradient(
        to bottom,
        #8DD0F7,
        #64B6EE 45%,
        #4C9ADD 46%,
        #427BD2
    );

}
        </style>
    `;

    return;

}

    container.innerHTML = "<p>Đang tải đánh giá...</p>";

    const url = `${API_BASE_URL}/review/game/${gameId}?sort=newest`;

    try {

        const response = await fetch(url, API_OPTIONS);

        if (!response.ok) {
            throw new Error("API Error");
        }

        const reviews = await response.json();

        console.log(reviews);

        if (!reviews.length) {
            container.innerHTML = "<p>Không có đánh giá.</p>";
            return;
        }

        container.innerHTML = reviews.map(review => `

            <div class="review-card">

                <h2>${review.title || "Không có tiêu đề"}</h2>

                <p>
                    <strong>Game:</strong>
                    ${review.game?.name || "Unknown"}
                </p>

                <p>
                    <strong>Outlet:</strong>
                    ${review.Outlet?.name || "Unknown"}
                </p>

                <p>
                    <strong>Author:</strong>
                    ${review.Authors?.length ? review.Authors[0].name : "Unknown"}
                </p>

                <p>
                    ⭐ ${review.score ?? "N/A"}
                </p>

                <p>
                    ${review.snippet || ""}
                </p>

                <a href="${review.externalUrl}"
                   target="_blank">

                    Đọc bài đánh giá đầy đủ

                </a>

            </div>

        `).join("");

    }

    catch(error){

        console.error(error);

        container.innerHTML = `
            <p>Lỗi khi tải dữ liệu từ OpenCritic.</p>
        `;

    }

}

loadReviews();

