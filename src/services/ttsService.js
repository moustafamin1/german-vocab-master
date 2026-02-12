let voices = [];

// Initialize voices and listen for changes (as they load asynchronously)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
    };
}

let silentAudio = null;

export const ttsService = {
    enableBackgroundMode: () => {
        if (typeof window === 'undefined') return;

        if (!silentAudio) {
            // Minimal silent WAV: 1 second, 8000Hz, mono, 8-bit
            const silentWav = "data:audio/wav;base64,UklGRjIAAABXQVZFYm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAA";
            silentAudio = new Audio(silentWav);
            silentAudio.loop = true;
        }

        silentAudio.play().catch(e => console.warn('Silent audio play failed:', e));
    },
    disableBackgroundMode: () => {
        if (silentAudio) {
            silentAudio.pause();
            silentAudio.currentTime = 0;
        }
    },
    speak: (text, onEnd) => {
        if (!('speechSynthesis' in window)) {
            console.error('Web Speech API not supported in this browser.');
            if (onEnd) onEnd();
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 0.9; // Slightly slower for better clarity in learning

        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = (event) => {
                console.error('TTS Error:', event);
                onEnd(); // Ensure loop continues
            };
        }

        // If voices haven't loaded yet, try to get them now
        if (voices.length === 0) {
            voices = window.speechSynthesis.getVoices();
        }

        // Find a German voice
        // Priority: Google German, then any German voice, then default
        const germanVoice = voices.find(v => v.lang.startsWith('de') && v.name.includes('Google')) ||
                           voices.find(v => v.lang.startsWith('de'));

        if (germanVoice) {
            utterance.voice = germanVoice;
        }

        window.speechSynthesis.speak(utterance);
    },
    stop: () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
};
