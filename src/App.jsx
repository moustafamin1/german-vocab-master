import { useState, useEffect, useCallback } from 'react';
import vocabData from './data/vocab.json';
import SettingsHeader from './components/SettingsHeader';
import QuizCard from './components/QuizCard';
import ResultCard from './components/ResultCard';
import ConfigScreen from './components/ConfigScreen';
import SettingsScreen from './components/SettingsScreen';
import AllWordsScreen from './components/AllWordsScreen';
import MediaLibrary from './components/MediaLibrary';
import StatsBar from './components/StatsBar';
import { getWeightedRandomWord } from './utils/srs-logic';
import { getCachedVocab } from './services/vocabService';

const SRS_STORAGE_KEY = 'vocab-srs-data';
const GLOBAL_STATS_KEY = 'vocab-global-stats';
const APP_SETTINGS_KEY = 'vocab-app-settings';
const DAILY_STATS_KEY = 'vocab-daily-stats';

export default function App() {
    const [view, setView] = useState('loading'); // loading, config, playing, feedback, settings, allWords, mediaLibrary
    const [devMode, setDevMode] = useState(true);
    const [srsOffset, setSrsOffset] = useState(3);
    const [autoPlayAudio, setAutoPlayAudio] = useState(true);
    const [globalStats, setGlobalStats] = useState({ total: 0, correct: 0, incorrect: 0 });
    const [dailyStats, setDailyStats] = useState([]);

    // App Config State
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedModes, setSelectedModes] = useState(['multipleChoice', 'written', 'article', 'wordOrder']);
    const [selectedTypes, setSelectedTypes] = useState(['Noun', 'Phrase', 'Grammar']);

    // Data State
    const [vocabPool, setVocabPool] = useState([]);

    // Quiz State
    const [currentWord, setCurrentWord] = useState(null);
    const [quizMode, setQuizMode] = useState('');
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState(null);

    // Load data (cached or built-in)
    const rawCached = getCachedVocab();
    const baseVocab = (Array.isArray(rawCached) ? rawCached : null) || vocabData;

    // Extract all unique levels
    const levels = Array.from(new Set(baseVocab.map(v => v?.level))).filter(Boolean).sort();

    useEffect(() => {
        let storedSRS = {};
        let storedGlobalStats = { total: 0, correct: 0, incorrect: 0 };
        let storedSettings = { srsOffset: 3, devMode: true, autoPlayAudio: true };
        let storedDailyStats = [];

        try {
            // 1. Load SRS Data from LocalStorage
            storedSRS = JSON.parse(localStorage.getItem(SRS_STORAGE_KEY) || '{}');

            // 3. Load Global Stats
            storedGlobalStats = JSON.parse(localStorage.getItem(GLOBAL_STATS_KEY) || '{"total":0,"correct":0,"incorrect":0}');

            // 4. Load App Settings
            storedSettings = JSON.parse(localStorage.getItem(APP_SETTINGS_KEY) || '{"srsOffset":3,"devMode":true,"autoPlayAudio":true}');

            // 5. Load Daily Stats
            storedDailyStats = JSON.parse(localStorage.getItem(DAILY_STATS_KEY) || '[]');
        } catch (err) {
            console.error('⚠️ Failed to load stored data, using defaults:', err);
            // If data is corrupted (like "[object Object]"), we continue with defaults
        }

        setGlobalStats(storedGlobalStats);
        setSrsOffset(storedSettings.srsOffset);
        setDevMode(storedSettings.devMode);
        setAutoPlayAudio(storedSettings.autoPlayAudio ?? true);
        setDailyStats(storedDailyStats);

        // 2. Merge with base vocab data and Migration Engine
        let dataMigrated = false;
        const mergedVocab = baseVocab.map(word => {
            // ... (rest of the logic remains same, but using the safely loaded storedSRS)
            const stringKey = `${word.english}-${word.word}`;
            let stats = storedSRS[stringKey];

            // 🔍 AGGRESSIVE RECOVERY logic
            if (!stats) {
                const article = word.article || '';
                const capitalizedArticle = article ? article.charAt(0).toUpperCase() + article.slice(1) : '';

                const potentialLegacyKeys = [
                    word.id,
                    `${word.english}-${capitalizedArticle} ${word.word}`,
                    `${word.english}-${article} ${word.word}`,
                    `${word.english}- ${word.word}`,
                    `${word.english}-${word.word} `
                ].filter(Boolean);

                for (const legacyKey of potentialLegacyKeys) {
                    if (storedSRS[legacyKey]) {
                        console.log(`✨ RECOVERED: "${word.word}" from legacy key: "${legacyKey}"`);
                        stats = storedSRS[legacyKey];
                        storedSRS[stringKey] = stats;
                        dataMigrated = true;
                        break;
                    }
                }

                if (!stats) {
                    const lowercaseStringKey = stringKey.toLowerCase();
                    const fuzzyMatchKey = Object.keys(storedSRS).find(k => k.toLowerCase() === lowercaseStringKey);
                    if (fuzzyMatchKey) {
                        console.log(`✨ FUZZY RECOVERED: "${word.word}" from "${fuzzyMatchKey}"`);
                        stats = storedSRS[fuzzyMatchKey];
                        storedSRS[stringKey] = stats;
                        dataMigrated = true;
                    }
                }
            }

            stats = stats || {};

            return {
                ...word,
                successCount: stats.successCount || 0,
                failCount: stats.failCount || 0,
                status: stats.status || word.status || 'study',
                uniqueId: stringKey
            };
        });

        if (dataMigrated) {
            localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(storedSRS));
            console.log('✅ LocalStorage healed and migrated to string-based keys.');
        }

        setVocabPool(mergedVocab);
        setSelectedLevels(levels);

        setTimeout(() => {
            setView('config');
        }, 800);
    }, []);

    // Persist settings whenever they change
    useEffect(() => {
        if (view === 'loading') return;
        localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({ srsOffset, devMode, autoPlayAudio }));
    }, [srsOffset, devMode, autoPlayAudio, view]);

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
            if (mode === 'written') {
                return randomWord.type !== 'Grammar';
            }
            return true;
        });

        let finalMode = validModesForWord[Math.floor(Math.random() * validModesForWord.length)];

        // Force wordOrder for phrases if it's selected
        if (randomWord.type === 'Phrase' && selectedModes.includes('wordOrder')) {
            finalMode = 'wordOrder';
        }

        // Force multipleChoice for Grammar words
        if (randomWord.type === 'Grammar') {
            finalMode = 'multipleChoice';
        }

        // Generate options for Multiple Choice
        if (finalMode === 'multipleChoice') {
            if (randomWord.type === 'Grammar' && randomWord.wrongChoices && randomWord.wrongChoices.length > 0) {
                // Use hardcoded wrong choices from Sheet 5
                setOptions([randomWord, ...randomWord.wrongChoices].sort(() => 0.5 - Math.random()));
            } else {
                const distractors = vocabPool
                    .filter(v => v.word !== randomWord.word)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);

                setOptions([randomWord, ...distractors].sort(() => 0.5 - Math.random()));
            }
        }

        setCurrentWord(randomWord);
        setQuizMode(finalMode);
        setFeedback(null);
        setView('playing');
    }, [selectedLevels, selectedModes, selectedTypes, vocabPool, srsOffset]);

    const saveSRSData = (updatedPool) => {
        // 🛡️ SAFETY FIRST: Always merge with existing storage to prevent accidental data wipes
        const existingData = JSON.parse(localStorage.getItem(SRS_STORAGE_KEY) || '{}');
        const newData = { ...existingData };

        updatedPool.forEach(w => {
            if (w.successCount > 0 || w.failCount > 0 || w.status === 'skip') {
                newData[w.uniqueId] = {
                    successCount: w.successCount,
                    failCount: w.failCount,
                    status: w.status
                };
            }
        });

        localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(newData));
    };

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
        saveSRSData(newPool); // Use safe save
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
        saveSRSData(newPool); // Use safe save
    };

    const handleAnswer = (answer) => {
        let correct = false;

        // Simplify string for comparison (ignore spaces, punctuation, and umlauts)
        const simplify = (str) => {
            if (!str) return '';
            return str.toLowerCase()
                .replace(/ä/g, 'a')
                .replace(/ö/g, 'o')
                .replace(/ü/g, 'u')
                .replace(/ae/g, 'a')
                .replace(/oe/g, 'o')
                .replace(/ue/g, 'u')
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents/umlauts
                .replace(/ß/g, 'ss')                             // Replace eszett with ss
                .replace(/[\s\p{P}\p{S}]/gu, '');                // Remove spaces and punctuation
        };

        const sAnswer = simplify(answer);
        const sWord = simplify(currentWord.word);

        if (quizMode === 'multipleChoice' || quizMode === 'written' || quizMode === 'wordOrder') {
            const correctArticle = currentWord.article;
            // Always check if the answer matches "Article + Word" OR just "Word"
            // regardless of whether the system thinks it's a Noun or Phrase.
            // This fixes the issue where phrase-nouns (like "Das ist meine Tochter") were failing.

            const sWithArticle = correctArticle ? simplify(correctArticle + currentWord.word) : sWord;

            // For written/wordOrder, accept:
            // 1. Exact match of word/phrase
            // 2. Match of Article + Word (if article exists)
            correct = sAnswer === sWord || (correctArticle && sAnswer === sWithArticle);
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

        // Update Daily Stats
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const updatedDailyStats = [...dailyStats];
        const todayIndex = updatedDailyStats.findIndex(d => d.date === today);

        if (todayIndex >= 0) {
            // Update existing entry for today
            updatedDailyStats[todayIndex] = {
                date: today,
                total: updatedDailyStats[todayIndex].total + 1,
                correct: updatedDailyStats[todayIndex].correct + (correct ? 1 : 0),
                incorrect: updatedDailyStats[todayIndex].incorrect + (correct ? 0 : 1)
            };
        } else {
            // Add new entry for today
            updatedDailyStats.push({
                date: today,
                total: 1,
                correct: correct ? 1 : 0,
                incorrect: correct ? 0 : 1
            });
        }

        setDailyStats(updatedDailyStats);
        localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(updatedDailyStats));

        setFeedback({ correct, chosen: answer });
        setView('feedback');
    };

    const handleStart = () => pickNewWord();
    const handleBackToConfig = () => setView('config');
    const handleOpenSettings = () => setView('settings');
    const handleOpenAllWords = () => setView('allWords');
    const handleBackToSettings = () => setView('settings');
    const handleOpenMediaLibrary = () => setView('mediaLibrary');

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
                    isSettingsOpen={view === 'settings' || view === 'allWords' || view === 'mediaLibrary'}
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
                            autoPlayAudio={autoPlayAudio}
                        />
                    ) : view === 'settings' ? (
                        <SettingsScreen
                            srsOffset={srsOffset}
                            setSrsOffset={setSrsOffset}
                            devMode={devMode}
                            setDevMode={setDevMode}
                            autoPlayAudio={autoPlayAudio}
                            setAutoPlayAudio={setAutoPlayAudio}
                            wordCount={baseVocab.length}
                            onBack={handleBackToConfig}
                            onOpenAllWords={handleOpenAllWords}
                            onOpenMediaLibrary={handleOpenMediaLibrary}
                            dailyStats={dailyStats}
                        />
                    ) : view === 'allWords' ? (
                        <AllWordsScreen
                            vocabPool={vocabPool}
                            onToggleStatus={toggleWordStatus}
                            srsOffset={srsOffset}
                            onBack={handleBackToSettings}
                        />
                    ) : view === 'mediaLibrary' ? (
                        <MediaLibrary
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
