import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SPREADSHEET_ID = '1BkMnDlxI7jCvEnr5xJmn_YPnLLqbsZ6smjEn5-yd738';
const TABS = [
    { name: 'Sheet1', type: null },       // Vocab (Nouns, Phrases) — type comes from column
    { name: 'Sheet5', type: 'Grammar' }   // Grammar — hardcoded type
];
const DATA_DIR = path.join(process.cwd(), 'src/data');
const OUTPUT_PATH = path.join(DATA_DIR, 'vocab.json');

// Helper to run python script commands for a given tab
const runGSheetsCmd = (cmd, tabName, ...args) => {
    const escapedArgs = args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ');
    const fullCmd = `source ~/.gemini/antigravity/gsheets-venv/bin/activate && python3 ~/.gemini/antigravity/skills/google-sheets/scripts/gsheets.py ${cmd} ${SPREADSHEET_ID} "${tabName}" ${escapedArgs}`;
    return execSync(fullCmd, { shell: '/bin/zsh', encoding: 'utf-8' });
};

/**
 * Parse Sheet1 rows (Vocab: Nouns & Phrases)
 */
function parseVocabRows(rows, statsMap) {
    let headers = rows[0].map(h => h.trim());
    const headerMap = {};
    headers.forEach((h, i) => { headerMap[h] = i; });

    return rows.slice(1).map(row => {
        const getVal = (colName) => (row[headerMap[colName]] || '').trim();

        let word = getVal('Word');
        let english = getVal('English Translation');
        let type = getVal('Type');
        if (type) {
            type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        }

        let article = '';
        const articleMatch = word.match(/^(der|die|das)\s+/i);
        if (articleMatch && type !== 'Phrase') {
            article = articleMatch[1].toLowerCase();
            word = word.replace(/^(der|die|das)\s+/i, '').trim();
        }
        if (!article) {
            const derValue = getVal('Masculine (der)');
            const dieValue = getVal('Feminine (die)');
            const dasValue = getVal('Neuter (Das)');
            if (derValue && derValue !== '-') article = 'der';
            else if (dieValue && dieValue !== '-') article = 'die';
            else if (dasValue && dasValue !== '-') article = 'das';
        }

        const slug = `${english}-${word}`;
        const stats = statsMap.get(slug) || { successCount: 0, failCount: 0, status: 'study' };

        if (!word) return null;

        return {
            word, type, english, article,
            plural: getVal('Plural'),
            sentence: getVal('A1 Sentence'),
            level: getVal('Level'),
            trivia: getVal('Trivia / Memory Tip'),
            successCount: stats.successCount,
            failCount: stats.failCount,
            status: stats.status
        };
    }).filter(item => item !== null);
}

/**
 * Parse Sheet5 rows (Grammar: fill-in-the-blank)
 * Columns: Phrase | Word | Combined Phrase | English Translation | Wrong choices | Memory tip
 */
function parseGrammarRows(rows, statsMap) {
    let headers = rows[0].map(h => h.trim());
    const headerMap = {};
    headers.forEach((h, i) => { headerMap[h] = i; });

    return rows.slice(1).map(row => {
        const getVal = (colName) => (row[headerMap[colName]] || '').trim();

        const word = getVal('Word');            // The correct answer (e.g. "Diese")
        const phrase = getVal('Phrase');          // The sentence with ______ blank
        const english = getVal('English Translation');
        const trivia = getVal('Memory tip');
        const wrongStr = getVal('Wrong choices');
        const wrongChoices = wrongStr ? wrongStr.split('/').map(s => s.trim()) : [];

        const slug = `${english}-${word}`;
        const stats = statsMap.get(slug) || { successCount: 0, failCount: 0, status: 'study' };

        if (!word && !phrase) return null;

        return {
            word,
            type: 'Grammar',
            english,
            article: '',
            plural: '',
            sentence: '',
            level: 'Grammar',
            trivia,
            phrase,
            wrongChoices,
            successCount: stats.successCount,
            failCount: stats.failCount,
            status: stats.status
        };
    }).filter(item => item !== null);
}

function fetchAndSyncVocab() {
    try {
        console.log('🔄 Fetching vocabulary from Google Sheets...');

        // Load existing local data for stats preservation
        let localData = [];
        if (fs.existsSync(OUTPUT_PATH)) {
            localData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        }
        const statsMap = new Map();
        localData.forEach(item => {
            const slug = `${item.english}-${item.word}`;
            statsMap.set(slug, {
                successCount: item.successCount || 0,
                failCount: item.failCount || 0,
                status: item.status || 'study'
            });
        });

        let allItems = [];

        for (const tab of TABS) {
            console.log(`  📄 Reading "${tab.name}"...`);
            const rawResult = runGSheetsCmd('read', tab.name);
            const rows = JSON.parse(rawResult);

            if (!rows || rows.length <= 1) {
                console.warn(`  ⚠️ No data in "${tab.name}", skipping.`);
                continue;
            }

            let items;
            if (tab.type === 'Grammar') {
                items = parseGrammarRows(rows, statsMap);
            } else {
                items = parseVocabRows(rows, statsMap);
            }

            console.log(`  ✅ Parsed ${items.length} items from "${tab.name}"`);
            allItems = allItems.concat(items);
        }

        // Save combined data
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allItems, null, 2));
        console.log(`🎉 Successfully synced ${allItems.length} total items to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('❌ Error syncing vocab:', error.message);
        if (error.stdout) console.log(error.stdout.toString());
        if (error.stderr) console.error(error.stderr.toString());
        process.exit(1);
    }
}

fetchAndSyncVocab();

