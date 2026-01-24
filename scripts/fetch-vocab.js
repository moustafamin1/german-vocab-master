import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

        // 2. CHECK for ID Column
        let idColumnIndex = headers.indexOf('ID');
        let headersChanged = false;

        if (idColumnIndex === -1) {
            console.log('⚠️ "ID" column missing. Adding it...');
            headers.push('ID');
            idColumnIndex = headers.length - 1;
            headersChanged = true;
            // Add empty ID to all existing rows in memory
            for (let i = 1; i < rows.length; i++) {
                while (rows[i].length < headers.length) {
                    rows[i].push('');
                }
            }
        }

        // 3. GENERATE UUIDs for missing IDs
        let dataChanged = false;

        // We process rows from index 1 (skipping header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            // Ensure row has enough columns
            while (row.length < headers.length) {
                row.push('');
            }

            const currentId = row[idColumnIndex];

            // If ID is missing, generate one
            if (!currentId || currentId.trim() === '') {
                const newId = uuidv4();
                row[idColumnIndex] = newId;
                dataChanged = true;
                // console.log(`➕ Generated ID for word: ${row[0] || 'Unknown'}`);
            }
        }

        // 4. WRITE-BACK to Sheet if needed
        if (headersChanged || dataChanged) {
            console.log('💾 Writing new IDs back to Google Sheet...');

            const fullData = headersChanged ? [headers, ...rows.slice(1)] : rows;

            // USE TEMP FILE to avoid shell argument length limits
            tempFilePath = path.join(os.tmpdir(), `gsync-${Date.now()}.json`);
            fs.writeFileSync(tempFilePath, JSON.stringify(fullData));

            console.log(`📝 Prepared sync data in ${tempFilePath}`);
            runGSheetsCmd('write', `@${tempFilePath}`);

            console.log('✅ Sheet updated with stable IDs.');
        } else {
            console.log('👍 All rows already have IDs. No write-back needed.');
        }

        // 5. MERGE with Local Data
        console.log('🔗 Merging with local data...');

        let localData = [];
        if (fs.existsSync(OUTPUT_PATH)) {
            localData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        }

        // Create a map of existing stats by ID
        const statsMap = new Map();
        localData.forEach(item => {
            if (item.id) {
                statsMap.set(item.id, {
                    successCount: item.successCount || 0,
                    failCount: item.failCount || 0
                });
            }
        });

        // Map fresh data to our JSON structure
        const headerMap = {};
        headers.forEach((h, i) => { headerMap[h] = i; });

        const newVocabList = rows.slice(1).map(row => {
            const getVal = (colName) => (row[headerMap[colName]] || '').trim();
            const id = getVal('ID');

            // Get stats from map or default to 0
            const stats = statsMap.get(id) || { successCount: 0, failCount: 0 };

            let word = getVal('Word');
            let der = getVal('Masculine (der)');
            let die = getVal('Feminine (die)');
            let das = getVal('Neuter (Das)');
            const type = getVal('Type');

            // Data Cleaning
            if (type === 'Noun') {
                word = word.replace(/^(der|die|das)\s+/i, '');
                der = (der && der !== '-' && der !== '') ? 'der' : '';
                die = (die && die !== '-' && die !== '') ? 'die' : '';
                das = (das && das !== '-' && das !== '') ? 'das' : '';
            }

            // Skip empty rows
            if (!word) return null;

            return {
                id: id,
                word: word,
                type: type,
                english: getVal('English Translation'),
                der: der,
                die: die,
                das: das,
                plural: getVal('Plural'),
                sentence: getVal('A1 Sentence'),
                level: getVal('Level'),
                trivia: getVal('Trivia / Memory Tip'),
                successCount: stats.successCount,
                failCount: stats.failCount
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

