import { AlertTriangle } from 'lucide-react';
import type { ParsedOOMLog } from '../../types/OOMTypes';
import { TriggerSection } from './sections/TriggerSection';
import { SystemInfoSection } from './sections/SystemInfoSection';
import { CallStackSection } from './sections/CallStackSection';
import { MemorySection } from './sections/MemorySection';
import { ProcessListSection } from './sections/ProcessListSection';
import { ProcessDistributionSection } from './sections/ProcessDistributionSection';
import { KillDecisionSection } from './sections/KillDecisionSection';

interface OOMAnalysisProps {
  parsedData: ParsedOOMLog;
}

export function OOMAnalysis({ parsedData }: OOMAnalysisProps) {
  const { parseErrors } = parsedData;

  return (
    <div className="space-y-6">
      {/* Parse errors banner */}
      {parseErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Parsing warnings</h4>
              <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                {parseErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Kill Decision - Most important, shown first */}
      <KillDecisionSection
        constraint={parsedData.oomConstraint}
        killed={parsedData.killedProcess}
      />

      {/* Process Memory Distribution - Visual overview */}
      <ProcessDistributionSection
        processes={parsedData.processes}
        killedPid={parsedData.killedProcess.pid}
        memoryInfo={parsedData.memoryInfo}
      />

      {/* Trigger Information */}
      <TriggerSection data={parsedData.trigger} />

      {/* System Information */}
      <SystemInfoSection data={parsedData.systemInfo} />

      {/* Memory Statistics */}
      <MemorySection data={parsedData.memoryInfo} />

      {/* Process List */}
      <ProcessListSection
        processes={parsedData.processes}
        killedPid={parsedData.killedProcess.pid}
      />

      {/* Call Stack - Usually less important, at the end */}
      <CallStackSection data={parsedData.callStack} />
    </div>
  );
}
