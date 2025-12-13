import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, BarChart3 } from 'lucide-react';
import { CompressionService } from '../services/CompressionService';
import { OOMParserService } from '../services/OOMParserService';
import { OOMAnalysis } from '../components/oom/OOMAnalysis';
import type { ParsedOOMLog } from '../types/OOMTypes';
import { cn } from '../lib/utils';

type TabType = 'analysis' | 'raw';

export function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [snippet, setSnippet] = useState('');
    const [error, setError] = useState('');
    const [parsedOOM, setParsedOOM] = useState<ParsedOOMLog | null>(null);
    const [isOOMLog, setIsOOMLog] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('analysis');

    useEffect(() => {
        const hash = location.hash.slice(1); // Remove #
        if (!hash) {
            setSnippet('');
            return;
        }

        const loadSnippet = async () => {
            try {
                const decompressed = await CompressionService.decompress(hash);
                setSnippet(decompressed);
                setError('');

                // Check if this is an OOM log and parse it
                if (OOMParserService.isOOMLog(decompressed)) {
                    setIsOOMLog(true);
                    const result = OOMParserService.parse(decompressed);
                    if (result.data) {
                        setParsedOOM(result.data);
                    }
                } else {
                    setIsOOMLog(false);
                    setParsedOOM(null);
                    setActiveTab('raw');
                }
            } catch (err) {
                console.error('Failed to decompress snippet:', err);
                setError('Failed to load snippet. The URL might be invalid.');
            }
        };

        loadSnippet();
    }, [location.hash]);

    if (!snippet) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-slate-800">
                    {error || 'No snippet found'}
                </h2>
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
                    {isOOMLog ? 'OOM Analysis' : 'Analysis Result'}
                </h2>
                <div className="text-sm text-slate-500">
                    {snippet.length} characters
                </div>
            </div>

            {/* Tab Navigation */}
            {isOOMLog && (
                <div className="flex gap-1 border-b border-slate-200">
                    <TabButton
                        active={activeTab === 'analysis'}
                        onClick={() => setActiveTab('analysis')}
                        icon={<BarChart3 className="w-4 h-4" />}
                    >
                        Analysis
                    </TabButton>
                    <TabButton
                        active={activeTab === 'raw'}
                        onClick={() => setActiveTab('raw')}
                        icon={<FileText className="w-4 h-4" />}
                    >
                        Raw Content
                    </TabButton>
                </div>
            )}

            {/* Content */}
            {activeTab === 'analysis' && isOOMLog && parsedOOM ? (
                <OOMAnalysis parsedData={parsedOOM} />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                        <span className="text-slate-400 text-xs font-mono">RAW CONTENT</span>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <pre className="p-4 text-sm font-mono text-slate-300 bg-slate-950 leading-relaxed whitespace-pre-wrap">
                            {snippet}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                active
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
        >
            {icon}
            {children}
        </button>
    );
}
