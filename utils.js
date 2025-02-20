// utils.js
window.linkedinUtils = {
    // DOM helper functions
    getTextContent: function(selector, parent = document) {
        const element = parent.querySelector(selector);
        return element ? element.textContent.trim() : null;
    },

    getAllListItems: function(parentSelector) {
        const parent = document.querySelector(parentSelector);
        if (!parent) return [];
        const items = parent.querySelectorAll('li');
        return Array.from(items).map(item => item.textContent.trim());
    },

    extractJobId: function() {
        const urlMatch = window.location.pathname.match(/jobs\/view\/(\d+)/);
        if (urlMatch) return urlMatch[1];
        
        const urlParams = new URLSearchParams(window.location.search);
        const currentJobId = urlParams.get('currentJobId');
        if (currentJobId) return currentJobId;
        
        return null;
    },

    getTechnologies: function(items) {
        const techKeywords = [
            'aws', 'python', 'angular', 'javascript', 'react', 
            'node', 'java', 'c#', '.net', 'php', 'ruby',
            'docker', 'kubernetes', 'sql', 'mongodb'
        ];
        return items.filter(item => 
            techKeywords.some(keyword => item.toLowerCase().includes(keyword))
        );
    },

    // Clean object by removing null/empty values
    cleanObject: function(obj) {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value && (!Array.isArray(value) || value.length > 0)) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    const cleaned = this.cleanObject(value);
                    if (Object.keys(cleaned).length > 0) {
                        acc[key] = cleaned;
                    }
                } else {
                    acc[key] = value;
                }
            }
            return acc;
        }, {});
    }
};