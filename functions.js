async function fetchWithRetries(url, maxTotalTime = 5000, responseType = 'text') {
    const startTime = Date.now();

    while (Date.now() - startTime < maxTotalTime) {
        try {
            const response = await fetch(url);
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

async function checkAppStatus() {
    try {
        const response = await fetch('https://13584595.xyz/status');
        const data = await response.json();
        const statusIndicator = document.getElementById('statusIndicator');
        if (data.active) {
            statusIndicator.textContent = '🟢'; // Green Circle
        } else {
            statusIndicator.textContent = '🔴'; // Red Circle
        }
    } catch (error) {
        console.error('Error fetching app status:', error);
        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.textContent = '🔴'; // Set to red in case of error
    }
}