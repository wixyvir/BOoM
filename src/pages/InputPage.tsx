import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { CompressionService } from '../services/CompressionService';

export function InputPage() {
    const [snippet, setSnippet] = useState('');
    const navigate = useNavigate();

    const handleAnalyze = async () => {
        if (!snippet.trim()) return;
        try {
            const compressed = await CompressionService.compress(snippet);
            navigate(`/result#${compressed}`);
        } catch (error) {
            console.error('Failed to compress snippet:', error);
            // Handle error appropriately (e.g., show toast)
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                    Analyze Technical Snippets
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Paste your logs, stack traces, or configuration files below to get instant, valuable intelligence.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-100 px-4 py-3 flex items-center gap-2 text-slate-500 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Input Snippet</span>
                </div>
                <div className="p-2">
                    <textarea
                        value={snippet}
                        onChange={(e) => setSnippet(e.target.value)}
                        placeholder="Paste your snippet here..."
                        className="w-full h-96 p-4 resize-none focus:outline-none text-sm font-mono text-slate-800 placeholder:text-slate-400 bg-transparent"
                        spellCheck={false}
                    />
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                    <button
                        onClick={handleAnalyze}
                        disabled={!snippet.trim()}
                        className={cn(
                            "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200",
                            "bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-700 hover:shadow-primary-500/40 hover:-translate-y-0.5",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                        )}
                    >
                        Analyze Snippet
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
