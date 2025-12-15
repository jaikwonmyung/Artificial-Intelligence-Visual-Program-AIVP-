#!/bin/bash

# Gentle Monster AI - Mac Setup Script

echo "==========================================="
echo "   GENTLE MONSTER AI - MAC SETUP"
echo "==========================================="

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js could not be found."
    echo "   Please install Node.js from https://nodejs.org/"
    echo "   Recommended: Download 'LTS' version."
    exit 1
fi
echo "✅ Node.js found: $(node -v)"

# 2. Install Dependencies
echo "-------------------------------------------"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (npm install)..."
    echo "   This might take a minute."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed. Please check your internet connection."
        exit 1
    fi
else
    echo "✅ Dependencies already installed."
fi

# 3. Setup API Key
echo "-------------------------------------------"
if [ ! -f ".env.local" ]; then
    echo "🔑 API Key configuration needed."
    echo "   (You can paste your key now, or press Enter to skip and edit .env.local manually later)"
    read -p "   Enter GEMINI_API_KEY: " user_key
    
    if [ -n "$user_key" ]; then
        echo "VITE_GEMINI_API_KEY=$user_key" > .env.local
        echo "✅ .env.local created with your key."
    else
        echo "⚠️  Skipped. App may not function until you create .env.local with VITE_GEMINI_API_KEY."
    fi
else
    echo "✅ .env.local detected."
fi

# 4. Start Application
echo "-------------------------------------------"
echo "🚀 Starting Gentle Monster AI..."
echo "   Opening in browser..."
echo "   (Press Ctrl+C to stop the server)"
echo "-------------------------------------------"

# Use 'open' to launch browser after a slight delay
(sleep 3 && open "http://localhost:3000") &

npm run dev
