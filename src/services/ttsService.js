let voices = [];

// Initialize voices and listen for changes (as they load asynchronously)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
    };
}

export const ttsService = {
    speak: (text) => {
        if (!('speechSynthesis' in window)) {
            console.error('Web Speech API not supported in this browser.');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 0.9; // Slightly slower for better clarity in learning

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
    }
};
