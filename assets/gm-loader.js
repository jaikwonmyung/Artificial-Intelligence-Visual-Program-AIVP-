/**
 * GENTLE MONSTER AI - CORE LOADER
 * Consolidated logic for Authentication, Mobile Redirect, and Dynamic UI Injection.
 * Optimized for performance and stability.
 */

(function () {
    'use strict';

    const CONFIG = {
        password: 'Aud1950!',
        mobileBreakpoint: 768,
        storageKey: 'gm_auth',
        redirectTarget: '/mobile.html'
    };

    /**
     * 1. Mobile Detection & Redirect
     * Runs immediately to prevent flashing unoptimized content on mobile.
     */
    function handleMobileRedirect() {
        // Only redirect if on index page (not already on mobile.html)
        // We check if the current path does NOT end with mobile.html
        if (!window.location.pathname.endsWith('mobile.html') &&
            window.innerWidth <= CONFIG.mobileBreakpoint) {
            window.location.href = CONFIG.redirectTarget;
        }
    }

    /**
     * 2. Authentication Logic
     * Handles the "Space Team Access" overlay.
     */
    function initAuth() {
        const overlay = document.getElementById('auth-overlay');
        const input = document.getElementById('pass-input');
        const btn = document.getElementById('auth-btn');
        const errorMsg = document.getElementById('error-msg');

        // If elements are missing (e.g. specialized page), skip auth
        if (!overlay || !input || !btn || !errorMsg) return;

        // Check Session
        if (sessionStorage.getItem(CONFIG.storageKey) === 'true') {
            overlay.style.display = 'none';
            // Start Observer immediately if authorized
            initUIObserver(); 
        } else {
            // Setup Event Listeners
            btn.addEventListener('click', checkPass);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') checkPass();
            });
            // Focus input for better UX (Desktop only usually)
             if (window.innerWidth > CONFIG.mobileBreakpoint) {
                input.focus();
             }
        }

        function checkPass() {
            if (input.value === CONFIG.password) {
                sessionStorage.setItem(CONFIG.storageKey, 'true');
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
                input.blur();
                initUIObserver(); // Start Observer after auth
            } else {
                errorMsg.style.opacity = '1';
                input.value = '';
                setTimeout(() => {
                    errorMsg.style.opacity = '0';
                }, 2000);
            }
        }
    }

    /**
     * 3. Dynamic UI Injection (MutationObserver)
     * Injects "GET API KEY" and "LOGOUT" buttons into the React App.
     */
    function initUIObserver() {
        // Safe check for root container
        const root = document.getElementById('root');
        if (!root) {
            // Retry if React hasn't mounted the root div yet
            setTimeout(initUIObserver, 100);
            return;
        }

        console.log('GM: Core Loader Initialized. Starting UI Observer.');

        let debounceTimeout;
        const observer = new MutationObserver((mutations) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(runInjectionLogic, 200);
        });

        // Start observing
        observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    /**
     * Core Injection Logic
     * Scans the DOM for specific text signatures to inject buttons.
     */
    function runInjectionLogic() {
        const allElements = document.body.querySelectorAll('*');
        let apiInputContainer = null;
        let createFound = false;
        let renderFound = false;

        for (const el of allElements) {
            // Optimization: Skip non-visual or input elements
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'INPUT', 'TEXTAREA'].includes(el.tagName)) continue;

             // Logic: Check text content
            const text = el.textContent ? el.textContent.trim().toUpperCase() : '';
            if (text.length === 0 || text.length > 50) continue; // Skip empty or long text blocks

            // A. Detect AI STUDIO Page
            // Look for "AI STUDIO" label (leaf node preference)
            if (text.includes('AI STUDIO') && el.children.length === 0) {
                console.log('GM: Detected AI STUDIO page.');
                apiInputContainer = el.parentElement;
            }

            // B. Detect Selection Page (CREATE / RENDER)
            if (text === 'CREATE') createFound = true;
            if (text === 'RENDER') renderFound = true;
        }

        // --- INJECT: GET API KEY BUTTON ---
        if (apiInputContainer) {
            if (!document.getElementById('get-api-key-btn')) {
                console.log('GM: Injecting API Key Button.');
                const btn = document.createElement('a');
                btn.id = 'get-api-key-btn';
                btn.href = 'https://aistudio.google.com/app/apikey';
                btn.target = '_blank';
                btn.textContent = 'GET API KEY →';
                btn.style.cssText = `
                    display: block; margin-top: 20px; color: #666; font-family: 'Inter', sans-serif;
                    font-size: 11px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;
                    text-align: center; border: 1px solid #333; padding: 12px; width: 100%; max-width: 100%;
                    background: #000; transition: all 0.2s; cursor: pointer; position: relative; z-index: 100;
                `;
                btn.addEventListener('mouseenter', () => { btn.style.color = '#fff'; btn.style.borderColor = '#666'; });
                btn.addEventListener('mouseleave', () => { btn.style.color = '#666'; btn.style.borderColor = '#333'; });
                apiInputContainer.appendChild(btn);
            }
        }

        // --- INJECT: LOGOUT BUTTON ---
        if (createFound && renderFound) {
            if (!document.getElementById('gm-logout-btn')) {
                console.log('GM: Injecting Logout Button.');
                const btn = document.createElement('div');
                btn.id = 'gm-logout-btn';
                btn.textContent = 'LOGOUT';
                btn.style.cssText = `
                    position: fixed; top: 20px; right: 20px; color: #444; font-family: 'Inter', sans-serif;
                    font-size: 10px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer;
                    z-index: 99999; padding: 8px 12px; border: 1px solid rgba(51,51,51,0.5);
                    background: rgba(0,0,0,0.8); transition: all 0.2s; backdrop-filter: blur(4px);
                `;
                btn.addEventListener('mouseenter', () => { btn.style.color = '#fff'; btn.style.borderColor = '#666'; });
                btn.addEventListener('mouseleave', () => { btn.style.color = '#444'; btn.style.borderColor = '#333'; });
                btn.addEventListener('click', () => {
                    if (confirm('Disconnect API Key & Logout?')) {
                        sessionStorage.removeItem(CONFIG.storageKey); // Clear session
                        localStorage.removeItem('GEMINI_API_KEY'); // Clear API key if stored there (common convention)
                        // Also clear everything else to be safe
                        sessionStorage.clear();
                        localStorage.clear();
                        window.location.reload();
                    }
                });
                document.body.appendChild(btn);
            }
        }
    }

    // --- INITIALIZATION ---
    handleMobileRedirect(); // Run ASAP
    
    // Wait for DOM for Auth and Observer
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

})();
