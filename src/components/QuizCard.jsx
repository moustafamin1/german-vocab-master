import React, { useState, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export default function QuizCard({ word, mode, options, onAnswer }) {
    const [writtenInput, setWrittenInput] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [selectedWords, setSelectedWords] = useState([]);
    const [availableWords, setAvailableWords] = useState([]);

    // Reset components when word changes
    useEffect(() => {
        setShowHint(false);
        setWrittenInput('');
        if (mode === 'wordOrder' && word) {
            // Split by space, but also handle multiple spaces and trim
            const parts = word.word.split(/\s+/).filter(p => p.length > 0);
            const words = parts.map((w, i) => ({ id: i, text: w }));

            // Fisher-Yates Shuffle
            const shuffled = [...words];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            setAvailableWords(shuffled);
            setSelectedWords([]);
        }
    }, [word, mode]);

    const handleWrittenSubmit = (e) => {
        e.preventDefault();
        onAnswer(writtenInput.trim());
    };

    const handleWordOrderSubmit = () => {
        onAnswer(selectedWords.map(w => w.text).join(' '));
    };

    const toggleAvailable = (wordObj) => {
        setAvailableWords(availableWords.filter(w => w.id !== wordObj.id));
        setSelectedWords([...selectedWords, wordObj]);
    };

    const toggleSelected = (wordObj) => {
        setSelectedWords(selectedWords.filter(w => w.id !== wordObj.id));
        setAvailableWords([...availableWords, wordObj]);
    };

    const getArticle = (w) => {
        if (!w) return null;
        const art = [w.der, w.die, w.das].find(a => typeof a === 'string' && a.length > 0 && a !== '-' && a !== '');
        return art || null;
    };

    const formatWordWithArticle = (w) => {
        if (!w) return '';
        if (typeof w === 'string') return w;
        const art = getArticle(w);
        return art ? `${art} ${w.word}` : (w.word || w);
    };

    return (
        <div className="flex flex-col min-h-[60vh] md:min-h-[70vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Mode Title */}
            <div className="text-center py-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {mode === 'multipleChoice' ? 'Multiple Choice' :
                        mode === 'written' ? 'Written Challenge' :
                            mode === 'article' ? 'Article Master' : 'Word Order'}
                </span>
            </div>

            {/* Middle Section (Main Question) */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {mode === 'article' ? word.word : word.english}
                    {mode !== 'article' && mode !== 'written' && mode !== 'wordOrder' && getArticle(word) && (
                        <span className="text-zinc-500 text-2xl ml-3">({getArticle(word)})</span>
                    )}
                </h2>

                <div className="min-h-[4rem] flex flex-col items-center justify-center mt-4">
                    {word.trivia && (
                        <>
                            {!showHint ? (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="p-2 text-zinc-600 hover:text-zinc-400 hover:scale-110 transition-all"
                                    title="Show hint"
                                >
                                    <AlertCircle size={18} />
                                </button>
                            ) : (
                                <p className="text-sm italic text-zinc-400 animate-in fade-in slide-in-from-top-1 duration-300 max-w-md px-4">
                                    {word.trivia}
                                </p>
                            )}
                        </>
                    )}
                    {/* Removed Translate to German label */}
                </div>
            </div>

            {/* Bottom Section (Interaction) */}
            <div className="max-w-2xl mx-auto w-full pb-12 px-4 space-y-8">
                {mode === 'multipleChoice' && (
                    <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                        {options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => onAnswer(typeof opt === 'string' ? opt : opt.word)}
                                className="btn btn-secondary text-left py-4 px-6 hover:bg-zinc-800 hover:border-zinc-700 flex justify-between group"
                            >
                                <span>{formatWordWithArticle(opt)}</span>
                                <span className="opacity-0 group-hover:opacity-100 text-zinc-500 text-sm">Select</span>
                            </button>
                        ))}
                    </div>
                )}

                {mode === 'written' && (
                    <form onSubmit={handleWrittenSubmit} className="space-y-4 max-w-md mx-auto">
                        <input
                            autoFocus
                            type="text"
                            value={writtenInput}
                            onChange={(e) => setWrittenInput(e.target.value)}
                            placeholder="Type the German word..."
                            className="input w-full text-lg text-center bg-zinc-900/50 border-zinc-800 focus:border-zinc-500 transition-all py-4"
                        />
                        <button type="submit" className="btn btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-lg">
                            <Send className="w-4 h-4" />
                            Check Answer
                        </button>
                    </form>
                )}

                {mode === 'article' && (
                    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                        {['der', 'die', 'das'].map((art) => (
                            <button
                                key={art}
                                onClick={() => onAnswer(art)}
                                className="btn btn-secondary py-6 text-xl font-bold hover:bg-zinc-800 hover:border-zinc-700"
                            >
                                {art}
                            </button>
                        ))}
                    </div>
                )}

                {mode === 'wordOrder' && (
                    <div className="space-y-10">
                        {/* Selected Words Area */}
                        <div className={`min-h-[140px] p-4 flex flex-wrap gap-2 justify-center items-center rounded-2xl transition-all duration-300 ${selectedWords.length === 0 ? 'bg-zinc-900/30 border-2 border-dashed border-zinc-800' : 'bg-zinc-900/50 border-b-2 border-zinc-800'}`}>
                            {selectedWords.length > 0 ? (
                                selectedWords.map((wordObj) => (
                                    <button
                                        key={wordObj.id}
                                        onClick={() => toggleSelected(wordObj)}
                                        className="bg-zinc-800 text-zinc-100 px-5 py-3 rounded-xl border border-zinc-700 font-medium hover:bg-zinc-700 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg animate-in zoom-in-95 duration-200"
                                    >
                                        {wordObj.text}
                                    </button>
                                ))
                            ) : (
                                <p className="text-zinc-600 font-medium italic text-sm">Tap the words below in order</p>
                            )}
                        </div>

                        {/* Available Words Area */}
                        <div className="flex flex-wrap gap-3 justify-center min-h-[100px]">
                            {availableWords.map((wordObj) => (
                                <button
                                    key={wordObj.id}
                                    onClick={() => toggleAvailable(wordObj)}
                                    className="bg-zinc-950 text-zinc-300 px-5 py-3 rounded-xl border border-zinc-800 font-medium hover:border-zinc-500 hover:text-white transition-all active:scale-90 shadow-md transform-gpu"
                                >
                                    {wordObj.text}
                                </button>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div className="max-w-md mx-auto pt-4">
                            <button
                                disabled={selectedWords.length === 0}
                                onClick={handleWordOrderSubmit}
                                className="btn btn-primary w-full py-4 flex items-center justify-center gap-3 shadow-2xl disabled:opacity-30 disabled:grayscale transition-all text-lg font-bold"
                            >
                                <Send className="w-5 h-5" />
                                Check Answer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
