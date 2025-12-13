import { HardDrive, Database } from 'lucide-react';
import type { MemoryInfo } from '../../../types/OOMTypes';
import { SectionCard } from '../shared/SectionCard';
import { MetricDisplay, MetricGrid } from '../shared/MetricDisplay';
import { MemoryBar, formatBytes } from '../shared/MemoryBar';
import { CollapsibleSection } from '../shared/CollapsibleSection';

interface MemorySectionProps {
  data: MemoryInfo;
}

const PAGE_SIZE_KB = 4; // Standard 4KB pages

export function MemorySection({ data }: MemorySectionProps) {
  const { memInfoPages, nodeMemory, zones, swapInfo, pageCacheInfo } = data;

  // Calculate totals from pages
  const totalRamKB = pageCacheInfo.pagesRam * PAGE_SIZE_KB;
  const freeKB = memInfoPages.free * PAGE_SIZE_KB;
  const usedKB = totalRamKB - freeKB;

  // Calculate memory breakdown
  const anonKB = (memInfoPages.activeAnon + memInfoPages.inactiveAnon) * PAGE_SIZE_KB;
  const fileKB = (memInfoPages.activeFile + memInfoPages.inactiveFile) * PAGE_SIZE_KB;
  const shmemKB = memInfoPages.shmem * PAGE_SIZE_KB;
  const slabKB = (memInfoPages.slabReclaimable + memInfoPages.slabUnreclaimable) * PAGE_SIZE_KB;

  return (
    <SectionCard title="Memory Statistics" icon={<HardDrive className="w-4 h-4" />}>
      <div className="space-y-6">
        {/* Main memory usage */}
        <div>
          <MemoryBar used={usedKB} total={totalRamKB} label="Total RAM Usage" />
        </div>

        {/* Memory breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <MemoryBar used={anonKB} total={totalRamKB} label="Anonymous" showValues={false} />
            <span className="text-xs text-slate-500">{formatBytes(anonKB)}</span>
          </div>
          <div className="space-y-1">
            <MemoryBar used={shmemKB} total={totalRamKB} label="Shared Memory" showValues={false} />
            <span className="text-xs text-slate-500">{formatBytes(shmemKB)}</span>
          </div>
          <div className="space-y-1">
            <MemoryBar used={fileKB} total={totalRamKB} label="File Cache" showValues={false} />
            <span className="text-xs text-slate-500">{formatBytes(fileKB)}</span>
          </div>
          <div className="space-y-1">
            <MemoryBar used={slabKB} total={totalRamKB} label="Slab" showValues={false} />
            <span className="text-xs text-slate-500">{formatBytes(slabKB)}</span>
          </div>
        </div>

        {/* Swap */}
        {swapInfo.totalSwap > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Swap</span>
            </div>
            <MemoryBar
              used={swapInfo.totalSwap - swapInfo.freeSwap}
              total={swapInfo.totalSwap}
              label="Swap Usage"
            />
          </div>
        )}

        {/* Detailed page statistics */}
        <CollapsibleSection title="Detailed Page Statistics">
          <MetricGrid columns={5}>
            <MetricDisplay label="Active Anon" value={memInfoPages.activeAnon.toLocaleString()} unit="pages" />
            <MetricDisplay label="Inactive Anon" value={memInfoPages.inactiveAnon.toLocaleString()} unit="pages" />
            <MetricDisplay label="Active File" value={memInfoPages.activeFile.toLocaleString()} unit="pages" />
            <MetricDisplay label="Inactive File" value={memInfoPages.inactiveFile.toLocaleString()} unit="pages" />
            <MetricDisplay label="Free" value={memInfoPages.free.toLocaleString()} unit="pages" />
            <MetricDisplay label="Mapped" value={memInfoPages.mapped.toLocaleString()} unit="pages" />
            <MetricDisplay label="Shmem" value={memInfoPages.shmem.toLocaleString()} unit="pages" />
            <MetricDisplay label="Slab Reclaimable" value={memInfoPages.slabReclaimable.toLocaleString()} unit="pages" />
            <MetricDisplay label="Slab Unreclaimable" value={memInfoPages.slabUnreclaimable.toLocaleString()} unit="pages" />
            <MetricDisplay label="Pagetables" value={memInfoPages.pagetables.toLocaleString()} unit="pages" />
          </MetricGrid>
        </CollapsibleSection>

        {/* Zone information */}
        {zones.length > 0 && (
          <CollapsibleSection title="Memory Zones">
            <div className="space-y-4">
              {zones.map((zone, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">
                      Node {zone.node} - {zone.zone}
                    </span>
                    <span className="text-sm text-slate-500">
                      {formatBytes(zone.managed)} managed
                    </span>
                  </div>
                  <MemoryBar
                    used={zone.managed - zone.free}
                    total={zone.managed}
                    showValues
                  />
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    <span>
                      Min: <span className="font-mono">{formatBytes(zone.min)}</span>
                    </span>
                    <span>
                      Low: <span className="font-mono">{formatBytes(zone.low)}</span>
                    </span>
                    <span>
                      High: <span className="font-mono">{formatBytes(zone.high)}</span>
                    </span>
                    <span className={zone.free < zone.min ? 'text-red-600 font-medium' : ''}>
                      Free: <span className="font-mono">{formatBytes(zone.free)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Node memory summary */}
        {nodeMemory.length > 0 && (
          <CollapsibleSection title="Node Memory Details">
            {nodeMemory.map((node, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-slate-700">Node {node.node}</h4>
                <MetricGrid columns={4}>
                  <MetricDisplay label="Active Anon" value={formatBytes(node.activeAnon)} />
                  <MetricDisplay label="Inactive Anon" value={formatBytes(node.inactiveAnon)} />
                  <MetricDisplay label="Shmem" value={formatBytes(node.shmem)} />
                  <MetricDisplay label="Mapped" value={formatBytes(node.mapped)} />
                  <MetricDisplay label="Anon THP" value={formatBytes(node.anonThp)} />
                  <MetricDisplay label="Kernel Stack" value={formatBytes(node.kernelStack)} />
                  <MetricDisplay label="Pagetables" value={formatBytes(node.pagetables)} />
                  <MetricDisplay
                    label="Unreclaimable"
                    value={node.allUnreclaimable ? 'Yes' : 'No'}
                    variant={node.allUnreclaimable ? 'danger' : 'success'}
                  />
                </MetricGrid>
              </div>
            ))}
          </CollapsibleSection>
        )}
      </div>
    </SectionCard>
  );
}
