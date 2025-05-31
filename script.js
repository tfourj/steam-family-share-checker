async function checkFamilyShare() {
    if (!turnstileReady) {
        alert('Please complete the Turnstile challenge first.');
        return;
    }
    hideFamilyShareStatus();
    const appLink = document.getElementById('appLinkInput').value;

    // Check if a raw app ID is provided
    if (!isNaN(appLink)) {
        appId = handleRawAppId(appLink);
        if (!appId) {
            displayResult1('Invalid Steam App ID', 'white', false);
            return;
          }
    } else {
        appId = extractAppId(appLink);
        if (!appId) {
            displayResult1('Invalid Steam App Link', 'white', false);
            return;
          }
    }

    displayResult1('Fetching data', 'white', true);

    //const url = `https://api.allorigins.win/raw?url=https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`; //Api for testing
    const url = `${CONFIG.API_DOMAIN}/raw?url=https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;

    try {
        const data = await fetchWithRetries(url, 5000, 'json');

        // Move the displayResult('Data received'); here
        displayResult1('Data received', 'white', false);

        
        if (!data || !data[appId] || !data[appId].success || !data[appId].data) {
            throw new Error(`Game data not found for App ID: ${appId}`);
        }

        const gameData = data[appId].data;

        // Check if the game is coming soon
        const comingSoon = gameData.release_date?.coming_soon || false;

        const statusIndicator = document.getElementById('statusIndicator');
        const familyShareStatus = document.getElementById('familyShareStatus');

        if (comingSoon) {
            displayResult1(`${gameData.name} is not released yet.`, 'orange', false);
            statusIndicator.textContent = '⧗'; // Hourglass character
            statusIndicator.style.color = 'orange';
            familyShareStatus.style.display = 'block'; // Show the hidden div
            return;
        }
        
        // Check if the game is free
        const isFree = gameData.is_free || false;

        // If the game is not free, check if it's sharable
        if (!isFree) {
            // Check if the "categories" array includes an object with the "description" "Family Sharing"
            const categories = gameData.categories || [];
            const hasFamilySharing = categories.some(category => category.description === "Family Sharing");

            if (hasFamilySharing) {
                if (disabledFamilyShareApps.includes(appId)) {
                    displayResult1(`${gameData.name} can't be family shared as sharing is internally disabled(still shown as sharable on game's webpage)`, 'red', false);
                    statusIndicator.textContent = '✗'; // Cross mark character
                    statusIndicator.style.color = 'red';
                } else {
                    displayResult1(`${gameData.name} can be shared via Family Sharing.`, 'green', false);
                    statusIndicator.textContent = '✓'; // Checkmark character
                    statusIndicator.style.color = 'green';
                }
            } else {
                displayResult1(`${gameData.name} cannot be shared via Family Sharing.`, 'red', false);
                statusIndicator.textContent = '✗'; // Cross mark character
                statusIndicator.style.color = 'red';
            }

            familyShareStatus.style.display = 'block'; // Show the hidden div

        } else {
            // If the game is free, display that information
            displayResult1(`${gameData.name} is free to play.`, 'white', false);
        }
    } catch (error) {
        console.error('Error checking game details:', error);
        displayResult1('An error occurred while checking game details. Please try to reload the website and try again.', 'white');
    }
}


function extractAppId(url) {
    // Escape special characters to prevent potential code execution
    const match = url.match(/\/app\/(\d+)/);
    return match ? match[1] : null;
  }

function handleRawAppId(appId) {
    if (appId.length < 1 || appId.length > 10 || isNaN(appId)) {
        displayResult1('Invalid Steam App ID format', 'white', false);
        return;
    }
    console.log(`Using raw app ID: ${appId}`);
    return appId;
}

let intervalId1;

function displayResult1(message, color, animatee = false) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.style.color = color;

    // Clear any existing animation interval
    clearInterval(intervalId1);

    if (animatee) {
        let dots = '';
        intervalId1 = setInterval(() => {
            dots += '.';
            result.textContent = message + dots;
            if (dots.length === 4) {
                dots = '';
            }
        }, 500);
    }
}

function clearDisplayResult1() {
    displayResult1("Input a Steam game's link to see if it's family sharable", 'white', false);
}

function hideFamilyShareStatus() {
    const familyShareStatus = document.getElementById('familyShareStatus');
    familyShareStatus.style.display = 'none'; // Hide the div
}

function clearAppLinkInput() {
    const appLink = document.getElementById('appLinkInput');
    appLink.value = '';
}

function clearSteamAppResults() {
    clearAppLinkInput();
    clearDisplayResult1();
    hideFamilyShareStatus();
}