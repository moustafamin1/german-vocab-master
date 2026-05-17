import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, ArrowRight, Play, CheckCircle2, XCircle } from 'lucide-react';
import { getWeightedRandomWord } from '../utils/srs-logic';

export default function PronunciationScreen({ vocabPool, srsOffset, onUpdateStats, onBack }) {
    const [currentWord, setCurrentWord] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState(null); // { correct: boolean, recognized: string }
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);

    // Initialize the pool of nouns
    const nounPool = vocabPool.filter(v => v.type === 'Noun' && v.status !== 'skip');

    const pickNewWord = useCallback(() => {
        if (nounPool.length === 0) return;
        const randomWord = getWeightedRandomWord(nounPool, srsOffset);
        setCurrentWord(randomWord);
        setFeedback(null);
        setError(null);
    }, [nounPool, srsOffset]);

    // Initial word pick
    useEffect(() => {
        if (!currentWord && nounPool.length > 0) {
            pickNewWord();
        }
    }, [currentWord, nounPool.length, pickNewWord]);

    useEffect(() => {
        // Initialize SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'de-DE'; // German

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setError(null);
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                checkPronunciation(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                if (event.error === 'no-speech') {
                    setError('Keine Sprache erkannt. Bitte erneut versuchen.'); // No speech detected
                } else if (event.error === 'audio-capture') {
                    setError('Mikrofon nicht gefunden.'); // Microphone not found
                } else if (event.error === 'not-allowed') {
                    setError('Mikrofon-Zugriff verweigert.'); // Microphone access denied
                } else {
                    setError(`Fehler: ${event.error}`);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            setError('Spracherkennung wird von diesem Browser nicht unterstützt. Bitte Chrome oder Safari verwenden.');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [currentWord]); // Re-bind if currentWord changes so checkPronunciation has latest state

    const simplifyText = (str) => {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/ä/g, 'a')
            .replace(/ö/g, 'o')
            .replace(/ü/g, 'u')
            .replace(/ae/g, 'a')
            .replace(/oe/g, 'o')
            .replace(/ue/g, 'u')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/ß/g, 'ss')                             // Replace eszett
            .replace(/[\s\p{P}\p{S}]/gu, '');                // Remove spaces/punctuation
    };

    const checkPronunciation = (transcript) => {
        if (!currentWord) return;

        const targetWord = currentWord.word;
        const targetArticle = currentWord.article || '';

        // Check both just the word, and article + word
        const sTranscript = simplifyText(transcript);
        const sWord = simplifyText(targetWord);
        const sWithArticle = simplifyText(targetArticle + targetWord);

        const isCorrect = sTranscript === sWord || sTranscript === sWithArticle;

        setFeedback({
            correct: isCorrect,
            recognized: transcript
        });

        // Update SRS and Global stats via the callback
        if (onUpdateStats) {
            onUpdateStats(currentWord, isCorrect, true); // true indicates it's from pronunciation mode
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Ignore if already started
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    if (nounPool.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
                <p className="text-zinc-400 mb-4">Keine Nomen zum Üben gefunden.</p>
                <button onClick={onBack} className="text-blue-400 font-medium">Zurück</button>
            </div>
        );
    }

    if (!currentWord) return null;

    return (
        <div className="flex flex-col items-center max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header / Back Button */}
            <div className="w-full flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium"
                >
                    &larr; Zurück
                </button>
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    Aussprache (Beta)
                </span>
            </div>

            {/* Target Word Card */}
            <div className="w-full bg-[#18181b] border border-zinc-800/50 rounded-2xl p-8 mb-8 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20" />

                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                    {currentWord.english}
                </h2>

                <div className="flex items-end justify-center gap-2 mb-2">
                    {currentWord.article && (
                        <span className="text-2xl font-light text-zinc-500">
                            {currentWord.article}
                        </span>
                    )}
                    <span className="text-4xl font-bold text-zinc-100 tracking-tight">
                        {currentWord.word}
                    </span>
                </div>

                {error && (
                    <div className="mt-4 text-xs text-red-400 bg-red-400/10 p-2 rounded-lg inline-block">
                        {error}
                    </div>
                )}
            </div>

            {/* Interaction Area */}
            {!feedback ? (
                <div className="flex flex-col items-center gap-6 w-full">
                    <button
                        onPointerDown={startListening}
                        onPointerUp={stopListening}
                        onPointerLeave={stopListening}
                        // Fallbacks for desktop testing if pointer events act weird
                        onMouseDown={startListening}
                        onMouseUp={stopListening}
                        onMouseLeave={stopListening}
                        onTouchStart={startListening}
                        onTouchEnd={stopListening}
                        className={`
                            relative group flex items-center justify-center
                            w-32 h-32 rounded-full transition-all duration-200
                            ${isListening
                                ? 'bg-blue-500 scale-95 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
                                : 'bg-[#18181b] border border-zinc-700/50 hover:bg-zinc-800'
                            }
                        `}
                    >
                        {isListening && (
                            <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping" />
                        )}
                        <Mic
                            className={`w-12 h-12 transition-colors ${isListening ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                        />
                    </button>
                    <p className={`text-sm font-medium transition-colors ${isListening ? 'text-blue-400' : 'text-zinc-500'}`}>
                        {isListening ? 'Zuhören...' : 'Halten zum Sprechen'}
                    </p>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                    <div className={`
                        w-full p-6 rounded-2xl border text-center mb-6
                        ${feedback.correct
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }
                    `}>
                        <div className="flex justify-center mb-3">
                            {feedback.correct
                                ? <CheckCircle2 className="w-10 h-10" />
                                : <XCircle className="w-10 h-10" />
                            }
                        </div>
                        <h3 className="font-bold text-lg mb-1">
                            {feedback.correct ? 'Richtig!' : 'Leider Falsch'}
                        </h3>
                        <p className="text-sm opacity-80">
                            Gehört: <span className="font-semibold">"{feedback.recognized}"</span>
                        </p>
                    </div>

                    <button
                        onClick={pickNewWord}
                        className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        Nächstes Wort
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
}
