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
                gameItem.classList.add('game-card');
                gameItem.innerHTML = `
                    <div class="game-card-content">
                        <img src="${logoUrl}" alt="${name}" class="game-image">
                        <div class="game-info">
                            <h3 class="game-title">${name}</h3>
                            <p class="game-meta">App ID: ${appId}</p>
                            <p class="game-price">${price}</p>
                        </div>
                        <div class="game-actions">
                            <button class="btn btn-primary" onclick="selectGame('${appId}'); event.stopPropagation();">Check Family Share</button>
                        </div>
                    </div>
                `;
                gameList.appendChild(gameItem);

                gameItem.addEventListener('click', (event) => {
                    const buttonClicked = event.target.tagName.toLowerCase() === 'button';
                    if (!buttonClicked) {
                        searchFieldClicked(appId);
                    }
                });
            }
        });
        
        // Clear the status display after successfully displaying games
        clearDisplayResult();
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
    clearDisplayResult(); // Hide the status bar when clearing results
}

let intervalId; // Define intervalId outside the function

function displayResult(message, color, animate = false) {
    const searchStatus = document.getElementById('searchStatus');
    
    // Show the element and apply proper styling
    searchStatus.style.display = 'block';
    
    // Apply color styling
    if (color === 'green') {
        searchStatus.className = 'status-display status-success';
    } else if (color === 'red') {
        searchStatus.className = 'status-display status-error';
    } else if (color === 'orange') {
        searchStatus.className = 'status-display status-warning';
    } else {
        searchStatus.className = 'status-display';
    }

    // Clear any existing animation interval
    clearInterval(intervalId);

    if (animate) {
        searchStatus.classList.add('loading-dots');
        let dots = '';
        intervalId = setInterval(() => {
            dots += '.';
            searchStatus.textContent = message + dots;
            if (dots.length === 4) {
                dots = '';
            }
        }, 500);
    } else {
        searchStatus.classList.remove('loading-dots');
        searchStatus.innerHTML = message; // Set innerHTML to display HTML content
    }
}

function clearDisplayResult() {
    const searchStatus = document.getElementById('searchStatus');
    
    clearInterval(intervalId); // Stop the animation interval
    searchStatus.textContent = ''; // Clear the text content
    searchStatus.className = ''; // Remove all classes including status-display
    searchStatus.style.display = 'none'; // Hide the element completely
}

function correctNameSearch(correctName) {
    document.getElementById('searchInput').value = correctName;
    searchGames();
}