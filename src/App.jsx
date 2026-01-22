import { useState, useEffect, useCallback } from 'react';
import vocabData from './data/vocab.json';
import SettingsHeader from './components/SettingsHeader';
import QuizCard from './components/QuizCard';
import ResultCard from './components/ResultCard';
import ConfigScreen from './components/ConfigScreen';

export default function App() {
    const [view, setView] = useState('loading'); // loading, config, playing, feedback
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedModes, setSelectedModes] = useState(['multipleChoice', 'written', 'article']);
    const [selectedTypes, setSelectedTypes] = useState(['Noun', 'Verb']);

    const [currentWord, setCurrentWord] = useState(null);
    const [quizMode, setQuizMode] = useState('');
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState(null);

    // Extract all unique levels
    const levels = Array.from(new Set(vocabData.map(v => v.level))).filter(Boolean).sort();

    useEffect(() => {
        // Initial load: Set all levels as default and go to config
        setSelectedLevels(levels);
        setTimeout(() => {
            setView('config');
        }, 800);
    }, []);

    const pickNewWord = useCallback(() => {
        const filtered = vocabData.filter(v =>
            selectedLevels.includes(v.level) &&
            selectedTypes.includes(v.type)
        );

        if (filtered.length === 0) {
            setView('config');
            return;
        }

        const randomWord = filtered[Math.floor(Math.random() * filtered.length)];

        // Determine available quiz modes based on user selection and word data
        const availableModes = selectedModes.filter(mode => {
            if (mode === 'article') {
                // Article mode only if exactly one article exists
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
            const distractors = vocabData
                .filter(v => v.word !== randomWord.word)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map(v => v.word);

            setOptions([randomWord.word, ...distractors].sort(() => 0.5 - Math.random()));
        }

        setCurrentWord(randomWord);
        setQuizMode(finalMode);
        setFeedback(null);
        setView('playing');
    }, [selectedLevels, selectedModes, selectedTypes]);

    const handleAnswer = (answer) => {
        let correct = false;

        if (quizMode === 'multipleChoice' || quizMode === 'written') {
            correct = answer.toLowerCase() === currentWord.word.toLowerCase();
        } else if (quizMode === 'article') {
            const correctArticle = [currentWord.der, currentWord.die, currentWord.das].find(a => a && a !== '' && a !== '-');
            correct = answer.toLowerCase() === (correctArticle || '').toLowerCase();
        }

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
                    Viel Erfolg beim Lernen
                </footer>
            )}
        </div>
    );
}
