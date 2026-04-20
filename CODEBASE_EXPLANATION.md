# Codebase Explanation: German Vocabulary Quiz App

## 1. Project Overview
This project is a **React-based Single Page Application (SPA)** designed for learning German vocabulary using a **Spaced Repetition System (SRS)**. It fetches vocabulary data from Google Sheets, caches it locally, and tracks user progress (success/fail counts) to prioritize difficult words. The app is built with **Vite** and styled with **Tailwind CSS**. It also targets mobile platforms via **Capacitor**.

## 2. Tech Stack
-   **Frontend Framework:** React (with Hooks).
-   **Build Tool:** Vite.
-   **Styling:** Tailwind CSS (utility-first CSS).
-   **State Management:** React `useState`, `useEffect`, `useCallback` (local state + context via props).
-   **Persistence:** IndexedDB (via `idb` pattern) with `localStorage` fallback.
-   **Mobile Integration:** Capacitor (for native app capabilities).
-   **Icons:** Lucide React.
-   **CSV Parsing:** PapaParse (for Google Sheets CSV data).

## 3. Project Structure
The project follows a standard React/Vite directory structure:

### Key Directories
-   `src/components/`: Reusable UI components (QuizCard, ResultCard, SettingsScreen, etc.).
-   `src/services/`: Core logic and data handling (fetching, storage, TTS).
-   `src/utils/`: Helper functions (SRS algorithm).
-   `src/data/`: Static assets (initial `vocab.json`).
-   `scripts/`: Node.js scripts for maintenance (e.g., `fetch-vocab.js`).

### Important Files
-   `src/App.jsx`: The main controller. It handles routing (view switching), state initialization, data merging (vocab + SRS stats), and user interactions.
-   `src/services/vocabService.js`: Fetches vocabulary from Google Sheets, cleans the data, and caches it.
-   `src/services/storageService.js`: A robust wrapper around IndexedDB and `localStorage` to ensure data persistence and recovery.
-   `src/utils/srs-logic.js`: Implements the weighted selection algorithm for SRS.
-   `src/services/ttsService.js`: Handles Text-to-Speech using the Web Speech API and manages background audio playback.
-   `src/services/mediaService.js`: Manages user-uploaded images/videos in IndexedDB for the Media Library feature.

## 4. Core Features & Logic

### Spaced Repetition System (SRS)
-   **Algorithm:** Words are selected using a weighted random probability.
-   **Formula:** `Weight = max(1, (failCount - successCount) + offset)` (default offset is 3).
-   **Implementation:** Located in `src/utils/srs-logic.js`. The app calculates weights for all eligible words and picks one based on the total weight.

### Data Persistence
-   **Storage Strategy:** The app prioritizes **IndexedDB** for storing large datasets (like cached vocab and media) and user progress. It falls back to **localStorage** if IndexedDB is unavailable.
-   **Sync:** User progress (SRS stats, global stats, daily stats) is merged with the base vocabulary at runtime in `App.jsx`.
-   **Backup:** Users can export their data to a JSON file (`storageService.shareBackup`).

### Vocabulary Management
-   **Source:** Google Sheets (CSV export).
-   **Fetching:** `vocabService.fetchAndCacheVocab` fetches data from two sheets (Main Vocab + Grammar), parses it with PapaParse, cleans it, and saves it to storage.
-   **Structure:** Words have attributes like `word`, `type` (Noun, Phrase, Grammar), `level` (A1, A2, etc.), `article`, and `english`.

### Text-to-Speech (TTS)
-   **Engine:** Uses the browser's `SpeechSynthesis` API.
-   **Features:**
    -   Selects German voices automatically.
    -   Supports background playback on mobile by playing a silent audio loop (`enableBackgroundMode`).
    -   Handles media session metadata (title, artist).

### Media Library
-   **Functionality:** Allows users to add images and Instagram Reels links to a personal library.
-   **Storage:** Images are stored as Blobs in IndexedDB; Video links are stored as URLs.

## 5. Key Workflows

### The Quiz Loop
1.  **Config**: User selects levels (A1, A2), modes (Multiple Choice, Written), and types (Noun, Phrase).
2.  **Selection**: `App.jsx` filters the vocabulary pool based on config.
3.  **SRS Pick**: `getWeightedRandomWord` selects a word based on difficulty.
4.  **Quiz**: User answers the question (Multiple Choice or Written).
5.  **Feedback**: App verifies the answer, updates SRS stats (success/fail), and shows `ResultCard`.
6.  **Next**: Process repeats.

### Initialization (`App.jsx`)
1.  **Load**: Fetches `vocab-srs-data`, `vocab-global-stats`, and `app-settings` from storage.
2.  **Merge**: Combines stored stats with the base vocabulary list.
3.  **Recover**: Attempts to "heal" broken keys (migration from old data formats).
4.  **Ready**: Sets view to `config`.
