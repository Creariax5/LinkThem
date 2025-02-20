const API_URL = 'https://link-them-api.vercel.app/api/v1/jobs';
const MAX_RETRIES = 3;
const TIMEOUT = 3000;

async function makeRequest(data, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        // Add default skillsAndRequirements if missing
        const processedData = {
            ...data,
            skillsAndRequirements: {
                matched: [],
                required: []
            }
        };

        // If skills data exists in the original data, use it instead of defaults
        if (data.skillsAndRequirements) {
            processedData.skillsAndRequirements = {
                matched: Array.isArray(data.skillsAndRequirements.matched) 
                    ? data.skillsAndRequirements.matched 
                    : [],
                required: Array.isArray(data.skillsAndRequirements.required)
                    ? data.skillsAndRequirements.required
                    : []
            };
        }

        console.log('Making request to API:', API_URL);
        console.log('Final request payload:', JSON.stringify(processedData, null, 2));
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Retry-Count': retryCount.toString()
            },
            body: JSON.stringify(processedData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
        return { success: true, data: result };

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('API Request error:', error);

        if (error.name === 'AbortError') {
            return { success: false, error: 'Request timed out. Please try again.' };
        }

        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
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

        return true;
    }
});