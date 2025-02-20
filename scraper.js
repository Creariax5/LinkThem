// scraper.js
window.extractJobDetails = function() {
    try {
        const utils = window.linkedinUtils;
        if (!utils) {
            throw new Error('LinkedIn utils not loaded');
        }

        // Get the applicants count
        const applicantsElement = Array.from(document.querySelectorAll('.tvm__text'))
            .find(el => el.textContent.includes('candidat'));
        const applicantsText = applicantsElement ? applicantsElement.textContent.trim() : '0 candidat';
        const applicantsCount = parseInt(applicantsText.match(/\d+/)?.[0] || '0', 10);

        // Handle posted time more robustly
        const rawPostedTime = utils.getTextContent('.tvm__text.tvm__text--positive');
        let postedTime = null;
        
        if (rawPostedTime) {
            // Check if it contains a number (like "2 days ago", "3 hours ago", etc.)
            const timeMatch = rawPostedTime.match(/\d+/);
            if (timeMatch) {
                const number = parseInt(timeMatch[0]);
                const now = new Date();
                
                if (rawPostedTime.includes('hour') || rawPostedTime.includes('heure')) {
                    postedTime = new Date(now - number * 60 * 60 * 1000);
                } else if (rawPostedTime.includes('day') || rawPostedTime.includes('jour')) {
                    postedTime = new Date(now - number * 24 * 60 * 60 * 1000);
                } else if (rawPostedTime.includes('week') || rawPostedTime.includes('semaine')) {
                    postedTime = new Date(now - number * 7 * 24 * 60 * 60 * 1000);
                } else if (rawPostedTime.includes('month') || rawPostedTime.includes('mois')) {
                    postedTime = new Date(now - number * 30 * 24 * 60 * 60 * 1000);
                }
            } else if (rawPostedTime.includes('Just now') || rawPostedTime.includes('À l\'instant')) {
                postedTime = new Date();
            }
        }

        // If we couldn't parse the time, default to current time
        if (!postedTime) {
            postedTime = new Date();
        }

        // Get matched skills
        const matchedSkills = Array.from(document.querySelectorAll('.job-details-how-you-match__skills-item-subtitle'))
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0);

        const jobDetails = {
            basicInfo: {
                title: utils.getTextContent('h1.job-details-jobs-unified-top-card__job-title') || 'Not specified',
                company: utils.getTextContent('.job-details-jobs-unified-top-card__company-name'),
                location: utils.getTextContent('.job-details-jobs-unified-top-card__primary-description-container .tvm__text'),
                postedTime: postedTime.toISOString(),
                applicants: applicantsCount,
                workplaceType: utils.getTextContent('.ui-label span'),
                jobId: utils.extractJobId()
            },
            companyInfo: {
                size: utils.getTextContent('.jobs-company__inline-information'),
                linkedInFollowers: parseInt(utils.getTextContent('.artdeco-entity-lockup__subtitle')?.match(/\d+/)?.[0] || '0', 10),
                logo: document.querySelector('.ivm-view-attr__img--centered')?.src
            },
            jobDescription: {
                responsibilities: utils.getAllListItems('.jobs-description__content ul'),
                technologies: utils.getTechnologies(utils.getAllListItems('.jobs-description__content ul'))
            },
            skillsAndRequirements: {
                matched: matchedSkills,
                required: Array.from(document.querySelectorAll('.description__job-criteria-text'))
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0)
            },
            benefitsAndPerks: utils.getAllListItems('.jobs-description__content ul:last-of-type'),
            fullDescription: utils.getTextContent('.jobs-description__content'),
            metadata: {
                extracted_timestamp: new Date().toISOString(),
                source_url: window.location.href
            }
        };

        const cleanedDetails = utils.cleanObject(jobDetails);
        console.log('Job details being returned:', JSON.stringify(cleanedDetails, null, 2));
        return cleanedDetails;
    } catch (error) {
        console.error('Error extracting job details:', error);
        throw new Error(`Failed to extract job details: ${error.message}`);
    }
};