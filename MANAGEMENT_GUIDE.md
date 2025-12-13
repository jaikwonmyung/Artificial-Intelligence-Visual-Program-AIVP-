# AIVP Project Management Guide

## How to Resume Development
This project is linked to GitHub and Vercel. Here is how to work on it in the future:

1.  **Open Antigravity**: Start the agent as usual.
2.  **Open Project**: Open the folder `/Users/jaikwonmyung/Documents/Artificial Intelligence Visual Program (AIVP)`.
3.  **Make Changes**: Ask the agent to modify code, add features, or fix bugs.
    *   *The changes happen locally on your computer first.*

## How to Update the Website (Deploy)
Your changes are **local only** until you "Push" them.
To update `gentlemonster.studio`:

1.  **Ask the Agent**: "Push these changes to GitHub" or "Deploy the website".
2.  **Wait 1 Minute**: Vercel detects the change and automatically updates the live site.

## Project Structure
*   **`app/index.html`**: The **Desktop (PC)** version of the site.
*   **`app/mobile.html`**: The **Mobile (Phone)** version of the site.
*   **Redirect Logic**: Mobile users visiting the main site are automatically sent to `mobile.html`.

## Key Commands (Manual)
If you are using a terminal manually:
*   **Test Locally**: `python3 -m http.server 3030` (Then go to `localhost:3030`)
*   **Deploy**: `git add . && git commit -m "Update message" && git push`
