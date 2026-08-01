function randomGames(amount){

    const copy=[...GAME_DATABASE];

    copy.sort(()=>Math.random()-0.5);

    return copy.slice(0,amount);

}

const featured=randomGames(3);

const container=document.getElementById("topRated");

container.innerHTML=featured.map(game=>`

<div class="game-card">

<img src="${game.image}">

    <div class="info">
        <h3>${game.name}</h3>
        <p class="rating">⭐ ${game.score}</p>
        <p>${game.genre}</p>
        <a href="reviews.html?id=${game.id}" class="detail-btn">Xem đánh giá</a>
    </div>

</div>

`).join("");


