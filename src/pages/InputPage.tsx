import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, ChevronDown, ChevronRight, Terminal, Copy, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CompressionService } from '../services/CompressionService';
import { DevelopmentWarning } from '../components/DevelopmentWarning';

interface HelpSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function HelpSection({ title, icon, children, defaultOpen = false }: HelpSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-primary-600">{icon}</span>
                <span className="font-medium text-slate-700">{title}</span>
            </button>
            {isOpen && (
                <div className="px-4 py-4 bg-white border-t border-slate-100 text-sm text-slate-600 space-y-3">
                    {children}
                </div>
            )}
        </div>
    );
}

function CodeBlock({ children, copyable = true }: { children: string; copyable?: boolean }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group">
            <pre className="bg-slate-800 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                {children}
            </pre>
            {copyable && (
                <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <span className="text-xs text-green-400">Copied!</span>
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                </button>
            )}
        </div>
    );
}

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
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DevelopmentWarning />

            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                    <span className="text-primary-600">B</span>etter <span className="text-primary-600">O</span>ut <span className="text-primary-600">o</span>f <span className="text-primary-600">M</span>emory Viewer
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Paste your Linux OOM kill logs below to get instant, structured analysis.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-100 px-4 py-3 flex items-center gap-2 text-slate-500 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>OOM Kill Log</span>
                </div>
                <div className="p-2">
                    <textarea
                        value={snippet}
                        onChange={(e) => setSnippet(e.target.value)}
                        placeholder="Paste your OOM kill log here..."
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
                        Analyze Log
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Help sections */}
            <div className="space-y-3">
                <h2 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    How to extract OOM kill logs
                </h2>

                <HelpSection
                    title="Using dmesg (recommended)"
                    icon={<Terminal className="w-4 h-4" />}
                    defaultOpen
                >
                    <p>
                        The <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">dmesg</code> command
                        displays kernel ring buffer messages, including OOM kill events.
                    </p>
                    <p className="font-medium text-slate-700">View recent OOM kills:</p>
                    <CodeBlock>sudo dmesg -T | grep -i "oom\|killed process" | tail -50</CodeBlock>
                    <p className="font-medium text-slate-700">Extract full OOM kill context (last event):</p>
                    <CodeBlock>{`sudo dmesg -T | grep -A 200 "invoked oom-killer" | tail -250`}</CodeBlock>
                    <p className="text-slate-500 text-xs">
                        The <code className="px-1 py-0.5 bg-slate-100 rounded">-T</code> flag shows human-readable timestamps.
                    </p>
                </HelpSection>

                <HelpSection
                    title="What to copy"
                    icon={<Copy className="w-4 h-4" />}
                >
                    <p>Copy the <strong>entire OOM kill block</strong>, which typically includes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>The line with <code className="px-1 py-0.5 bg-slate-100 rounded text-xs font-mono">invoked oom-killer</code></li>
                        <li>Call stack / backtrace</li>
                        <li>Memory info (<code className="px-1 py-0.5 bg-slate-100 rounded text-xs font-mono">Mem-Info:</code>)</li>
                        <li>Process list (table with pid, uid, rss, etc.)</li>
                        <li>The final <code className="px-1 py-0.5 bg-slate-100 rounded text-xs font-mono">Killed process</code> line</li>
                    </ul>
                    <p className="text-slate-500 mt-2">
                        The parser will extract what it can, but having the complete block gives the best analysis.
                    </p>
                </HelpSection>

                <HelpSection
                    title="From journalctl (systemd systems)"
                    icon={<Terminal className="w-4 h-4" />}
                >
                    <p>On systemd-based systems, you can also use journalctl:</p>
                    <CodeBlock>sudo journalctl -k | grep -A 200 "invoked oom-killer" | tail -250</CodeBlock>
                    <p className="font-medium text-slate-700 mt-2">Or search by time range:</p>
                    <CodeBlock>sudo journalctl -k --since "1 hour ago" | grep -i oom</CodeBlock>
                </HelpSection>

                <HelpSection
                    title="From log files"
                    icon={<FileText className="w-4 h-4" />}
                >
                    <p>OOM events are also logged to system log files:</p>
                    <CodeBlock>{`# On RHEL/CentOS/Rocky
sudo grep -A 200 "invoked oom-killer" /var/log/messages | tail -250

# On Debian/Ubuntu
sudo grep -A 200 "invoked oom-killer" /var/log/kern.log | tail -250`}</CodeBlock>
                </HelpSection>
            </div>
        </div>
    );
}
