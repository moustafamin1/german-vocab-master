# Pronunciation Feature Plan

## Step 1: Create `PronunciationScreen.jsx`
- Create the new component `PronunciationScreen` in `src/components/PronunciationScreen.jsx`.
- This screen will accept the `vocabPool` to randomly select Nouns.
- It will contain logic to start/stop the Web Speech API (`webkitSpeechRecognition` or `SpeechRecognition`).
- It will display the target German word (e.g., "der Hund") and an English hint.
- It will feature a prominent "Hold to Speak" or "Tap to Speak" microphone button using `lucide-react` icons.
- Upon recognition, it will compare the spoken text with the target word (ignoring case, punctuation, and articles if necessary).
- It will show immediate feedback: "Correct!" or "Wrong, you said: [transcribed text]" and let the user move to the next word.

## Step 2: Integrate into `App.jsx`
- Add a new state string to the `view` state (e.g., `'pronunciation'`).
- Render the `PronunciationScreen` when `view === 'pronunciation'`.
- Pass a callback to the screen to allow navigating back to the settings page.

## Step 3: Add Navigation Button
- Add a navigation button in `src/components/SettingsScreen.jsx`.
- Add a new "Pronunciation Practice" menu item alongside "All Words" and "Media Library" that calls a function (e.g. `onOpenPronunciation()`) to change the view state in `App.jsx`.

## Step 4: Update Props
- Update `App.jsx` Settings View props.
- Pass the new `onOpenPronunciation` handler to the `SettingsScreen` component.

## Step 5: Verification & Pre-commit
- Ensure proper testing, verification, review, and reflection are done (linting, manual UI test via Playwright scripts to ensure the screen renders correctly and the microphone button behaves properly).
