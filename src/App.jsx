import { useState, useEffect, useCallback } from 'react';
import vocabData from './data/vocab.json';
import SettingsHeader from './components/SettingsHeader';
import QuizCard from './components/QuizCard';
import ResultCard from './components/ResultCard';
import ConfigScreen from './components/ConfigScreen';
import SettingsScreen from './components/SettingsScreen';
import AllWordsScreen from './components/AllWordsScreen';
import StatsBar from './components/StatsBar';
import { getWeightedRandomWord } from './utils/srs-logic';
import { getCachedVocab } from './services/vocabService';

const SRS_STORAGE_KEY = 'vocab-srs-data';
const GLOBAL_STATS_KEY = 'vocab-global-stats';
const APP_SETTINGS_KEY = 'vocab-app-settings';

export default function App() {
    const [view, setView] = useState('loading'); // loading, config, playing, feedback, settings, allWords
    const [devMode, setDevMode] = useState(true);
    const [srsOffset, setSrsOffset] = useState(3);
    const [globalStats, setGlobalStats] = useState({ total: 0, correct: 0, incorrect: 0 });

    // App Config State
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedModes, setSelectedModes] = useState(['multipleChoice', 'written', 'article', 'wordOrder']);
    const [selectedTypes, setSelectedTypes] = useState(['Noun', 'Phrase']);

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

        // 2. Merge with base vocab data and Migration Engine
        let dataMigrated = false;
        const mergedVocab = baseVocab.map(word => {
            // ALWAYS use the stable string key as the primary identifier
            const stringKey = `${word.english}-${word.word}`;

            // Look for progress under the new string key
            let stats = storedSRS[stringKey];

            // 🔍 RECOVERY logic: If nothing under string key, check for legacy variants
            if (!stats) {
                const legacyKeys = [
                    word.id,                                     // 1. Old random UUID (if available)
                    `${word.english}-${word.article} ${word.word}`, // 2. "The car-Das Auto" (old style)
                    `${word.english}- ${word.word}`,              // 3. "The car- Auto" (extra space bug)
                    `${word.english}-${word.article}${word.word}`  // 4. "The car-DasAuto" (no space bug)
                ].filter(Boolean);

                for (const legacyKey of legacyKeys) {
                    if (storedSRS[legacyKey]) {
                        console.log(`✨ Recovered data for "${word.word}" from legacy key: "${legacyKey}"`);
                        stats = storedSRS[legacyKey];
                        // Move it to the new key for future lookups
                        storedSRS[stringKey] = stats;
                        dataMigrated = true;
                        break;
                    }
                }
            }

            stats = stats || {};

            return {
                ...word,
                successCount: stats.successCount || 0,
                failCount: stats.failCount || 0,
                status: stats.status || word.status || 'study',
                uniqueId: stringKey // This is now guaranteed stable
            };
        });

        // If we migrated any data, persist the cleaned state back to LocalStorage immediately
        if (dataMigrated) {
            localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(storedSRS));
            console.log('✅ LocalStorage healed and migrated to string-based keys.');
        }

        setVocabPool(mergedVocab);
        setSelectedLevels(levels);

        // 3. Load Global Stats
        const storedGlobalStats = JSON.parse(localStorage.getItem(GLOBAL_STATS_KEY) || '{"total":0,"correct":0,"incorrect":0}');
        setGlobalStats(storedGlobalStats);

        // 4. Load App Settings
        const storedSettings = JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || '{"srsOffset":3,"devMode":true}');
        setSrsOffset(storedSettings.srsOffset);
        setDevMode(storedSettings.devMode);

        setTimeout(() => {
            setView('config');
        }, 800);
    }, []);

    // Persist settings whenever they change
    useEffect(() => {
        if (view === 'loading') return;
        localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({ srsOffset, devMode }));
    }, [srsOffset, devMode, view]);

    const pickNewWord = useCallback(() => {
        if (vocabPool.length === 0) return;

        // Filter based on user configuration and mode compatibility
        const filtered = vocabPool.filter(v => {
            const matchesLevel = selectedLevels.includes(v.level);
            const matchesType = selectedTypes.includes(v.type);
            const isStudy = v.status !== 'skip';

            if (!matchesLevel || !matchesType || !isStudy) return false;

            // Ensure the word is compatible with at least ONE selected mode
            return selectedModes.some(mode => {
                if (mode === 'article') {
                    return v.type === 'Noun' && v.article;
                }
                if (mode === 'wordOrder') {
                    return v.type === 'Phrase';
                }
                return true; // multipleChoice and written are always compatible if level/type match
            });
        });

        if (filtered.length === 0) {
            setView('config');
            return;
        }

        // Use SRS Weighted Selection Utility
        const randomWord = getWeightedRandomWord(filtered, srsOffset);

        // Determine available quiz modes for THIS specific word
        const validModesForWord = selectedModes.filter(mode => {
            if (mode === 'article') {
                return randomWord.type === 'Noun' && randomWord.article;
            }
            if (mode === 'wordOrder') {
                return randomWord.type === 'Phrase';
            }
            return true;
        });

        let finalMode = validModesForWord[Math.floor(Math.random() * validModesForWord.length)];

        // Force wordOrder for phrases if it's selected
        if (randomWord.type === 'Phrase' && selectedModes.includes('wordOrder')) {
            finalMode = 'wordOrder';
        }

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
    }, [selectedLevels, selectedModes, selectedTypes, vocabPool, srsOffset]);

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
            if (w.successCount > 0 || w.failCount > 0 || w.status === 'skip') {
                srsData[w.uniqueId] = {
                    successCount: w.successCount,
                    failCount: w.failCount,
                    status: w.status
                };
            }
        });
        localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(srsData));
    };

    const toggleWordStatus = (word) => {
        const newStatus = word.status === 'skip' ? 'study' : 'skip';
        const updatedWord = { ...word, status: newStatus };

        const newPool = vocabPool.map(w =>
            w.uniqueId === word.uniqueId ? updatedWord : w
        );

        setVocabPool(newPool);
        if (currentWord?.uniqueId === word.uniqueId) {
            setCurrentWord(updatedWord);
        }

        // Persist
        const storedSRS = JSON.parse(localStorage.getItem(SRS_STORAGE_KEY) || '{}');
        storedSRS[updatedWord.uniqueId] = {
            successCount: updatedWord.successCount,
            failCount: updatedWord.failCount,
            status: newStatus
        };
        localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(storedSRS));
    };

    const handleAnswer = (answer) => {
        let correct = false;

        // Simplify string for comparison (ignore spaces, punctuation, and umlauts)
        const simplify = (str) => {
            if (!str) return '';
            return str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents/umlauts
                .replace(/ß/g, 'ss')                             // Replace eszett with ss
                .replace(/[\s\p{P}\p{S}]/gu, '');                // Remove spaces and punctuation
        };

        const sAnswer = simplify(answer);
        const sWord = simplify(currentWord.word);

        if (quizMode === 'multipleChoice' || quizMode === 'written' || quizMode === 'wordOrder') {
            if (currentWord.type === 'Noun') {
                const correctArticle = currentWord.article;
                const sWithArticle = correctArticle ? simplify(correctArticle + currentWord.word) : sWord;
                // Accept either just the word or the article + word
                correct = sAnswer === sWord || (correctArticle && sAnswer === sWithArticle);
            } else {
                // For Verbs and Phrases, matched simplified versions
                correct = sAnswer === sWord;
            }
        } else if (quizMode === 'article') {
            const correctArticle = currentWord.article;
            correct = sAnswer === simplify(correctArticle || '');
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
    const handleOpenSettings = () => setView('settings');
    const handleOpenAllWords = () => setView('allWords');
    const handleBackToSettings = () => setView('settings');

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
                    onLogoClick={handleBackToConfig}
                    onSettingsClick={handleOpenSettings}
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
                            onToggleStatus={toggleWordStatus}
                            devMode={devMode}
                            srsOffset={srsOffset}
                        />
                    ) : view === 'settings' ? (
                        <SettingsScreen
                            srsOffset={srsOffset}
                            setSrsOffset={setSrsOffset}
                            devMode={devMode}
                            setDevMode={setDevMode}
                            wordCount={baseVocab.length}
                            onBack={handleBackToConfig}
                            onOpenAllWords={handleOpenAllWords}
                        />
                    ) : view === 'allWords' ? (
                        <AllWordsScreen
                            vocabPool={vocabPool}
                            onToggleStatus={toggleWordStatus}
                            srsOffset={srsOffset}
                            onBack={handleBackToSettings}
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
