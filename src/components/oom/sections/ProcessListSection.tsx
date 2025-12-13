import { useState, useMemo } from 'react';
import { List, ArrowUpDown, Search, Shield, ShieldAlert } from 'lucide-react';
import type { ProcessInfo } from '../../../types/OOMTypes';
import { SectionCard } from '../shared/SectionCard';
import { cn } from '../../../lib/utils';
import { formatBytes } from '../shared/MemoryBar';

interface ProcessListSectionProps {
  processes: ProcessInfo[];
  killedPid: number;
}

type SortField = 'pid' | 'name' | 'rss' | 'totalVm' | 'oomScoreAdj';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_KB = 4;

export function ProcessListSection({ processes, killedPid }: ProcessListSectionProps) {
  const [sortField, setSortField] = useState<SortField>('rss');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedProcesses = useMemo(() => {
    let result = [...processes];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.pid.toString().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'pid':
          cmp = a.pid - b.pid;
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'rss':
          cmp = a.rss - b.rss;
          break;
        case 'totalVm':
          cmp = a.totalVm - b.totalVm;
          break;
        case 'oomScoreAdj':
          cmp = a.oomScoreAdj - b.oomScoreAdj;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [processes, sortField, sortDirection, searchTerm]);

  // Calculate totals
  const totalRss = processes.reduce((sum, p) => sum + p.rss, 0) * PAGE_SIZE_KB;
  const killedProcess = processes.find((p) => p.pid === killedPid);

  return (
    <SectionCard
      title={`Process List (${processes.length} processes)`}
      icon={<List className="w-4 h-4" />}
      headerRight={
        <span className="text-sm text-slate-500">
          Total RSS: {formatBytes(totalRss)}
        </span>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or PID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <SortableHeader
                  field="pid"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  PID
                </SortableHeader>
                <SortableHeader
                  field="name"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  Name
                </SortableHeader>
                <th className="px-3 py-2 text-left text-slate-600 font-medium">UID</th>
                <SortableHeader
                  field="rss"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  RSS
                </SortableHeader>
                <SortableHeader
                  field="totalVm"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  Virtual
                </SortableHeader>
                <th className="px-3 py-2 text-left text-slate-600 font-medium">Swap</th>
                <SortableHeader
                  field="oomScoreAdj"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  OOM Adj
                </SortableHeader>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProcesses.map((process) => {
                const isKilled = process.pid === killedPid;
                const isProtected = process.oomScoreAdj === -1000;

                return (
                  <tr
                    key={process.pid}
                    id={`process-${process.pid}`}
                    className={cn(
                      'border-b border-slate-100 hover:bg-slate-50 transition-colors scroll-mt-24',
                      isKilled && 'bg-red-50 hover:bg-red-100 border-red-200'
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-slate-700">
                      <div className="flex items-center gap-2">
                        {isKilled && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            KILLED
                          </span>
                        )}
                        {process.pid}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {isProtected && (
                          <span title="Protected from OOM killer">
                            <Shield className="w-4 h-4 text-green-500" />
                          </span>
                        )}
                        {process.oomScoreAdj > 500 && (
                          <span title="High OOM priority">
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                          </span>
                        )}
                        <span className={cn('font-medium', isKilled ? 'text-red-700' : 'text-slate-900')}>
                          {process.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{process.uid}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">
                      {formatBytes(process.rss * PAGE_SIZE_KB)}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-500">
                      {formatBytes(process.totalVm * PAGE_SIZE_KB)}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-500">
                      {process.swapents > 0 ? formatBytes(process.swapents * PAGE_SIZE_KB) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono',
                          process.oomScoreAdj === -1000 && 'bg-green-100 text-green-700',
                          process.oomScoreAdj < 0 && process.oomScoreAdj !== -1000 && 'bg-blue-100 text-blue-700',
                          process.oomScoreAdj === 0 && 'bg-slate-100 text-slate-600',
                          process.oomScoreAdj > 0 && 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {process.oomScoreAdj}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {killedProcess && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-medium">
                Process {killedProcess.name} (PID {killedProcess.pid}) was killed
              </span>
            </div>
            <p className="mt-1 text-sm text-red-600">
              Using {formatBytes(killedProcess.rss * PAGE_SIZE_KB)} RSS,{' '}
              {formatBytes(killedProcess.totalVm * PAGE_SIZE_KB)} virtual memory
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

interface SortableHeaderProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onClick: (field: SortField) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, currentField, onClick, children }: SortableHeaderProps) {
  const isActive = field === currentField;

  return (
    <th
      className="px-3 py-2 text-left text-slate-600 font-medium cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => onClick(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={cn(
            'w-3 h-3',
            isActive ? 'text-primary-600' : 'text-slate-400'
          )}
        />
      </div>
    </th>
  );
}
