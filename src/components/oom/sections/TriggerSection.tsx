import { Clock, Zap } from 'lucide-react';
import type { OOMTrigger } from '../../../types/OOMTypes';
import { SectionCard } from '../shared/SectionCard';
import { MetricDisplay, MetricGrid } from '../shared/MetricDisplay';

interface TriggerSectionProps {
  data: OOMTrigger;
}

export function TriggerSection({ data }: TriggerSectionProps) {
  return (
    <SectionCard title="OOM Event Trigger" icon={<Zap className="w-4 h-4" />}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">{data.timestamp || 'Unknown'}</span>
        </div>

        <MetricGrid columns={4}>
          <MetricDisplay label="Trigger Process" value={data.triggerProcess || 'Unknown'} />
          <MetricDisplay label="GFP Mask" value={data.gfpMask || 'N/A'} />
          <MetricDisplay label="Order" value={data.order} />
          <MetricDisplay
            label="OOM Score Adj"
            value={data.oomScoreAdj}
            variant={data.oomScoreAdj < 0 ? 'success' : data.oomScoreAdj > 0 ? 'warning' : 'default'}
          />
        </MetricGrid>

        {data.gfpFlags.length > 0 && (
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">GFP Flags</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {data.gfpFlags.map((flag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
