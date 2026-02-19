import Papa from 'papaparse';

const STORAGE_KEY = 'cached-vocab';

// TODO: User to provide this URL
// Example: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ.../pub?gid=0&single=true&output=csv'
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRyZJKM5z9VSCc8DTg95ajKO3LRuo-HsQaAcBX5XCi43w8Hz1MX4dXF1m0l3k7EnjwFbvY2ycZD4Vi/pub?gid=0&single=true&output=csv';
const GOOGLE_SHEET_GRAMMAR_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRyZJKM5z9VSCc8DTg95ajKO3LRuo-HsQaAcBX5XCi43w8Hz1MX4dXF1m0l3k7EnjwFbvY2ycZD4Vi/pub?gid=624571091&single=true&output=csv';

/**
 * Fetches vocabulary from the Google Sheet CSV, parses it, cleans it, and saves it to localStorage.
 * Returns the cleaned vocabulary list.
 */
export const fetchAndCacheVocab = async (customUrl = null) => {
    // If customUrl is provided, we only fetch that one (legacy behavior)
    if (customUrl) {
        return fetchSingleSheet(customUrl);
    }

    try {
        console.log('🔄 Syncing all sheets...');
        const [sheet1Data, sheet5Data] = await Promise.all([
            fetchSingleSheet(GOOGLE_SHEET_CSV_URL),
            fetchSingleSheet(GOOGLE_SHEET_GRAMMAR_URL, 'Grammar')
        ]);

        const combinedData = [...sheet1Data, ...sheet5Data];

        if (combinedData.length === 0) {
            throw new Error('Sync returned zero items. Aborting cache update to prevent data loss.');
        }

        // Save to local storage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(combinedData));
            console.log(`✅ Cached ${combinedData.length} total items to localStorage`);
        } catch (err) {
            console.error('Failed to save to localStorage', err);
        }

        return combinedData;
    } catch (error) {
        console.error('Error in fetchAndCacheVocab:', error);
        throw error;
    }
};

const fetchSingleSheet = async (url, hardcodedType = null) => {
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
                const cleanedData = cleanVocabData(results.data, hardcodedType);
                resolve(cleanedData);
            },
            error: (err) => {
                reject(err);
            }
        });
    });
};

/**
 * Helper to clean and format the raw CSV data to match the app's internal JSON structure.
 * Replicates logic from scripts/fetch-vocab.js
 */
const cleanVocabData = (rawRows, hardcodedType = null) => {
    return rawRows.map(row => {
        // Helper to safely get trimmed string
        const getVal = (key) => (row[key] || '').trim();

        let word = '';
        let type = '';
        let english = '';
        let trivia = '';
        let phrase = '';
        let wrongChoices = [];

        if (hardcodedType === 'Grammar') {
            word = getVal('Word');
            type = 'Grammar';
            english = getVal('English Translation');
            trivia = getVal('Memory tip');
            phrase = getVal('Phrase');
            const wrongStr = getVal('Wrong choices');
            wrongChoices = wrongStr ? wrongStr.split('/').map(s => s.trim()) : [];
        } else {
            word = getVal('Word');
            type = getVal('Type');
            english = getVal('English Translation');
            trivia = getVal('Trivia / Memory Tip');

            // Normalize Type (Capitalize first letter, e.g., 'phrase' -> 'Phrase')
            if (type) {
                type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            }
        }

        let article = '';

        if (type !== 'Grammar') {
            // Extract article from word if present (ONLY for non-Phrases/Grammar)
            const articleMatch = word.match(/^(der|die|das)\s+/i);
            if (articleMatch && type !== 'Phrase') {
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
        }

        if (!word && !phrase) return null;

        return {
            word: word,
            type: type,
            english: english,
            article: article,
            plural: getVal('Plural'),
            sentence: getVal('A1 Sentence'),
            level: type === 'Grammar' ? 'Grammar' : getVal('Level'),
            trivia: trivia,
            phrase: phrase,
            wrongChoices: wrongChoices,
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
