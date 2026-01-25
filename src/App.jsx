import { useState, useEffect, useCallback } from 'react';
import vocabData from './data/vocab.json';
import SettingsHeader from './components/SettingsHeader';
import QuizCard from './components/QuizCard';
import ResultCard from './components/ResultCard';
import ConfigScreen from './components/ConfigScreen';
import StatsBar from './components/StatsBar';
import { getWeightedRandomWord } from './utils/srs-logic';
import { getCachedVocab } from './services/vocabService';

const SRS_STORAGE_KEY = 'vocab-srs-data';
const GLOBAL_STATS_KEY = 'vocab-global-stats';

export default function App() {
    const [view, setView] = useState('loading'); // loading, config, playing, feedback
    const [devMode, setDevMode] = useState(true);
    const [globalStats, setGlobalStats] = useState({ total: 0, correct: 0, incorrect: 0 });

    // App Config State
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedModes, setSelectedModes] = useState(['multipleChoice', 'written', 'article']);
    const [selectedTypes, setSelectedTypes] = useState(['Noun', 'Verb', 'Phrase']);

    // Data State
    const [vocabPool, setVocabPool] = useState([]);

    // Quiz State
    const [currentWord, setCurrentWord] = useState(null);
    const [quizMode, setQuizMode] = useState('');
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState(null);

    // Load data (cached or built-in)
    const baseVocab = getCachedVocab() || vocabData;

    // Extract all unique levels
    const levels = Array.from(new Set(baseVocab.map(v => v.level))).filter(Boolean).sort();

    useEffect(() => {
        // 1. Load SRS Data from LocalStorage
        const storedSRS = JSON.parse(localStorage.getItem(SRS_STORAGE_KEY) || '{}');

        // 2. Merge with base vocab data
        const mergedVocab = baseVocab.map(word => {
            // Use the stable UUID from the sheet if available, otherwise fallback (shouldn't happen after sync)
            const key = word.id || `${word.english}-${word.word}`;
            const stats = storedSRS[key] || { successCount: 0, failCount: 0 };
            return { ...word, ...stats, uniqueId: key };
        });

        setVocabPool(mergedVocab);
        setSelectedLevels(levels);

        // 3. Load Global Stats
        const storedGlobalStats = JSON.parse(localStorage.getItem(GLOBAL_STATS_KEY) || '{"total":0,"correct":0,"incorrect":0}');
        setGlobalStats(storedGlobalStats);

        setTimeout(() => {
            setView('config');
        }, 800);
    }, []);

    const pickNewWord = useCallback(() => {
        if (vocabPool.length === 0) return;

        // Filter based on user configuration and mode compatibility
        const filtered = vocabPool.filter(v => {
            const matchesLevel = selectedLevels.includes(v.level);
            const matchesType = selectedTypes.includes(v.type);

            if (!matchesLevel || !matchesType) return false;

            // Ensure the word is compatible with at least ONE selected mode
            return selectedModes.some(mode => {
                if (mode === 'article') {
                    const articles = [v.der, v.die, v.das].filter(a => a && a !== '' && a !== '-');
                    return articles.length === 1;
                }
                return true; // multipleChoice and written are always compatible if level/type match
            });
        });

        if (filtered.length === 0) {
            setView('config');
            return;
        }

        // Use SRS Weighted Selection Utility
        const randomWord = getWeightedRandomWord(filtered);

        // Determine available quiz modes for THIS specific word
        const validModesForWord = selectedModes.filter(mode => {
            if (mode === 'article') {
                const articles = [randomWord.der, randomWord.die, randomWord.das].filter(a => a && a !== '' && a !== '-');
                return articles.length === 1;
            }
            return true;
        });

        const finalMode = validModesForWord[Math.floor(Math.random() * validModesForWord.length)];

        // Generate options for Multiple Choice
        if (finalMode === 'multipleChoice') {
            const distractors = vocabPool
                .filter(v => v.word !== randomWord.word)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            setOptions([randomWord, ...distractors].sort(() => 0.5 - Math.random()));
        }

        setCurrentWord(randomWord);
        setQuizMode(finalMode);
        setFeedback(null);
        setView('playing');
    }, [selectedLevels, selectedModes, selectedTypes, vocabPool]);

    const updateSRSStats = (word, isCorrect) => {
        const updatedWord = {
            ...word,
            successCount: isCorrect ? word.successCount + 1 : word.successCount,
            failCount: !isCorrect ? word.failCount + 1 : word.failCount
        };

        const newPool = vocabPool.map(w =>
            w.uniqueId === word.uniqueId ? updatedWord : w
        );

        setVocabPool(newPool);
        setCurrentWord(updatedWord);

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
        const cleanAnswer = answer.toLowerCase().trim();
        const cleanWord = currentWord.word.toLowerCase().trim();

        if (quizMode === 'multipleChoice' || quizMode === 'written') {
            if (currentWord.type === 'Noun') {
                const correctArticle = [currentWord.der, currentWord.die, currentWord.das].find(a => a && a !== '' && a !== '-');
                const formattedWithArticle = correctArticle ? `${correctArticle.toLowerCase()} ${cleanWord}` : cleanWord;
                // Accept either just the word or the article + word
                correct = cleanAnswer === cleanWord || (correctArticle && cleanAnswer === formattedWithArticle);
            } else {
                // For Verbs and Phrases, exact match
                correct = cleanAnswer === cleanWord;
            }
        } else if (quizMode === 'article') {
            const correctArticle = [currentWord.der, currentWord.die, currentWord.das].find(a => a && a !== '' && a !== '-');
            correct = answer.toLowerCase() === (correctArticle || '').toLowerCase();
        }

        updateSRSStats(currentWord, correct);

        // Update Global Stats
        const newGlobalStats = {
            total: globalStats.total + 1,
            correct: correct ? globalStats.correct + 1 : globalStats.correct,
            incorrect: !correct ? globalStats.incorrect + 1 : globalStats.incorrect
        };
        setGlobalStats(newGlobalStats);
        localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(newGlobalStats));

        setFeedback({ correct, chosen: answer });
        setView('feedback');
    };

    const handleStart = () => pickNewWord();
    const handleBackToConfig = () => setView('config');

    if (view === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium animate-pulse">Lade Vokabeln...</p>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100">
            <StatsBar stats={globalStats} />

            <div className="max-w-2xl mx-auto px-6 pb-10">
                <SettingsHeader
                    onBack={handleBackToConfig}
                    showBack={view !== 'config'}
                    devMode={devMode}
                    setDevMode={setDevMode}
                    wordCount={baseVocab.length}
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
                            devMode={devMode}
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
                    <footer className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
                        SRS Active • Viel Erfolg beim Lernen • v1.0.3
                    </footer>
                )}
            </div>
        </div>
    );
}
