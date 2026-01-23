import { useState, useEffect, useCallback } from 'react';
import vocabData from './data/vocab.json';
import SettingsHeader from './components/SettingsHeader';
import QuizCard from './components/QuizCard';
import ResultCard from './components/ResultCard';
import ConfigScreen from './components/ConfigScreen';

const SRS_STORAGE_KEY = 'vocab-srs-data';

export default function App() {
    const [view, setView] = useState('loading'); // loading, config, playing, feedback

    // App Config State
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedModes, setSelectedModes] = useState(['multipleChoice', 'written', 'article']);
    const [selectedTypes, setSelectedTypes] = useState(['Noun', 'Verb']);

    // Data State
    const [vocabPool, setVocabPool] = useState([]);

    // Quiz State
    const [currentWord, setCurrentWord] = useState(null);
    const [quizMode, setQuizMode] = useState('');
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState(null);

    // Extract all unique levels
    const levels = Array.from(new Set(vocabData.map(v => v.level))).filter(Boolean).sort();

    useEffect(() => {
        // 1. Load SRS Data from LocalStorage
        const storedSRS = JSON.parse(localStorage.getItem(SRS_STORAGE_KEY) || '{}');

        // 2. Merge with base vocab data
        const mergedVocab = vocabData.map(word => {
            // Use English translation + Word as a unique composite key for tracking
            const key = `${word.english}-${word.word}`;
            const stats = storedSRS[key] || { successCount: 0, failCount: 0 };
            return { ...word, ...stats, uniqueId: key };
        });

        setVocabPool(mergedVocab);
        setSelectedLevels(levels);

        setTimeout(() => {
            setView('config');
        }, 800);
    }, []);

    const getWeightedRandomWord = (pool) => {
        // 1. Calculate weights: max(1, (fail - success) + 5)
        // High fail count = High weight. High success count = Low weight.
        const weightedList = pool.map(word => ({
            ...word,
            weight: Math.max(1, (word.failCount - word.successCount) + 5)
        }));

        // 2. Sum weights
        const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);

        // 3. Weighted Random Draw
        let random = Math.random() * totalWeight;
        for (const item of weightedList) {
            if (random < item.weight) return item;
            random -= item.weight;
        }

        // Fallback
        return weightedList[0];
    };

    const pickNewWord = useCallback(() => {
        if (vocabPool.length === 0) return;

        // Filter based on user configuration
        const filtered = vocabPool.filter(v =>
            selectedLevels.includes(v.level) &&
            selectedTypes.includes(v.type)
        );

        if (filtered.length === 0) {
            setView('config');
            return;
        }

        // Use SRS Weighted Selection
        const randomWord = getWeightedRandomWord(filtered);

        // Determine available quiz modes based on user selection and word data
        const availableModes = selectedModes.filter(mode => {
            if (mode === 'article') {
                const articles = [randomWord.der, randomWord.die, randomWord.das].filter(a => a && a !== '-' && a !== '');
                return articles.length === 1;
            }
            return true;
        });

        // Fallback if no modes are available for this specific word
        const finalMode = availableModes.length > 0
            ? availableModes[Math.floor(Math.random() * availableModes.length)]
            : 'multipleChoice';

        // Generate options for Multiple Choice
        if (finalMode === 'multipleChoice') {
            const distractors = vocabPool
                .filter(v => v.word !== randomWord.word) // pick from full pool to be harder
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map(v => v.word);

            setOptions([randomWord.word, ...distractors].sort(() => 0.5 - Math.random()));
        }

        setCurrentWord(randomWord);
        setQuizMode(finalMode);
        setFeedback(null);
        setView('playing');
    }, [selectedLevels, selectedModes, selectedTypes, vocabPool]);

    const updateSRSStats = (word, isCorrect) => {
        const newPool = vocabPool.map(w => {
            if (w.uniqueId === word.uniqueId) {
                return {
                    ...w,
                    successCount: isCorrect ? w.successCount + 1 : w.successCount,
                    failCount: !isCorrect ? w.failCount + 1 : w.failCount
                };
            }
            return w;
        });

        setVocabPool(newPool);

        // Persist to LocalStorage
        const srsData = {};
        newPool.forEach(w => {
            if (w.successCount > 0 || w.failCount > 0) {
                srsData[w.uniqueId] = { successCount: w.successCount, failCount: w.failCount };
            }
        });
        localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(srsData));
    };

    const handleAnswer = (answer) => {
        let correct = false;

        if (quizMode === 'multipleChoice' || quizMode === 'written') {
            correct = answer.toLowerCase() === currentWord.word.toLowerCase();
        } else if (quizMode === 'article') {
            const correctArticle = [currentWord.der, currentWord.die, currentWord.das].find(a => a && a !== '' && a !== '-');
            correct = answer.toLowerCase() === (correctArticle || '').toLowerCase();
        }

        // Update SRS Logic
        updateSRSStats(currentWord, correct);

        setFeedback({ correct, chosen: answer });
        setView('feedback');
    };

    const handleStart = () => {
        pickNewWord();
    };

    const handleBackToConfig = () => {
        setView('config');
    };

    if (view === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium animate-pulse">Lade Vokabeln...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-6 pb-20">
            <SettingsHeader
                onBack={handleBackToConfig}
                showBack={view !== 'config'}
            />

            <main className="mt-8">
                {view === 'config' ? (
                    <ConfigScreen
                        levels={levels}
                        selectedLevels={selectedLevels}
                        setSelectedLevels={setSelectedLevels}
                        selectedModes={selectedModes}
                        setSelectedModes={setSelectedModes}
                        selectedTypes={selectedTypes}
                        setSelectedTypes={setSelectedTypes}
                        onStart={handleStart}
                    />
                ) : view === 'feedback' ? (
                    <ResultCard
                        word={currentWord}
                        feedback={feedback}
                        onNext={pickNewWord}
                    />
                ) : (
                    <QuizCard
                        word={currentWord}
                        mode={quizMode}
                        options={options}
                        onAnswer={handleAnswer}
                    />
                )}
            </main>

            {view !== 'config' && !feedback && (
                <footer className="mt-16 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
                    SRS Active • Viel Erfolg beim Lernen
                </footer>
            )}
        </div>
    );
}
