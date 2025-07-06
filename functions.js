let globalAuthKey = null;
let turnstileToken = null;
let turnstileReady = false;

// Cloudflare Turnstile callback
function turnstileCallback(token) {
    turnstileToken = token;
    getAuthKey(turnstileToken).then(authKey => {
        globalAuthKey = authKey;
    });
    turnstileReady = true;
    document.getElementById('searchInput').disabled = false;
    document.getElementById('appLinkInput').disabled = false;
    document.querySelectorAll('button').forEach(btn => btn.disabled = false);
}

// Turnstile expired
function turnstileExpiredCallback() {
    turnstileReady = false;
    globalAuthKey = null;
    document.getElementById('searchInput').disabled = true;
    document.getElementById('appLinkInput').disabled = true;
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    if (confirm('Turnstile session expired. Do you want to retry the challenge?')) {
        if (window.turnstile) {
            turnstile.reset(); // Resets the Turnstile widget
        }
    }
}

// Turnstile error
function turnstileErrorCallback() {
    turnstileReady = false;
    globalAuthKey = null;
    if (confirm('Turnstile encountered an error. Do you want to retry the challenge?')) {
        if (window.turnstile) {
            turnstile.reset();
        }
    }
}

// Fetch authKey using the Turnstile token
async function getAuthKey(token) {
    const res = await fetch(`${CONFIG.API_DOMAIN}/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    if (!res.ok) throw new Error('Failed to get authKey');
    const { authKey } = await res.json();
    if (!authKey) throw new Error('authKey missing');
    return authKey;
}

async function checkAppStatus() {
    try {
        const response = await fetch(CONFIG.APP_STATUS_URL);
        const text = await response.text(); 
        console.log('Response:', text);
        const fetchstatusIndicator = document.getElementById('fetchstatusIndicator');
        if (text.includes('Status') && text.includes('Up') && text.indexOf('Status') < text.indexOf('Up')) {
            fetchstatusIndicator.textContent = '🟢 Online'; // Green Circle
        } else if (text.includes('Status') && text.includes('Pending') && text.indexOf('Status') < text.indexOf('Pending')) {
            fetchstatusIndicator.textContent = '🟡 Pending...'; // Yellow Circle
        } else if (text.includes('Status') && text.includes('Down') && text.indexOf('Status') < text.indexOf('Down')) {
            fetchstatusIndicator.textContent = '🔴 Offline'; // Red Circle
        } else {
            fetchstatusIndicator.textContent = '🔴 Offline'; // Red Circle
        }
    } catch (error) {
        console.error('Error fetching app status:', error);
        const fetchstatusIndicator = document.getElementById('fetchstatusIndicator');
        fetchstatusIndicator.textContent = '🔴 Offline (Error)'; // Set to red in case of error
    }
}


async function fetchWithRetries(url, maxTotalTime = 5000, responseType = 'text') {
    const startTime = Date.now();

    while (Date.now() - startTime < maxTotalTime) {
        try {
            const options = {};
            if (globalAuthKey) {
                options.headers = { 'x-auth-key': globalAuthKey };
            }
            const response = await fetch(url, options);
            if (response.ok) {
                if (responseType === 'json') {
                    return await response.json(); // Return JSON if specified
                } else {
                    return await response.text(); // Default to text
                }
            } else {
                throw new Error(`Failed to fetch. Status: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Fetch attempt failed:', error);
            await new Promise(resolve => setTimeout(resolve, 500));
            if (Date.now() - startTime >= maxTotalTime) {
                throw new Error('Max total fetch time exceeded');
            }
        }
    }
    throw new Error('Unable to fetch within the allowed time frame');
}

document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            if (document.activeElement.id === "appLinkInput") {
                event.preventDefault();
                checkFamilyShare();
            } else if (document.activeElement.id === "searchInput") {
                event.preventDefault();
                searchGames();
            }
        }
    });
});