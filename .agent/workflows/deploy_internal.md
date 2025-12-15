---
description: How to share the app on the internal company network
---

# Internal Deployment Guide

This guide explains how to share the **Gentle Monster Space Division** app with other employees on the internal network.

## Prerequisites
- The host machine (your computer) must be connected to the company Wi-Fi/LAN.
- You must know your machine's **Local IP Address**.

## Option 1: Quick Share (Development Mode)
Use this for temporary sharing during meetings or quick demos. It uses the development server.

1.  **Start the server**:
    ```bash
    npm run dev -- --host
    ```
    *(Note the extra `-- --host` flag, although your `vite.config.ts` already has `0.0.0.0` set, so plain `npm run dev` might work too)*

2.  **Find your IP**:
    -   Run `ipconfig` in a new terminal.
    -   Look for **IPv4 Address** (e.g., `192.168.1.15`).

3.  **Share**:
    -   Tell colleagues to open `http://<YOUR-IP>:3000` in their browser.

## Option 2: Production Build (Recommended)
Use this for a more stable experience.

1.  **Build the project**:
    ```bash
    // turbo
    npm run build
    ```

2.  **Preview the build**:
    ```bash
    npm run preview -- --host
    ```
    This serves the *built* files (faster, optimized) on your network.

3.  **Share**:
    -   Share the URL provided in the terminal (usually `http://<YOUR-IP>:4173`).

## Option 3: Static Hosting (Long-term)
If you need the app to run 24/7 without keeping your terminal open, copy the contents of the `dist` folder to a company web server (Nginx, Apache, IIS).

1.  Run `npm run build`.
2.  Copy the `dist/` folder to your server Wwwroot.
