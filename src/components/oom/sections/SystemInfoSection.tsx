import { Server, Cpu } from 'lucide-react';
import type { SystemInfo } from '../../../types/OOMTypes';
import { SectionCard } from '../shared/SectionCard';
import { MetricDisplay, MetricGrid } from '../shared/MetricDisplay';

interface SystemInfoSectionProps {
  data: SystemInfo;
}

export function SystemInfoSection({ data }: SystemInfoSectionProps) {
  return (
    <SectionCard title="System Information" icon={<Server className="w-4 h-4" />}>
      <div className="space-y-4">
        <MetricGrid columns={4}>
          <MetricDisplay label="CPU Core" value={data.cpu} />
          <MetricDisplay label="Trigger PID" value={data.pid} />
          <MetricDisplay label="Command" value={data.comm || 'Unknown'} />
          <MetricDisplay label="Kdump" value={data.kdump || 'Unknown'} />
        </MetricGrid>

        <div className="pt-2 border-t border-slate-100">
          <MetricGrid columns={2}>
            <MetricDisplay label="Kernel Version" value={data.kernelVersion || 'Unknown'} />
            <MetricDisplay
              label="Tainted"
              value={data.tainted ? 'Yes' : 'No'}
              variant={data.tainted ? 'warning' : 'success'}
            />
          </MetricGrid>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Hardware</span>
          </div>
          <MetricGrid columns={2}>
            <MetricDisplay label="Vendor" value={data.hardwareVendor || 'Unknown'} />
            <MetricDisplay label="Model" value={data.hardwareModel || 'Unknown'} />
            <MetricDisplay label="Platform" value={data.hardwarePlatform || 'Unknown'} />
            <MetricDisplay label="BIOS" value={data.bios || 'Unknown'} size="sm" />
          </MetricGrid>
        </div>
      </div>
    </SectionCard>
  );
}
