async function searchGames() {
    const searchInput = document.getElementById('searchInput').value.trim();
    if (!searchInput) {
        alert('Please enter a game name.');
        return;
    }

    try {
        const response = await fetch(`https://api.allorigins.win/raw?url=https://store.steampowered.com/search/results/?term=${encodeURIComponent(searchInput)}&count=10`);
        if (!response.ok) {
            throw new Error(`Failed to fetch game search results. Status: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const games = doc.querySelectorAll('#search_resultsRows a');

        const gameList = document.getElementById('gameList');
        gameList.innerHTML = '';

        games.forEach((game, index) => {
            if (index < 10) { // Limit to first 10 search results
                const name = game.querySelector('.title').textContent.trim();
                const appId = game.getAttribute('data-ds-appid');
                const price = game.querySelector('.discount_final_price').textContent.trim();
                const logoUrl = game.querySelector('.search_capsule img').src;

                const gameItem = document.createElement('div');
                gameItem.classList.add('gameItem');
                gameItem.innerHTML = `
                    <div class="searchResult" style="display: flex; align-items: center; cursor: pointer;">
                        <img src="${logoUrl}" alt="${name}" style="width: 50px; height: auto; max-height: 50px; margin-right: 10px; object-fit: contain;">
                        <div>
                            <p>${name}</p>
                            <p style="font-size: smaller;">AppID: ${appId}</p>
                        </div>
                        <div style="margin-left: auto;">
                            <p style="font-size: smaller;">$${price}</p>
                            <button onclick="selectGame('${appId}')">Check Family Share</button>
                        </div>
                    </div>
                `;
                gameList.appendChild(gameItem);

                gameItem.addEventListener('click', () => {
                    const buttonClicked = event.target.tagName.toLowerCase() === 'button';
                    if (!buttonClicked) {
                        searchFieldClicked(appId);
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error searching games:', error);
    }
}

function searchFieldClicked(appId) {
    const confirmation = confirm(`Do you want to check family share for the selected game with ID: ${appId}?`);
    if (confirmation) {
        selectGame(appId);
    }
}

function selectGame(appId) {
    const transformedAppId = `https://store.steampowered.com/app/${appId}/`;
    document.getElementById('appLinkInput').value = transformedAppId;
    checkFamilyShare();
    clearSearchResults();
}

function clearSearchResults() {
    const gameList = document.getElementById('gameList');
    gameList.innerHTML = '';
}
