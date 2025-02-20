// popup.js
document.getElementById('extractBtn').addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // First inject utils.js
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['utils.js']
        });

        // Small delay to ensure utils are loaded
        await new Promise(resolve => setTimeout(resolve, 100));

        // Then inject scraper.js
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scraper.js']
        });

        // Small delay to ensure scraper is loaded
        await new Promise(resolve => setTimeout(resolve, 100));

        // Execute the extraction logic
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                try {
                    if (!window.linkedinUtils) {
                        throw new Error('LinkedIn utils not loaded');
                    }
                    if (typeof window.extractJobDetails !== 'function') {
                        throw new Error('Extraction function not properly loaded');
                    }
                    const jobDetails = window.extractJobDetails();
                    return { success: true, data: jobDetails };
                } catch (error) {
                    console.error('Extraction error:', error);
                    return { success: false, error: error.message };
                }
            }
        });

        const result = results[0].result;
        
        if (result.success) {
            // Send the data to background script
            chrome.runtime.sendMessage(
                { 
                    type: 'SAVE_JOB',
                    data: result.data
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Runtime error:', chrome.runtime.lastError);
                        alert('Error communicating with the extension');
                        return;
                    }
                    
                    if (response.success) {
                        alert('Job details successfully saved!');
                    } else {
                        alert(response.error || 'Failed to save job details');
                    }
                }
            );
        } else {
            alert(result.error || 'Failed to extract job details');
        }
        
    } catch (error) {
        console.error('Script injection failed:', error);
        alert('Failed to start extraction: ' + error.message);
    }
});