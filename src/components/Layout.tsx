import React from 'react';
import { Link } from 'react-router-dom';
import { Skull } from 'lucide-react';

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
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    <p>
                        <span className="text-primary-600 font-medium">B</span>OoM Viewer — A personal tool to help analyze Linux OOM kills at work.
                    </p>
                </div>
            </footer>
        </div>
    );
}
