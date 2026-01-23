import { expect, test, describe } from 'vitest';
import { getWeightedRandomWord, calculateWeight } from './srs-logic';

describe('SRS Mathematical Model Verification', () => {

    test('calculateWeight follows the spec: max(1, (fail - success) + 5)', () => {
        // Word A (Easy): 10 Successes, 0 Fails -> Weight: 1 (floor)
        expect(calculateWeight({ successCount: 10, failCount: 0 })).toBe(1);

        // Word B (New): 0 Successes, 0 Fails -> Weight: 5
        expect(calculateWeight({ successCount: 0, failCount: 0 })).toBe(5);

        // Word C (Hard): 1 Success, 6 Fails -> Weight: 10
        expect(calculateWeight({ successCount: 1, failCount: 6 })).toBe(10);
    });

    test('Selection distribution matches specification probabilities (Monte Carlo 20k rounds)', () => {
        const pool = [
            { id: 'Easy', successCount: 10, failCount: 0 }, // Weight 1
            { id: 'New', successCount: 0, failCount: 0 }, // Weight 5
            { id: 'Hard', successCount: 1, failCount: 6 }  // Weight 10
        ];
        // Total Weight = 1 + 5 + 10 = 16
        // Probability Easy: 1/16 = 6.25%
        // Probability New:  5/16 = 31.25%
        // Probability Hard: 10/16 = 62.5%

        const counts = { Easy: 0, New: 0, Hard: 0 };
        const iterations = 20000;

        for (let i = 0; i < iterations; i++) {
            const picked = getWeightedRandomWord(pool);
            counts[picked.id]++;
        }

        const actualEasyShare = counts.Easy / iterations;
        const actualNewShare = counts.New / iterations;
        const actualHardShare = counts.Hard / iterations;

        console.log(`Monte Carlo Results (${iterations} rounds):`);
        console.log(`Easy: ${(actualEasyShare * 100).toFixed(2)}% (Expected 6.25%)`);
        console.log(`New: ${(actualNewShare * 100).toFixed(2)}% (Expected 31.25%)`);
        console.log(`Hard: ${(actualHardShare * 100).toFixed(2)}% (Expected 62.5%)`);

        // Allow 1% margin of error for statistical variance
        expect(actualEasyShare).toBeCloseTo(0.0625, 1);
        expect(actualNewShare).toBeCloseTo(0.3125, 1);
        expect(actualHardShare).toBeCloseTo(0.625, 1);
    });
});
