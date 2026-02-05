import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const SPREADSHEET_ID = '1BkMnDlxI7jCvEnr5xJmn_YPnLLqbsZ6smjEn5-yd738';
const TAB_NAME = 'Sheet1';
const DATA_DIR = path.join(process.cwd(), 'src/data');
const OUTPUT_PATH = path.join(DATA_DIR, 'vocab.json');

// Helper to run python script commands
const runGSheetsCmd = (cmd, ...args) => {
    // Escape arguments for shell safety
    const escapedArgs = args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ');
    const fullCmd = `source ~/.gemini/antigravity/gsheets-venv/bin/activate && python3 ~/.gemini/antigravity/skills/google-sheets/scripts/gsheets.py ${cmd} ${SPREADSHEET_ID} "${TAB_NAME}" ${escapedArgs}`;
    return execSync(fullCmd, { shell: '/bin/zsh', encoding: 'utf-8' });
};

function fetchAndSyncVocab() {
    let tempFilePath = null;
    try {
        console.log('🔄 Fetching vocabulary from Google Sheets...');

        // 1. READ Data
        const rawResult = runGSheetsCmd('read');
        let rows = JSON.parse(rawResult);

        if (!rows || rows.length <= 1) {
            console.error('❌ No data found in sheet.');
            return;
        }

        let headers = rows[0];
        // Normalize headers to trim spaces
        headers = headers.map(h => h.trim());

        // 2. MERGE with Local Data
        console.log('🔗 Merging with local data...');

        let localData = [];
        if (fs.existsSync(OUTPUT_PATH)) {
            localData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        }

        // Create a map of existing stats by slug (English-German)
        const statsMap = new Map();
        localData.forEach(item => {
            const slug = `${item.english}-${item.word}`;
            statsMap.set(slug, {
                successCount: item.successCount || 0,
                failCount: item.failCount || 0,
                status: item.status || 'study'
            });
        });

        // Map fresh data to our JSON structure
        const headerMap = {};
        headers.forEach((h, i) => { headerMap[h] = i; });

        const newVocabList = rows.slice(1).map(row => {
            const getVal = (colName) => (row[headerMap[colName]] || '').trim();

            let word = getVal('Word');
            let english = getVal('English Translation');
            const slug = `${english}-${word}`;

            // Get stats from map or default to 0
            const stats = statsMap.get(slug) || { successCount: 0, failCount: 0 };

            let article = '';
            let type = getVal('Type');

            // Extract article from word if present
            const articleMatch = word.match(/^(der|die|das)\s+/i);
            if (articleMatch) {
                article = articleMatch[1].toLowerCase();
                word = word.replace(/^(der|die|das)\s+/i, '').trim();
            }

            // Fallback: Check dedicated columns
            if (!article) {
                const derValue = getVal('Masculine (der)');
                const dieValue = getVal('Feminine (die)');
                const dasValue = getVal('Neuter (Das)');
                if (derValue && derValue !== '-') article = 'der';
                else if (dieValue && dieValue !== '-') article = 'die';
                else if (dasValue && dasValue !== '-') article = 'das';
            }

            // Normalize Type
            if (type) {
                type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            }

            // Skip empty rows
            if (!word) return null;

            return {
                word: word,
                type: type,
                english: english,
                article: article,
                plural: getVal('Plural'),
                sentence: getVal('A1 Sentence'),
                level: getVal('Level'),
                trivia: getVal('Trivia / Memory Tip'),
                successCount: stats.successCount,
                failCount: stats.failCount,
                status: stats.status
            };
        }).filter(item => item !== null);

        // 6. SAVE to JSON
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(newVocabList, null, 2));
        console.log(`🎉 Successfully synced ${newVocabList.length} words to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('❌ Error syncing vocab:', error.message);
        if (error.stdout) console.log(error.stdout.toString());
        if (error.stderr) console.error(error.stderr.toString());
        process.exit(1);
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}

fetchAndSyncVocab();

