import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function QuizCard({ word, mode, options, onAnswer }) {
    const [writtenInput, setWrittenInput] = useState('');

    const handleWrittenSubmit = (e) => {
        e.preventDefault();
        onAnswer(writtenInput.trim());
        setWrittenInput('');
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
                        mode === 'written' ? 'Written Challenge' : 'Article Master'}
                </span>
            </div>

            {/* Middle Section (Main Question) */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {mode === 'article' ? word.word : word.english}
                    {mode !== 'article' && mode !== 'written' && getArticle(word) && (
                        <span className="text-zinc-500 text-2xl ml-3">({getArticle(word)})</span>
                    )}
                </h2>
                {mode === 'written' && (
                    <p className="text-zinc-500 mt-4 text-sm font-medium uppercase tracking-widest">Translate to German</p>
                )}
            </div>

            {/* Bottom Section (Interaction) */}
            <div className="max-w-md mx-auto w-full pb-12 px-4 space-y-6">
                {mode === 'multipleChoice' && (
                    <div className="grid grid-cols-1 gap-3">
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
                    <form onSubmit={handleWrittenSubmit} className="space-y-4">
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
                    <div className="grid grid-cols-3 gap-3">
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
            </div>
        </div>
    );
}
