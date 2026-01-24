import { expect, test, describe } from 'vitest';
import { getWeightedRandomWord, calculateWeight } from './srs-logic';

describe('SRS Mathematical Model Verification', () => {

    test('calculateWeight follows the spec: max(1, (fail - success) + 3)', () => {
        // Word A (Easy): 10 Successes, 0 Fails -> Weight: 1 (floor)
        expect(calculateWeight({ successCount: 10, failCount: 0 })).toBe(1);

        // Word B (New): 0 Successes, 0 Fails -> Weight: 3
        expect(calculateWeight({ successCount: 0, failCount: 0 })).toBe(3);

        // Word C (Hard): 1 Success, 6 Fails -> Weight: 8
        expect(calculateWeight({ successCount: 1, failCount: 6 })).toBe(8);
    });

    test('Selection distribution matches specification probabilities (Monte Carlo 20k rounds)', () => {
        const pool = [
            { id: 'Easy', successCount: 10, failCount: 0 }, // Weight 1
            { id: 'New', successCount: 0, failCount: 0 }, // Weight 3
            { id: 'Hard', successCount: 1, failCount: 6 }  // Weight 8
        ];
        // Total Weight = 1 + 3 + 8 = 12
        // Probability Easy: 1/12 = 8.33%
        // Probability New:  3/12 = 25%
        // Probability Hard: 8/12 = 66.67%

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
        console.log(`Easy: ${(actualEasyShare * 100).toFixed(2)}% (Expected 8.33%)`);
        console.log(`New: ${(actualNewShare * 100).toFixed(2)}% (Expected 25%)`);
        console.log(`Hard: ${(actualHardShare * 100).toFixed(2)}% (Expected 66.67%)`);

        // Allow 1% margin of error for statistical variance
        expect(actualEasyShare).toBeCloseTo(0.0833, 1);
        expect(actualNewShare).toBeCloseTo(0.25, 1);
        expect(actualHardShare).toBeCloseTo(0.6667, 1);
    });
});
