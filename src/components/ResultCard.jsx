import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, Quote, BarChart2 } from 'lucide-react';

export default function ResultCard({ word, feedback, onNext, devMode }) {
    const isCorrect = feedback.correct;

    // Calculate selection probability (weight)
    const weight = Math.max(1, (word.failCount - word.successCount) + 3);

    return (
        <div className="card max-w-lg mx-auto space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
                {isCorrect ? (
                    <>
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-500">Richtig!</h3>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-red-500">Falsch</h3>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 py-4 border-y border-zinc-800/50">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Correct Answer</span>
                    <p className="text-xl font-medium">
                        {(() => {
                            const art = [word.der, word.die, word.das].find(a => a && a !== '' && a !== '-');
                            return art ? `${art} ` : '';
                        })()}
                        {word.word}
                    </p>
                    <p className="text-zinc-500 italic">{word.english}</p>
                </div>

                {/* Word Statistics */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-zinc-800/30 border border-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Successes</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-zinc-300">{word.successCount}</span>
                    </div>
                    <div className="flex-1 bg-zinc-800/30 border border-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <XCircle className="w-3 h-3 text-red-500/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Failures</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-zinc-300">{word.failCount}</span>
                    </div>
                </div>

                {/* SRS Weight (Dev Mode Only) */}
                {devMode && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-500/80">
                            <BarChart2 className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">SRS Debug (Weight)</span>
                        </div>
                        <p className="text-sm font-mono font-bold text-amber-400">{weight}</p>
                    </div>
                )}

                {word.sentence && (
                    <div className="bg-zinc-800/30 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Quote className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">A1 Example</span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{word.sentence}</p>
                    </div>
                )}

                {word.trivia && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-amber-500/60">
                            <Lightbulb className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Memory Tip</span>
                        </div>
                        <p className="text-sm text-amber-200/80 leading-relaxed font-normal">{word.trivia}</p>
                    </div>
                )}
            </div>

            <button
                onClick={onNext}
                autoFocus
                className="btn btn-primary w-full py-4 flex items-center justify-center gap-2 group"
            >
                <span>Next Word</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
