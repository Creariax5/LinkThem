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

        const jobDetails = {
            basicInfo: {
                title: utils.getTextContent('h1.job-details-jobs-unified-top-card__job-title') || 'Not specified',
                company: utils.getTextContent('.job-details-jobs-unified-top-card__company-name'),
                location: utils.getTextContent('.job-details-jobs-unified-top-card__primary-description-container .tvm__text'),
                postedTime: utils.getTextContent('.tvm__text.tvm__text--positive'),
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
                matched: Array.from(document.querySelectorAll('.job-details-how-you-match__skills-item-subtitle'))
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

        return utils.cleanObject(jobDetails);
    } catch (error) {
        console.error('Error extracting job details:', error);
        throw new Error(`Failed to extract job details: ${error.message}`);
    }
};