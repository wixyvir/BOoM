import { AlertTriangle } from 'lucide-react';

export function DevelopmentWarning() {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
                This project is currently under development and may not work with your OOM kill log.
                You can send your snippet to{' '}
                <a
                    href="mailto:boom@cyprien.eu"
                    className="font-medium underline hover:text-amber-900"
                >
                    boom@cyprien.eu
                </a>{' '}
                to help contributors improve it.
            </p>
        </div>
    );
}
