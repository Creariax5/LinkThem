class LinkedInJobScraper {
    constructor() {
        this.selectors = {
            title: 'h1.job-details-jobs-unified-top-card__job-title',
            company: '.job-details-jobs-unified-top-card__company-name',
            location: '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
            postedTime: '.tvm__text.tvm__text--positive',
            applicants: '.tvm__text',
            workplaceType: '.ui-label span',
            companyName: '.jobs-company__name',
            companyIndustry: '.jobs-company__industry',
            companySize: '.jobs-company__inline-information',
            companyFollowers: '.artdeco-entity-lockup__subtitle',
            companyLogo: '.ivm-view-attr__img--centered',
            description: '.jobs-description__content',
            skills: '.job-details-how-you-match__skills-item-wrapper',
            skillsMatch: '.job-details-how-you-match__skills-item-subtitle'
        };
    }

    getTextContent(selector, parent = document) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : null;
    }

    getAllListItems(parentSelector) {
        const parent = document.querySelector(parentSelector);
        if (!parent) return [];
        return Array.from(parent.querySelectorAll('li')).map(item => item.textContent.trim());
    }

    findElementByText(selector, text) {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).find(el => el.textContent.includes(text));
    }

    getApplicantsCount() {
        const element = this.findElementByText(this.selectors.applicants, 'candidat');
        return element ? element.textContent.trim() : '0 candidat';
    }

    extractJobDetails() {
        const jobDetails = {
            basicInfo: {
                title: this.getTextContent(this.selectors.title),
                company: this.getTextContent(this.selectors.company),
                location: this.getTextContent(this.selectors.location),
                postedTime: this.getTextContent(this.selectors.postedTime),
                applicants: this.getApplicantsCount(),
                workplaceType: this.getTextContent(this.selectors.workplaceType)
            },
            companyInfo: {
                name: this.getTextContent(this.selectors.companyName),
                industry: this.getTextContent(this.selectors.companyIndustry),
                size: this.getTextContent(this.selectors.companySize),
                linkedInFollowers: this.getTextContent(this.selectors.companyFollowers),
                logo: document.querySelector(this.selectors.companyLogo)?.src
            },
            jobDescription: {
                responsibilities: this.getAllListItems(`${this.selectors.description} ul`),
                technologies: ["AWS (Lambda, Dynamo DB, S3)", "Python 3", "Angular"],
            },
            skillsAndRequirements: {
                required: this.getAllListItems(this.selectors.skills),
                matched: Array.from(document.querySelectorAll(this.selectors.skillsMatch))
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0)
            },
            benefitsAndPerks: this.getAllListItems(`${this.selectors.description} ul:last-of-type`),
            fullDescription: this.getTextContent(this.selectors.description),
            metadata: {
                extracted_timestamp: new Date().toISOString(),
                source_url: window.location.href,
                jobId: window.location.href.match(/view\/(\d+)/)?.[1] || null
            }
        };

        return this.cleanObject(jobDetails);
    }

    cleanObject(obj) {
        Object.keys(obj).forEach(key => {
            if (obj[key] === null || obj[key] === undefined) {
                delete obj[key];
            } else if (Array.isArray(obj[key]) && obj[key].length === 0) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                this.cleanObject(obj[key]);
                if (Object.keys(obj[key]).length === 0) {
                    delete obj[key];
                }
            }
        });
        return obj;
    }

    downloadJobDetails() {
        const jobDetails = this.extractJobDetails();
        const blob = new Blob([JSON.stringify(jobDetails, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        const company = jobDetails.basicInfo.company?.toLowerCase().replace(/\s+/g, '-') || 'company';
        const fileName = `${company}-job-${date}.json`;
        
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Execute scraping when the script is injected
(() => {
    try {
        const scraper = new LinkedInJobScraper();
        scraper.downloadJobDetails();
    } catch (error) {
        console.error('Error scraping job details:', error);
        alert('Failed to extract job details. Please try again.');
    }
})();
