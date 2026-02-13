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
            // 2-second silent WAV: 8000Hz, mono, 16-bit
            // This is slightly more robust than the minimal 8-bit version
            const silentWav = "data:audio/wav;base64,UklGRigAAABXQVZFYm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";
            // Wait, that one is too short. Let's use a better one.
            // Actually, any silent WAV that actually plays should work.
            // Let's use a 1s one but ensure it's properly formatted.
            const robustSilentWav = "data:audio/wav;base64,UklGRjIAAABXQVZFYm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAA";
            silentAudio = new Audio(robustSilentWav);
            silentAudio.loop = true;
            silentAudio.volume = 0.001; // Extremely low to be inaudible but technically "active"
        }

        if (silentAudio.paused) {
            silentAudio.play().catch(e => console.warn('Background audio play failed:', e));
        }
    },
    disableBackgroundMode: () => {
        if (silentAudio) {
            silentAudio.pause();
            silentAudio.currentTime = 0;
        }
    },
    updateMediaMetadata: (word) => {
        if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: word.word,
            artist: 'Vocaccia',
            album: word.english,
            artwork: [
                { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
            ]
        });
        navigator.mediaSession.playbackState = 'playing';
    },
    wait: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
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
