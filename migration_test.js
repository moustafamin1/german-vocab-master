
// Mock of the legacy data in localStorage
const storedSRS = {
    "The car-Das Auto": { successCount: 10, failCount: 2, status: 'study' }, // Typical case
    "The bed-Das Bett": { successCount: 5, failCount: 0, status: 'study' },
    "The bread roll-das Brötchen": { successCount: 3, failCount: 1, status: 'study' }, // Lowercase article?
    "The dad-Der Papa": { successCount: 8, failCount: 8, status: 'study' }
};

// Mock of what cleanVocabData returns (New Data)
const newVocab = [
    { word: "Auto", article: "das", english: "The car" },
    { word: "Bett", article: "das", english: "The bed" },
    { word: "Brötchen", article: "das", english: "The bread roll" },
    { word: "Papa", article: "der", english: "The dad" }
];

console.log("--- Starting Migration Simulation ---");

newVocab.forEach(word => {
    const stringKey = `${word.english}-${word.word}`;
    let stats = storedSRS[stringKey]; // Expect undefined initially

    console.log(`\nChecking word: "${word.word}" (New Key: "${stringKey}")`);

    if (!stats) {
        // Reproduce App.jsx logic EXACTLY
        const article = word.article || '';
        const capitalizedArticle = article ? article.charAt(0).toUpperCase() + article.slice(1) : '';

        const potentialLegacyKeys = [
            `${word.english}-${capitalizedArticle} ${word.word}`,
            `${word.english}-${article} ${word.word}`,
            `${word.english}-${word.word}` // Just in case
        ];

        console.log("  Searching Legacy Keys:", potentialLegacyKeys);

        for (const legacyKey of potentialLegacyKeys) {
            if (storedSRS[legacyKey]) {
                console.log(`  ✅ MATCH FOUND: "${legacyKey}"`);
                stats = storedSRS[legacyKey];
                break;
            }
        }
    }

    if (stats) {
        console.log(`  🎉 Final Stats: Success=${stats.successCount}`);
    } else {
        console.log(`  ❌ MIGRATION FAILED`);
    }
});
