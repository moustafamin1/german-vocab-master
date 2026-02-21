const OLD_DEFAULTS = { total: 2051, correct: 1611, incorrect: 440 };
const NEW_DEFAULTS = { total: 3000, correct: 2300, incorrect: 700 };

function runMigration(storedGlobalStats) {
    console.log("Input Stats:", storedGlobalStats);

    if (storedGlobalStats.total >= OLD_DEFAULTS.total && storedGlobalStats.total < NEW_DEFAULTS.total) {
        const userProgress = {
            total: storedGlobalStats.total - OLD_DEFAULTS.total,
            correct: storedGlobalStats.correct - OLD_DEFAULTS.correct,
            incorrect: storedGlobalStats.incorrect - OLD_DEFAULTS.incorrect
        };

        // Ensure no negative values if data was weird
        userProgress.total = Math.max(0, userProgress.total);
        userProgress.correct = Math.max(0, userProgress.correct);
        userProgress.incorrect = Math.max(0, userProgress.incorrect);

        const newStats = {
            total: NEW_DEFAULTS.total + userProgress.total,
            correct: NEW_DEFAULTS.correct + userProgress.correct,
            incorrect: NEW_DEFAULTS.incorrect + userProgress.incorrect
        };

        console.log("✅ Migrated Stats:", newStats);
        return newStats;
    } else if (storedGlobalStats.total < NEW_DEFAULTS.total) {
        console.log("Fallback Applied (New Defaults):", NEW_DEFAULTS);
        return NEW_DEFAULTS;
    } else {
        console.log("No Migration Needed (Already on new scale or above):", storedGlobalStats);
        return storedGlobalStats;
    }
}

console.log("--- Test Case 1: User with 2450 Total (Target User) ---");
const result1 = runMigration({ total: 2450, correct: 1800, incorrect: 650 });
// Expected: 2450 - 2051 = 399 progress. New Total = 3399.

console.log("\n--- Test Case 2: New User (Low Stats / Default) ---");
runMigration({ total: 0, correct: 0, incorrect: 0 });
// Expected: Fallback to New Defaults (3000).

console.log("\n--- Test Case 3: Old Defaults (2051) ---");
runMigration({ total: 2051, correct: 1611, incorrect: 440 });
// Expected: 0 progress. New Total = 3000.

console.log("\n--- Test Case 4: Already Migrated User (3500) ---");
runMigration({ total: 3500, correct: 2800, incorrect: 700 });
// Expected: No change.
