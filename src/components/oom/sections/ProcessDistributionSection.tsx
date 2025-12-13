import { useMemo, useState, useCallback } from 'react';
import { BarChart3, ChevronDown, ChevronRight, ArrowUpDown, Info, ExternalLink } from 'lucide-react';
import type { ProcessInfo, MemoryInfo } from '../../../types/OOMTypes';
import { SectionCard } from '../shared/SectionCard';
import { formatBytes } from '../shared/MemoryBar';
import { cn } from '../../../lib/utils';

interface ProcessDistributionSectionProps {
  processes: ProcessInfo[];
  killedPid: number;
  memoryInfo?: MemoryInfo;
}

interface AggregatedProcess {
  name: string;
  count: number;
  totalRssKB: number;
  totalVmKB: number;
  // Deduplicated memory: for groups, we estimate unique memory by taking max RSS
  // instead of sum, since most of the memory in process groups is shared
  deduplicatedRssKB: number;
  percentOfTotal: number;
  percentOfTotalDeduplicated: number;
  containsKilled: boolean;
  processes: ProcessInfo[];
}

type SortField = 'rss' | 'count' | 'name';

const PAGE_SIZE_KB = 4;
const DEFAULT_VISIBLE_COUNT = 10;

export function ProcessDistributionSection({ processes, killedPid, memoryInfo }: ProcessDistributionSectionProps) {
  const [sortField, setSortField] = useState<SortField>('rss');
  const [showAll, setShowAll] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [deduplicateSharedMemory, setDeduplicateSharedMemory] = useState(false);

  // Get system shared memory for context
  const systemShmemKB = memoryInfo?.nodeMemory?.[0]?.shmem ?? 0;

  // Aggregate processes by name
  const aggregatedProcesses = useMemo(() => {
    const groups = new Map<string, ProcessInfo[]>();

    // Group processes by name
    processes.forEach(p => {
      const existing = groups.get(p.name) || [];
      groups.set(p.name, [...existing, p]);
    });

    // Calculate total RSS for percentage calculation
    const totalRss = processes.reduce((sum, p) => sum + p.rss, 0);

    // Build aggregated array
    const aggregated: AggregatedProcess[] = Array.from(groups.entries()).map(([name, procs]) => {
      const groupRss = procs.reduce((sum, p) => sum + p.rss, 0);
      const groupVm = procs.reduce((sum, p) => sum + p.totalVm, 0);

      // For deduplicated mode: use max RSS of the group instead of sum
      // This estimates that processes in the same group share most of their memory
      const maxRss = Math.max(...procs.map(p => p.rss));
      const deduplicatedRss = maxRss;

      return {
        name,
        count: procs.length,
        totalRssKB: groupRss * PAGE_SIZE_KB,
        totalVmKB: groupVm * PAGE_SIZE_KB,
        deduplicatedRssKB: deduplicatedRss * PAGE_SIZE_KB,
        percentOfTotal: totalRss > 0 ? (groupRss / totalRss) * 100 : 0,
        percentOfTotalDeduplicated: 0, // Will be calculated after
        containsKilled: procs.some(p => p.pid === killedPid),
        processes: procs.sort((a, b) => b.rss - a.rss), // Sort individual processes by RSS
      };
    });

    // Calculate deduplicated total and percentages
    const totalDeduplicatedRss = aggregated.reduce((sum, g) => sum + g.deduplicatedRssKB, 0);
    aggregated.forEach(g => {
      g.percentOfTotalDeduplicated = totalDeduplicatedRss > 0
        ? (g.deduplicatedRssKB / totalDeduplicatedRss) * 100
        : 0;
    });

    // Sort based on selected field
    return aggregated.sort((a, b) => {
      switch (sortField) {
        case 'rss':
          return deduplicateSharedMemory
            ? b.deduplicatedRssKB - a.deduplicatedRssKB
            : b.totalRssKB - a.totalRssKB;
        case 'count':
          return b.count - a.count;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [processes, killedPid, sortField, deduplicateSharedMemory]);

  // Calculate summary stats
  const totalRssKB = useMemo(() => {
    return processes.reduce((sum, p) => sum + p.rss, 0) * PAGE_SIZE_KB;
  }, [processes]);

  const totalDeduplicatedRssKB = useMemo(() => {
    return aggregatedProcesses.reduce((sum, g) => sum + g.deduplicatedRssKB, 0);
  }, [aggregatedProcesses]);

  const visibleGroups = showAll
    ? aggregatedProcesses
    : aggregatedProcesses.slice(0, DEFAULT_VISIBLE_COUNT);

  const hasMore = aggregatedProcesses.length > DEFAULT_VISIBLE_COUNT;

  const handleSort = (field: SortField) => {
    setSortField(field);
  };

  const toggleExpand = (name: string) => {
    setExpandedGroup(expandedGroup === name ? null : name);
  };

  const scrollToProcess = useCallback((pid: number) => {
    const element = document.getElementById(`process-${pid}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a visible highlight effect with animation
      element.classList.add('!bg-yellow-200', 'ring-2', 'ring-yellow-400', 'ring-inset');
      setTimeout(() => {
        element.classList.remove('!bg-yellow-200', 'ring-2', 'ring-yellow-400', 'ring-inset');
      }, 4000);
    }
  }, []);

  // Check if shared memory might be causing over-counting
  const hasSignificantSharedMemory = systemShmemKB > 0 && totalRssKB > systemShmemKB;
  const overcountRatio = systemShmemKB > 0 ? totalRssKB / systemShmemKB : 1;

  return (
    <SectionCard
      title="Memory Distribution by Process"
      icon={<BarChart3 className="w-4 h-4" />}
      headerRight={
        <span className="text-sm text-slate-500">
          {aggregatedProcesses.length} groups |{' '}
          {deduplicateSharedMemory
            ? formatBytes(totalDeduplicatedRssKB)
            : formatBytes(totalRssKB)}{' '}
          {deduplicateSharedMemory ? 'estimated unique' : 'total RSS'}
          {systemShmemKB > 0 && (
            <span className="ml-2 text-slate-400">
              | shmem: {formatBytes(systemShmemKB)}
            </span>
          )}
        </span>
      }
    >
      <div className="space-y-4">
        {/* Warning about shared memory double-counting */}
        {hasSignificantSharedMemory && !deduplicateSharedMemory && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800">
              <span className="font-medium">Note:</span> RSS totals may exceed physical RAM because shared memory
              (e.g., PostgreSQL shared_buffers) is counted in each process that maps it.
              <br />
              <span className="text-amber-700">
                System shared memory: <strong>{formatBytes(systemShmemKB)}</strong>
                {' '}— Per-process shmem breakdown is not available in OOM logs (only the killed process shows anon-rss/file-rss/shmem-rss).
              </span>
              {overcountRatio > 2 && (
                <span className="block mt-1">
                  Enable "Deduplicate shared memory" below for a more realistic estimate.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Sort controls */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort by:</span>
            <SortButton
              label="Memory"
              active={sortField === 'rss'}
              onClick={() => handleSort('rss')}
            />
            <SortButton
              label="Count"
              active={sortField === 'count'}
              onClick={() => handleSort('count')}
            />
            <SortButton
              label="Name"
              active={sortField === 'name'}
              onClick={() => handleSort('name')}
            />
          </div>

          {/* Deduplicate toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={deduplicateSharedMemory}
              onChange={(e) => setDeduplicateSharedMemory(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-slate-600">Deduplicate shared memory</span>
            <span
              className="text-slate-400 cursor-help"
              title="When enabled, process groups show only the largest process's memory instead of summing all processes. This provides a more realistic estimate when processes share memory (e.g., PostgreSQL, Apache workers)."
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </label>
        </div>

        {/* Bar chart */}
        <div className="space-y-1">
          {visibleGroups.map((group) => (
            <div key={group.name}>
              {/* Main bar row */}
              <div
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer',
                  group.containsKilled
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'hover:bg-slate-50'
                )}
                onClick={() => group.count > 1 && toggleExpand(group.name)}
              >
                {/* Expand icon (only if multiple processes) */}
                <div className="w-4 flex-shrink-0">
                  {group.count > 1 && (
                    expandedGroup === group.name
                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {/* Process name */}
                <div className="w-32 flex-shrink-0 truncate font-medium text-sm" title={group.name}>
                  {group.name}
                </div>

                {/* Count badge */}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium flex-shrink-0',
                    group.containsKilled
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {group.count}x
                </span>

                {/* Bar */}
                <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded transition-all duration-300',
                      group.containsKilled ? 'bg-red-500' : 'bg-primary-500'
                    )}
                    style={{
                      width: `${Math.max(
                        deduplicateSharedMemory
                          ? group.percentOfTotalDeduplicated
                          : group.percentOfTotal,
                        0.5
                      )}%`,
                    }}
                  />
                </div>

                {/* Percentage */}
                <div className="w-14 text-right text-xs text-slate-500 flex-shrink-0">
                  {deduplicateSharedMemory
                    ? group.percentOfTotalDeduplicated.toFixed(1)
                    : group.percentOfTotal.toFixed(1)}%
                </div>

                {/* Memory value */}
                <div
                  className={cn(
                    'w-20 text-right font-mono text-sm flex-shrink-0',
                    group.containsKilled ? 'text-red-700' : 'text-slate-700'
                  )}
                >
                  {formatBytes(
                    deduplicateSharedMemory ? group.deduplicatedRssKB : group.totalRssKB
                  )}
                </div>
              </div>

              {/* Expanded individual processes */}
              {expandedGroup === group.name && group.count > 1 && (
                <div className="ml-8 mt-1 mb-2 pl-4 border-l-2 border-slate-200 space-y-1">
                  {group.processes.map((proc) => (
                    <div
                      key={proc.pid}
                      className={cn(
                        'flex items-center gap-3 py-1 px-2 rounded text-sm cursor-pointer hover:bg-slate-100 transition-colors',
                        proc.pid === killedPid && 'bg-red-50 hover:bg-red-100'
                      )}
                      onClick={() => scrollToProcess(proc.pid)}
                      title="Click to jump to process in table"
                    >
                      <span className="text-primary-600 font-mono text-xs w-20 flex items-center gap-1 hover:underline">
                        PID {proc.pid}
                        <ExternalLink className="w-3 h-3" />
                      </span>
                      <div className="flex-1 h-3 bg-slate-100 rounded overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded',
                            proc.pid === killedPid ? 'bg-red-400' : 'bg-primary-300'
                          )}
                          style={{
                            width: `${(proc.rss / (group.processes[0]?.rss || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-600 w-16 text-right">
                        {formatBytes(proc.rss * PAGE_SIZE_KB)}
                      </span>
                      {proc.pid === killedPid && (
                        <span className="text-xs text-red-600 font-medium">KILLED</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show more/less button */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {showAll
              ? `Show less (top ${DEFAULT_VISIBLE_COUNT})`
              : `Show all ${aggregatedProcesses.length} groups`}
          </button>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary-500" />
            <span>Normal process</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Contains killed process</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

interface SortButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function SortButton({ label, active, onClick }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded transition-colors',
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-slate-600 hover:bg-slate-100'
      )}
    >
      <ArrowUpDown className="w-3 h-3" />
      {label}
    </button>
  );
}
