import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center border border-red-900/50">
                        <AlertTriangle className="text-red-500" size={32} />
                    </div>

                    <div className="text-center space-y-2 max-w-md">
                        <h1 className="text-xl font-normal uppercase tracking-widest">System Malfunction</h1>
                        <p className="text-zinc-500 text-xs font-mono">
                            {this.state.error?.message || 'An unexpected error occurred in the visualization engine.'}
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black font-normal uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
                    >
                        <RefreshCw size={14} />
                        Reboot System
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
