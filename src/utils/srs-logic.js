/**
 * SRS Mathematical Model
 * Weight = max(1, (failCount - successCount) + 3)
 */

export const calculateWeight = (word) => {
    return Math.max(1, (word.failCount - word.successCount) + 3);
};

export const getWeightedRandomWord = (pool) => {
    if (!pool || pool.length === 0) return null;

    // 1. Calculate weights for all items
    const weightedList = pool.map(word => ({
        ...word,
        weight: calculateWeight(word)
    }));

    // 2. Sum weights
    const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);

    // 3. Weighted Random Draw
    let random = Math.random() * totalWeight;
    for (const item of weightedList) {
        if (random < item.weight) return item;
        random -= item.weight;
    }

    // Fallback (e.g. if Math.random() is exactly 1.0)
    return weightedList[weightedList.length - 1];
};
