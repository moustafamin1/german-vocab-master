# TASK: Implement Weighted Spaced Repetition System (SRS)

**Role:** Expert Senior React Developer
**Objective:** Refactor the existing vocabulary quiz app to use a weighted probability selection engine that modifies the JSON database directly based on performance.

---

## 1. Data Schema Update
Modify the core JSON vocabulary objects to include tracking keys. Every word entry must have:
* `"successCount": 0`
* `"failCount": 0`

**Constraint:** All updates must be written directly to the JSON state/file. Do not use `localStorage`.

---

## 2. The SRS Algorithm (Weighted Selection)
Replace the simple random picker with a **Weighted Probability** algorithm. This ensures that words you fail often appear more frequently.

### The Math Logic
For every word in the active filtered list, calculate a `weight`:
$$Weight = \max(1, (failCount - successCount) + 3)$$

### Numerical Example for Implementation
If the pool contains these 3 words, the selection probabilities should be:
1. **Word A (Easy):** 10 Successes, 0 Fails -> **Weight: 1**
2. **Word B (New):** 0 Successes, 0 Fails -> **Weight: 3**
3. **Word C (Hard):** 1 Success, 6 Fails -> **Weight: 8**

**Total Pool Weight: 12.**
* **Word C** must have a **66.67%** (8/12) chance of being picked.
* **Word B** must have a **25%** (3/12) chance of being picked.
* **Word A** must have a **8.33%** (1/12) chance of being picked.

---

## 3. Reference Implementation (Logic Shot)
Implement the `getNextQuestion` function using the following logic:

```javascript
const getNextWord = (activePool) => {
  // 1. Calculate weights
  const weightedList = activePool.map(word => ({
    ...word,
    w: Math.max(1, (word.failCount - word.successCount) + 3)
  }));

  // 2. Sum weights
  const totalWeight = weightedList.reduce((sum, item) => sum + item.w, 0);

  // 3. Weighted Random Draw
  let random = Math.random() * totalWeight;
  for (const item of weightedList) {
    if (random < item.w) return item;
    random -= item.w;
  }
};

4. Operational Requirements
- Answer Handling: - On Correct answer: Increment the word's successCount in the JSON.
- On Incorrect answer: Increment the word's failCount in the JSON.


Persistence: Ensure the updated successCount and failCount values are saved so the next question selection reflects the most recent results.