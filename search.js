async function searchGames() {
    if (!turnstileReady) {
        alert('Please complete the Turnstile challenge first.');
        return;
    }
    const searchInput = document.getElementById('searchInput').value.trim();
    if (!searchInput) {
        alert('Please enter a game name.');
        return;
    }

    displayResult('Fetching game data', 'white', true);

    //const url = `https://api.allorigins.win/raw?url=https://store.steampowered.com/search/results/?term=${encodeURIComponent(searchInput)}&count=10&l=english`;
    const url = `${CONFIG.API_DOMAIN}/raw?url=https://store.steampowered.com/search/results/?term=${encodeURIComponent(searchInput)}&count=10&l=english`;

    try {
        const html = await fetchWithRetries(url, 5000, 'text'); // Total of 10 seconds for all attempts
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const games = doc.querySelectorAll('#search_resultsRows a');

        const gameList = document.getElementById('gameList');
        gameList.innerHTML = '';

        if (games.length === 0) {
            const suggestionElement = doc.querySelector('.search_results_spellcheck_suggestion');
            const suggestion = suggestionElement ? suggestionElement.textContent.trim() : null;
            const correctNameMatch = suggestionElement ? suggestionElement.innerHTML.match(/ReplaceTerm\( &quot;(.+?)&quot; \)/) : null;
            const correctName = correctNameMatch ? correctNameMatch[1] : null;
            if (suggestion) {
                displayResult(`No results found. Did you mean "<a href="#" id="suggestedTerm" style="color: cyan;">${correctName}</a>"?`, 'red', false);
                if (correctName) {
                    setTimeout(() => {
                        const suggestedTermElement = document.getElementById('suggestedTerm');
                        if (suggestedTermElement) {
                            suggestedTermElement.addEventListener('click', (event) => {
                                event.preventDefault();
                                correctNameSearch(correctName);
                            });
                        }
                    }, 100); // Delay to ensure the HTML is rendered
                }
            } else {
                displayResult('No results found. Check if game name is spelled correctly.', 'red', false);
            }
            return;
        }
        games.forEach((game, index) => {
            if (index < 10) { // Limit to first 10 search results
                const titleElement = game.querySelector('.title');
                if (!titleElement) return; // Skip if title element is not found

                const name = titleElement.textContent.trim();
                const appId = game.getAttribute('data-ds-appid');
                const priceElement = game.querySelector('.discount_final_price');
                const price = priceElement ? priceElement.textContent.trim() : 'Price not available';
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
                            <p style="font-size: smaller;">${price}</p>
                            <button onclick="selectGame('${appId}')">Check Family Share</button>
                        </div>
                    </div>
                `;
                gameList.appendChild(gameItem);
                // displayResult('Game list found and displayed.', 'white', false);
                clearDisplayResult();

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
        displayResult('An error occurred while fetching game data. Please reload the website and try to search for game again.', 'white', false); // Display error status
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
    document.getElementById('searchInput').value = '';
    gameList.innerHTML = '';
}

let intervalId; // Define intervalId outside the function

function displayResult(message, color, animate = false) {
    const searchStatus = document.getElementById('searchStatus'); // Get search status element
    searchStatus.textContent = message;
    searchStatus.style.color = color;

    // Clear any existing animation interval
    clearInterval(intervalId);

    if (animate) {
        let dots = '';
        intervalId = setInterval(() => {
            dots += '.';
            searchStatus.textContent = message + dots;
            if (dots.length === 4) {
                dots = '';
            }
        }, 500);
    } else {
        searchStatus.innerHTML = message; // Set innerHTML to display HTML content
    }
}

function clearDisplayResult() {
    displayResult();
    const searchStatus = document.getElementById('searchStatus');
    searchStatus.textContent = ''; // Clear the text content
}

function correctNameSearch(correctName) {
    document.getElementById('searchInput').value = correctName;
    searchGames();
}