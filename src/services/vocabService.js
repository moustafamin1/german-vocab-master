import Papa from 'papaparse';

const STORAGE_KEY = 'cached-vocab';

// TODO: User to provide this URL
// Example: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ.../pub?gid=0&single=true&output=csv'
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRyZJKM5z9VSCc8DTg95ajKO3LRuo-HsQaAcBX5XCi43w8Hz1MX4dXF1m0l3k7EnjwFbvY2ycZD4Vi/pub?gid=0&single=true&output=csv';

/**
 * Fetches vocabulary from the Google Sheet CSV, parses it, cleans it, and saves it to localStorage.
 * Returns the cleaned vocabulary list.
 */
export const fetchAndCacheVocab = async (customUrl = null) => {
    const url = customUrl || GOOGLE_SHEET_CSV_URL;

    if (!url) {
        throw new Error('Google Sheet CSV URL is not configured. Please add it to src/services/vocabService.js');
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const cleanedData = cleanVocabData(results.data);

                    // Save to local storage
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
                        console.log(`✅ Cached ${cleanedData.length} words to localStorage`);
                        resolve(cleanedData);
                    } catch (err) {
                        console.error('Failed to save to localStorage', err);
                        // Still return data even if caching fails
                        resolve(cleanedData);
                    }
                },
                error: (err) => {
                    reject(err);
                }
            });
        });
    } catch (error) {
        console.error('Error in fetchAndCacheVocab:', error);
        throw error;
    }
};

/**
 * Helper to clean and format the raw CSV data to match the app's internal JSON structure.
 * Replicates logic from scripts/fetch-vocab.js
 */
const cleanVocabData = (rawRows) => {
    return rawRows.map(row => {
        // Helper to safely get trimmed string
        const getVal = (key) => (row[key] || '').trim();

        let word = getVal('Word');
        let type = getVal('Type');

        // Normalize Type (Capitalize first letter, e.g., 'phrase' -> 'Phrase')
        if (type) {
            type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        }

        let article = '';

        // Extract article from word if present
        const articleMatch = word.match(/^(der|die|das)\s+/i);
        if (articleMatch) {
            article = articleMatch[1].toLowerCase();
            word = word.replace(/^(der|die|das)\s+/i, '').trim();
        }

        // Fallback: If no article in word, check if dedicated columns had it
        if (!article) {
            const derValue = getVal('Masculine (der)');
            const dieValue = getVal('Feminine (die)');
            const dasValue = getVal('Neuter (Das)');
            if (derValue && derValue !== '-') article = 'der';
            else if (dieValue && dieValue !== '-') article = 'die';
            else if (dasValue && dasValue !== '-') article = 'das';
        }

        if (!word) return null;

        return {
            word: word,
            type: type,
            english: getVal('English Translation'),
            article: article,
            plural: getVal('Plural'),
            sentence: getVal('A1 Sentence'),
            level: getVal('Level'),
            trivia: getVal('Trivia / Memory Tip'),
            // Initialize stats at 0. SRS merging happens in App.jsx
            successCount: 0,
            failCount: 0
        };
    }).filter(item => item !== null);
};

export const getCachedVocab = () => {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (err) {
        console.error('Error reading cached vocab:', err);
        return null;
    }
};
