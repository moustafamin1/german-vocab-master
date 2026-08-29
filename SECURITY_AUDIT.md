# Security Audit Report - Vocaccia

**Date**: 2024-05-24
**Status**: Audit Only

## Executive Summary
This repository was audited for security risks following a period where it was unintentionally made public. The audit identified several points of exposure related to hardcoded IDs, public spreadsheet links, and local system path disclosures.

---

## Detailed Findings

### 1. Exposed Google Spreadsheet Links (Medium Risk)
*   **File**: `src/services/vocabService.js` (line 7)
*   **File**: `scripts/fetch-vocab.js` (line 6)
*   **Description**: The `GOOGLE_SHEET_CSV_URL` uses a "Publish to the web" link.
*   **Impact**: Anyone with the link can view the data in the published sheet without authentication. If the spreadsheet contains sensitive or private information, it is publicly accessible.

### 2. Local System Path Disclosure (Low Risk)
*   **File**: `scripts/fetch-vocab.js` (line 14)
*   **Description**: Hardcoded shell commands reference the user's home directory: `~/.gemini/antigravity/...`.
*   **Impact**: Discloses information about the user's local file structure and toolset (`gsheets-venv`, `antigravity`).

### 3. Development Server Sync Endpoint (Low/Medium Risk)
*   **File**: `vite.config.js` (line 45)
*   **Description**: A custom middleware endpoint `/api/sync` triggers a local script execution via HTTP.
*   **Impact**: If the development server is exposed to a network, unauthorized users could trigger the sync process. While currently static, this pattern is generally discouraged without authentication.

### 4. Public Tracking of Personal Data (Low Risk)
*   **File**: `src/data/vocab.json`
*   **Description**: The file tracks personal learning progress (`successCount`, `failCount`).
*   **Impact**: This data is public and visible to anyone browsing the repository.

---

## Recommendations

1.  **Environment Variables**:
    *   Move the `SPREADSHEET_ID`, `GOOGLE_SHEET_CSV_URL`, and local paths to a `.env` file.
    *   Ensure `.env` is added to `.gitignore`.
2.  **Access Control**:
    *   Consider unpublishing the spreadsheet and using the Google Sheets API with a service account for better security.
3.  **Endpoint Protection**:
    *   Add a simple API key or token check to the `/api/sync` endpoint in `vite.config.js`.
4.  **Clean History**:
    *   If any of the above info is considered highly sensitive, use a tool like `git filter-repo` to remove them from the repository's history.

## Retrospective Risks & Forks

### 1. The Impact of a Fork
Since a fork was created while the repository was public, the forker now has a complete copy of the code and Git history as it existed at that moment. Making the original repository private does **not** automatically delete or privatize existing forks.

### 2. Severing the Link to Live Data
The most effective way to protect yourself from a retrospective leak in a fork is to **deactivate the external data sources**:
*   **Google Sheet**: Go to your Google Sheet settings and **"Stop publishing"** the tab that was shared. This immediately breaks the `GOOGLE_SHEET_CSV_URL` for anyone who has it.
*   **Rotate the Sheet**: If you want to be 100% sure, create a *copy* of the spreadsheet, delete the original, and use the new ID in your private repository. This ensures the old ID in the fork points to a dead file.

### 3. Cleaning Local History
Even though the repository is now private, the "secrets" (Sheet ID, local paths) still exist in your Git history. If you ever invite a collaborator to this private repo, they will be able to see those old commits.
*   **Recommendation**: Use `git filter-repo` or `bfg-repo-cleaner` to overwrite the history of those specific files if you plan on ever making the repo public again or sharing it.
