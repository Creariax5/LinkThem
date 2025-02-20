document.getElementById('extractBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => {
                function getTextContent(selector, parent = document) {
                    const element = parent.querySelector(selector);
                    return element ? element.textContent.trim() : null;
                }

                function getAllListItems(parentSelector) {
                    const parent = document.querySelector(parentSelector);
                    if (!parent) return [];
                    const items = parent.querySelectorAll('li');
                    return Array.from(items).map(item => item.textContent.trim());
                }

                // Extract job ID using multiple methods
                function extractJobId() {
                    const urlMatch = window.location.pathname.match(/jobs\/view\/(\d+)/);
                    if (urlMatch) return urlMatch[1];
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    const currentJobId = urlParams.get('currentJobId');
                    if (currentJobId) return currentJobId;
                    
                    return null;
                }

                // Get the applicants count
                const applicantsElement = Array.from(document.querySelectorAll('.tvm__text'))
                    .find(el => el.textContent.includes('candidat'));
                const applicantsText = applicantsElement ? applicantsElement.textContent.trim() : '0 candidat';
                const applicantsCount = parseInt(applicantsText.match(/\d+/)?.[0] || '0', 10);

                // Get basic job information
                const jobDetails = {
                    basicInfo: {
                        title: getTextContent('h1.job-details-jobs-unified-top-card__job-title') || 'Not specified',
                        company: getTextContent('.job-details-jobs-unified-top-card__company-name'),
                        location: getTextContent('.job-details-jobs-unified-top-card__primary-description-container .tvm__text'),
                        postedTime: getTextContent('.tvm__text.tvm__text--positive'),
                        applicants: applicantsCount,
                        workplaceType: getTextContent('.ui-label span')
                    },

                    companyInfo: {
                        size: getTextContent('.jobs-company__inline-information'),
                        linkedInFollowers: parseInt(getTextContent('.artdeco-entity-lockup__subtitle')?.match(/\d+/)?.[0] || '0', 10),
                        logo: document.querySelector('.ivm-view-attr__img--centered')?.src
                    },

                    jobDescription: {
                        responsibilities: getAllListItems('.jobs-description__content ul'),
                        technologies: getAllListItems('.jobs-description__content ul').filter(item => 
                            item.toLowerCase().includes('aws') || 
                            item.toLowerCase().includes('python') || 
                            item.toLowerCase().includes('angular') ||
                            item.toLowerCase().includes('javascript') ||
                            item.toLowerCase().includes('react'))
                    },

                    skillsAndRequirements: {
                        matched: Array.from(document.querySelectorAll('.job-details-how-you-match__skills-item-subtitle'))
                            .map(el => el.textContent.trim())
                            .filter(text => text.length > 0)
                    },

                    benefitsAndPerks: getAllListItems('.jobs-description__content ul:last-of-type'),

                    fullDescription: getTextContent('.jobs-description__content'),

                    metadata: {
                        extracted_timestamp: new Date().toISOString(),
                        source_url: window.location.href
                    }
                };

                // Clean null values and empty arrays
                const cleanObject = (obj) => {
                    Object.keys(obj).forEach(key => {
                        if (obj[key] === null || obj[key] === undefined) {
                            delete obj[key];
                        } else if (Array.isArray(obj[key]) && obj[key].length === 0) {
                            delete obj[key];
                        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                            cleanObject(obj[key]);
                            if (Object.keys(obj[key]).length === 0) {
                                delete obj[key];
                            }
                        }
                    });
                    return obj;
                };

                const cleanedJobDetails = cleanObject(jobDetails);

                // Send data to API
                fetch('https://link-them-api.vercel.app/jobs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cleanedJobDetails)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                    // Show success message to user
                    const successMessage = document.createElement('div');
                    successMessage.style.position = 'fixed';
                    successMessage.style.top = '20px';
                    successMessage.style.left = '50%';
                    successMessage.style.transform = 'translateX(-50%)';
                    successMessage.style.backgroundColor = '#4CAF50';
                    successMessage.style.color = 'white';
                    successMessage.style.padding = '15px';
                    successMessage.style.borderRadius = '5px';
                    successMessage.style.zIndex = '10000';
                    successMessage.textContent = 'Job details successfully saved!';
                    document.body.appendChild(successMessage);
                    setTimeout(() => successMessage.remove(), 3000);
                })
                .catch((error) => {
                    console.error('Error:', error);
                    // Show error message to user
                    const errorMessage = document.createElement('div');
                    errorMessage.style.position = 'fixed';
                    errorMessage.style.top = '20px';
                    errorMessage.style.left = '50%';
                    errorMessage.style.transform = 'translateX(-50%)';
                    errorMessage.style.backgroundColor = '#f44336';
                    errorMessage.style.color = 'white';
                    errorMessage.style.padding = '15px';
                    errorMessage.style.borderRadius = '5px';
                    errorMessage.style.zIndex = '10000';
                    errorMessage.textContent = 'Error saving job details. Please try again.';
                    document.body.appendChild(errorMessage);
                    setTimeout(() => errorMessage.remove(), 3000);
                });
            }
        });
    });
});