import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SPREADSHEET_ID = '1BkMnDlxI7jCvEnr5xJmn_YPnLLqbsZ6smjEn5-yd738';
const TAB_NAME = 'Sheet1';
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/vocab.json');

const GSHEETS_CMD = `source ~/.gemini/antigravity/gsheets-venv/bin/activate && python3 ~/.gemini/antigravity/gsheets.py read ${SPREADSHEET_ID} "${TAB_NAME}"`;

function fetchVocab() {
    try {
        console.log('Fetching vocabulary from Google Sheets...');
        const result = execSync(GSHEETS_CMD, { shell: '/bin/zsh', encoding: 'utf-8' });

        const rows = JSON.parse(result);

        if (!rows || rows.length <= 1) {
            console.error('No data found in sheet.');
            return;
        }

        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = (row[index] || '').trim();
            });

            let word = obj['Word'];
            let der = obj['Masculine (der)'];
            let die = obj['Feminine (die)'];
            let das = obj['Neuter (Das)'];
            const type = obj['Type'];

            // Only strip articles from Nouns
            if (type === 'Noun') {
                // Strip leading articles from Word
                word = word.replace(/^(der|die|das)\s+/i, '');

                // Clean up the article columns to just the keyword for easy matching
                // Replace dashes or "-" with empty strings to avoid truthy issues in JS
                der = (der && der !== '-') ? 'der' : '';
                die = (die && die !== '-') ? 'die' : '';
                das = (das && das !== '-') ? 'das' : '';
            }

            return {
                word: word,
                type: type,
                english: obj['English Translation'],
                der: der,
                die: die,
                das: das,
                plural: obj['Plural'],
                sentence: obj['A1 Sentence'],
                level: obj['Level'],
                trivia: obj['Trivia / Memory Tip']
            };
        });

        // Ensure directory exists
        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
        console.log(`Successfully saved ${data.length} entries to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Error fetching vocab:', error.message);
        process.exit(1);
    }
}

fetchVocab();
