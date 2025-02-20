const API_URL = 'https://localhost:3000/api/v1/jobs';
const MAX_RETRIES = 3;
const TIMEOUT = 3000; // 30 seconds

async function makeRequest(data, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        console.log('Making request to API:', API_URL);
        console.log('Request data:', data);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Retry-Count': retryCount.toString()
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
        return { success: true, data: result };

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('API Request error:', error);

        // Handle different types of errors
        if (error.name === 'AbortError') {
            return { success: false, error: 'Request timed out. Please try again.' };
        }

        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            return makeRequest(data, retryCount + 1);
        }

        return { 
            success: false, 
            error: 'Network error. Please check your internet connection and try again.' 
        };
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SAVE_JOB') {
        console.log('Received SAVE_JOB request');
        
        makeRequest(request.data)
            .then(response => {
                console.log('Sending response back to content script:', response);
                sendResponse(response);
            })
            .catch(error => {
                console.error('Error in background script:', error);
                sendResponse({ 
                    success: false, 
                    error: 'Internal extension error' 
                });
            });

        return true; // Keep the message channel open
    }
});