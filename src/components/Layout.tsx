import React from 'react';
import { Link } from 'react-router-dom';
import { Skull, Globe } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900 flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <Skull className="w-6 h-6 text-primary-600" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-slate-800">
                            <span className="text-primary-600">B</span>OoM Viewer
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                        <Link to="/" className="hover:text-primary-600 transition-colors">Analyzer</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>

            <footer className="border-t border-slate-200 bg-white py-8">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm space-y-3">
                    <p>
                        <span className="text-primary-600 font-medium">B</span>OoM Viewer — A personal tool to help analyze Linux OOM kills at work.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <a
                            href="https://github.com/wixyvir/BOoM"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-slate-700 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            GitHub
                        </a>
                        <span className="text-slate-300">|</span>
                        <a
                            href="https://cyprien.eu"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-slate-700 transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                            cyprien.eu
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
