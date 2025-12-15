
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

async function main() {
    let apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
        // Try reading .env file manually
        try {
            const envPath = path.resolve(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/API_KEY=(.*)/) || envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
                if (match) {
                    apiKey = match[1].trim();
                    console.log("Found API Key in .env");
                }
            }
        } catch (e) {
            console.error("Error reading .env", e);
        }
    }

    if (!apiKey) {
        console.error("Could not find API KEY. Please set API_KEY env var.");
        // Fallback: Check if there's a hardcoded one in a file? No, insecure.
        return;
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        console.log("Listing models...");
        const response = await ai.models.list();
        console.log("Available Models:");
        response.models.forEach(m => {
            if (m.name.includes("video") || m.name.includes("image")) return; // Filter visual noise if wanted, but better show all
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

main();
