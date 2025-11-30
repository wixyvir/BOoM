import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const snippet = location.state?.snippet || '';

    if (!snippet) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-slate-800">No snippet found</h2>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-primary-600 hover:underline"
                >
                    Go back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Input
            </button>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    Analysis Result
                </h2>
                <div className="text-sm text-slate-500">
                    {snippet.length} characters
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <span className="text-slate-400 text-xs font-mono">RAW CONTENT</span>
                </div>
                <div className="p-0 overflow-x-auto">
                    <pre className="p-4 text-sm font-mono text-slate-300 bg-slate-950 leading-relaxed">
                        {snippet}
                    </pre>
                </div>
            </div>
        </div>
    );
}
