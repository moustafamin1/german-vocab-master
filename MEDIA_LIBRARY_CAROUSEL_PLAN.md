# Media Library Carousel Plan

## Objective
The goal is to display a horizontal carousel of media items (images and video thumbnails) directly on the Settings page, allowing users to preview their collection and access the full library via a "Show More" button.

## Steps

### 1. Create `src/components/MediaCarousel.jsx`
*   **Responsibility**: Fetch and display a horizontal list of media items.
*   **Logic**:
    *   Use `mediaService.getImages()` to fetch data on component mount.
    *   Limit the initial fetch or render to a reasonable number (e.g., 20) for performance, or render all if "all" is strictly required (lazy loading might be overkill for now but good to keep in mind).
*   **UI Structure**:
    *   A container with `overflow-x-auto` for horizontal scrolling.
    *   Individual cards for each media item:
        *   Image: Display `item.url`.
        *   Video: Display `item.thumbnail` with a "Play" icon overlay.
    *   **Interactions**:
        *   Clicking an item could open the full `MediaLibrary` view (simplest) or a local lightbox. *Decision: Clicking an item opens the full Media Library to the specific item if possible, or just opens the library.*
        *   **Show More Card**: A final card in the carousel that says "Show More" or "+X more", which triggers the `onOpenLibrary` callback.

### 2. Update `src/components/SettingsScreen.jsx`
*   Import `MediaCarousel`.
*   Locate the "Media Library" section.
*   Update the section to include the `MediaCarousel` component.
*   Pass `onOpenMediaLibrary` to `MediaCarousel` to handle the "Show More" action.

### 3. Styling (Tailwind CSS)
*   Ensure the carousel fits within the card boundaries.
*   Use `snap-x` for smooth scrolling behavior.
*   Style the "Show More" button to look distinct but integrated.

### 4. Verification
*   Verify that images load correctly from IndexedDB.
*   Verify horizontal scrolling works.
*   Verify the "Show More" button navigates to the full library.

### 5. Pre-commit
*   Frontend verification using Playwright to ensure the carousel renders and is scrollable.
