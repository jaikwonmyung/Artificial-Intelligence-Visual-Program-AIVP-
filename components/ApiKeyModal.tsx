import React, { useState } from 'react';
// import { Key, ArrowRight, Lock } from 'lucide-react'; // Commenting out Lucide for test
import { setStoredApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
    onSuccess: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSuccess }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            setStoredApiKey(key.trim());
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
            <div className="p-8 bg-zinc-900 border border-white/10 rounded-xl text-center">
                <p className="text-white mb-4">SYSTEM ACCESS RESTRICTED</p>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="password"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        className="bg-black text-white border border-white/20 p-2 rounded"
                        placeholder="API KEY"
                    />
                    <button type="submit" className="bg-white text-black px-4 py-2 rounded">ENTER</button>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyModal;
