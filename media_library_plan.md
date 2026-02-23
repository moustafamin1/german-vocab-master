# Plan: Show Media Library Carousel in Settings

## Objective
Display a carousel of all photos from the media library in the Settings page, including a "Show more" button.

## Steps

1.  **Modify `src/components/SettingsScreen.jsx`**:
    *   **Imports**:
        *   Import `mediaService` from `../services/mediaService`.
        *   Import `Play` icon from `lucide-react` (for video thumbnails).
        *   Ensure `useState` and `useEffect` are imported.
    *   **State**:
        *   Add a state variable `images` to store the fetched media items.
    *   **Data Loading**:
        *   Use `useEffect` to fetch images via `mediaService.getImages()` on component mount.
        *   Store the result in `images`.
    *   **UI Updates (Media Library Section)**:
        *   Update the "Open" button text to "Show more" (or similar).
        *   Add a horizontal scrollable container (`flex overflow-x-auto`) below the header.
        *   Map through `images` and render a thumbnail for each item.
            *   For images: Use the blob URL (`item.url`).
            *   For videos: Use the thumbnail URL (`item.thumbnail`).
            *   Add a small Play icon overlay for videos.
        *   Style the items to be consistent (e.g., square aspect ratio, rounded corners).
        *   Handle the empty state (if no images, show the default empty message or just the header).

2.  **Verify Changes**:
    *   Run the application (`npm run dev`).
    *   Go to Settings.
    *   Verify that the carousel appears and scrolls horizontally.
    *   Verify that images and video thumbnails are displayed correctly.
    *   Verify that the "Show more" button opens the full Media Library.
