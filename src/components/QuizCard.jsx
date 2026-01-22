import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function QuizCard({ word, mode, options, onAnswer }) {
    const [writtenInput, setWrittenInput] = useState('');

    const handleWrittenSubmit = (e) => {
        e.preventDefault();
        onAnswer(writtenInput.trim());
        setWrittenInput('');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {mode === 'multipleChoice' ? 'Multiple Choice' :
                        mode === 'written' ? 'Written Challenge' : 'Article Master'}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {mode === 'article' ? word.word : word.english}
                </h2>
                {mode === 'written' && word.type && (
                    <span className="inline-block text-xs bg-zinc-800 px-2 py-1 rounded-md text-zinc-400 mt-2">
                        {word.type}
                    </span>
                )}
            </div>

            <div className="max-w-md mx-auto">
                {mode === 'multipleChoice' && (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => onAnswer(opt)}
                                className="btn btn-secondary text-left py-4 px-6 hover:bg-zinc-800 hover:border-zinc-700 flex justify-between group"
                            >
                                <span>{opt}</span>
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
                            className="input w-full text-lg text-center"
                        />
                        <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
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
