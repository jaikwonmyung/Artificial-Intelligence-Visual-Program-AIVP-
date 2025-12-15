# Gentle Monster AI - Mac Migration Guide

## 🍎 How to run on Mac

1.  **Unzip** the provided `GM_Mac_Export.zip` file to your desired folder (e.g., `Documents/GM`).
2.  Open **Terminal** (Command + Space, type "Terminal").
3.  Type `cd ` (with a space) and verify you drag the folder into the terminal window to set the path, then check Enter.
    *   Example: `cd /Users/yourname/Documents/GM`
4.  Run the setup script:
    ```bash
    sh mac_setup.sh
    ```
5.  **Enter your API Key** when prompted.
6.  The app will install dependencies and automatically open in your browser.

## 🛠 Manual Setup (If script fails)

1.  Ensure **Node.js** is installed.
2.  Run `npm install` in the folder.
3.  Create a file named `.env.local` and add your key:
    ```
    VITE_GEMINI_API_KEY=your_key_here
    ```
4.  Run `npm run dev`.
