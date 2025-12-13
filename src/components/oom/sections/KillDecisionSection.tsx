import { Skull, AlertTriangle, Folder } from 'lucide-react';
import type { OOMConstraint, KilledProcess } from '../../../types/OOMTypes';
import { SectionCard } from '../shared/SectionCard';
import { MetricDisplay, MetricGrid } from '../shared/MetricDisplay';
import { MemoryBar } from '../shared/MemoryBar';
import { formatBytes } from '../../../lib/format';

interface KillDecisionSectionProps {
  constraint: OOMConstraint;
  killed: KilledProcess;
}

export function KillDecisionSection({ constraint, killed }: KillDecisionSectionProps) {
  const totalRss = killed.anonRssKB + killed.fileRssKB + killed.shmemRssKB;

  return (
    <SectionCard
      title="OOM Kill Decision"
      icon={<Skull className="w-4 h-4" />}
      variant="danger"
    >
      <div className="space-y-6">
        {/* Killed process summary */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800">
                Killed: {killed.name} (PID {killed.pid})
              </h4>
              <p className="text-sm text-red-600 mt-1">
                UID {killed.uid} | OOM Score Adj: {killed.oomScoreAdj}
              </p>
            </div>
          </div>
        </div>

        {/* Memory breakdown of killed process */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            Killed Process Memory Usage
          </h4>
          <div className="space-y-3">
            <MemoryBar
              used={totalRss}
              total={killed.totalVmKB}
              label="RSS / Virtual Memory"
              variant="danger"
            />

            <MetricGrid columns={4}>
              <MetricDisplay label="Total Virtual" value={formatBytes(killed.totalVmKB)} />
              <MetricDisplay label="Anonymous RSS" value={formatBytes(killed.anonRssKB)} />
              <MetricDisplay label="File RSS" value={formatBytes(killed.fileRssKB)} />
              <MetricDisplay label="Shared Memory RSS" value={formatBytes(killed.shmemRssKB)} />
            </MetricGrid>

            <MetricGrid columns={2}>
              <MetricDisplay label="Page Tables" value={formatBytes(killed.pgtablesKB)} />
              <MetricDisplay
                label="OOM Score Adjustment"
                value={killed.oomScoreAdj}
                variant={killed.oomScoreAdj < 0 ? 'success' : killed.oomScoreAdj > 0 ? 'warning' : 'default'}
              />
            </MetricGrid>
          </div>
        </div>

        {/* Constraint details */}
        <div className="pt-4 border-t border-red-200">
          <h4 className="text-sm font-medium text-slate-700 mb-3">OOM Constraints</h4>
          <MetricGrid columns={3}>
            <MetricDisplay label="Constraint" value={constraint.constraint || 'NONE'} />
            <MetricDisplay
              label="Global OOM"
              value={constraint.globalOom ? 'Yes' : 'No'}
              variant={constraint.globalOom ? 'warning' : 'default'}
            />
            <MetricDisplay label="Mems Allowed" value={constraint.memsAllowed || 'All'} />
          </MetricGrid>

          {constraint.taskMemcg && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <Folder className="w-4 h-4" />
                <span className="font-medium">CGroup:</span>
                <code className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded">
                  {constraint.taskMemcg}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Memory breakdown visualization */}
        <div className="pt-4 border-t border-red-200">
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            RSS Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-600">Anonymous</div>
              <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${totalRss > 0 ? (killed.anonRssKB / totalRss) * 100 : 0}%` }}
                />
              </div>
              <div className="w-24 text-sm text-slate-500 text-right">{formatBytes(killed.anonRssKB)}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-600">File</div>
              <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${totalRss > 0 ? (killed.fileRssKB / totalRss) * 100 : 0}%` }}
                />
              </div>
              <div className="w-24 text-sm text-slate-500 text-right">{formatBytes(killed.fileRssKB)}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-600">Shared</div>
              <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalRss > 0 ? (killed.shmemRssKB / totalRss) * 100 : 0}%` }}
                />
              </div>
              <div className="w-24 text-sm text-slate-500 text-right">{formatBytes(killed.shmemRssKB)}</div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
