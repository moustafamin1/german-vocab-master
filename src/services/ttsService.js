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
    updateMetadata: (title, artist, album) => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'Vocaccia',
                artist: artist || 'German Vocabulary',
                album: album || 'Vocaccia Loop',
            });
        }
    },

    enableBackgroundMode: (title, artist, album, handlers = {}) => {
        if (typeof window === 'undefined') return;

        if (!silentAudio) {
            // 1-second silent WAV (8000Hz, 16-bit, mono)
            const silentWav = "data:audio/wav;base64,UklGRjIAAABXQVZFYm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAA";
            silentAudio = new Audio(silentWav);
            silentAudio.loop = true;
            silentAudio.volume = 0.001; // Extremely low volume to avoid "complete silence" optimizations while remaining inaudible
        }

        // Set initial metadata
        ttsService.updateMetadata(title, artist, album);

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';

            // Set action handlers if provided
            if (handlers.play) navigator.mediaSession.setActionHandler('play', handlers.play);
            if (handlers.pause) navigator.mediaSession.setActionHandler('pause', handlers.pause);
            if (handlers.nexttrack) navigator.mediaSession.setActionHandler('nexttrack', handlers.nexttrack);
            if (handlers.previoustrack) navigator.mediaSession.setActionHandler('previoustrack', handlers.previoustrack);
        }

        return silentAudio.play().catch(e => {
            console.warn('Silent audio play failed:', e);
            // If play fails, we try again on a user gesture or let it be
        });
    },

    disableBackgroundMode: () => {
        if (silentAudio) {
            silentAudio.pause();
            silentAudio.currentTime = 0;
        }
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    },
    speak: (text, onEnd) => {
        if (!('speechSynthesis' in window)) {
            console.error('Web Speech API not supported in this browser.');
            if (onEnd) onEnd();
            return;
        }

        // Cancel any ongoing speech and resume if stuck
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

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
