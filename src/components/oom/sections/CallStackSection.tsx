import { Terminal } from 'lucide-react';
import type { CallStack } from '../../../types/OOMTypes';
import { SectionCard } from '../shared/SectionCard';
import { CollapsibleSection } from '../shared/CollapsibleSection';

interface CallStackSectionProps {
  data: CallStack;
}

export function CallStackSection({ data }: CallStackSectionProps) {
  if (data.frames.length === 0 && !data.registers) {
    return null;
  }

  return (
    <SectionCard title="Call Stack" icon={<Terminal className="w-4 h-4" />}>
      <div className="space-y-4">
        {data.frames.length > 0 && (
          <CollapsibleSection title={`Stack Trace (${data.frames.length} frames)`}>
            <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm font-mono text-slate-300 leading-relaxed">
                {data.frames.map((frame, index) => (
                  <div key={index} className="hover:bg-slate-900 px-2 -mx-2">
                    <span className="text-slate-500">{String(index).padStart(2, ' ')}:</span>{' '}
                    <span className="text-cyan-400">{frame.function}</span>
                    <span className="text-slate-500">+{frame.offset}/{frame.size}</span>
                  </div>
                ))}
              </pre>
            </div>
          </CollapsibleSection>
        )}

        {data.registers && (
          <CollapsibleSection title="CPU Registers">
            <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
                {Object.entries(data.registers).map(([reg, value]) => (
                  <div key={reg} className="flex gap-2">
                    <span className="text-amber-400 uppercase w-8">{reg}:</span>
                    <span className="text-slate-300">{value || '0'}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {data.codeNote && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            {data.codeNote}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
