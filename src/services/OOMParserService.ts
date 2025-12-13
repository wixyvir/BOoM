import type {
  OOMTrigger,
  SystemInfo,
  CallStack,
  RegisterState,
  MemoryInfo,
  MemInfoPages,
  NodeMemoryKB,
  ZoneInfo,
  BuddyInfo,
  BuddyBlock,
  HugepagesInfo,
  SwapInfo,
  PageCacheInfo,
  ProcessInfo,
  OOMConstraint,
  KilledProcess,
  OOMParseResult,
} from '../types/OOMTypes';

export class OOMParserService {
  // ================
  // PUBLIC API
  // ================

  static parse(logContent: string): OOMParseResult {
    const errors: string[] = [];
    const lines = logContent.split('\n');

    try {
      const trigger = this.parseTrigger(lines, errors);
      const systemInfo = this.parseSystemInfo(lines, errors);
      const callStack = this.parseCallStack(lines, errors);
      const memoryInfo = this.parseMemoryInfo(lines, errors);
      const processes = this.parseProcessList(lines, errors);
      const oomConstraint = this.parseOOMConstraint(lines, errors);
      const killedProcess = this.parseKilledProcess(lines, errors);

      return {
        success: errors.length === 0,
        data: {
          trigger,
          systemInfo,
          callStack,
          memoryInfo,
          processes,
          oomConstraint,
          killedProcess,
          rawLog: logContent,
          parseErrors: errors,
        },
        errors,
      };
    } catch (e) {
      return {
        success: false,
        data: null,
        errors: [`Fatal parsing error: ${e instanceof Error ? e.message : 'Unknown error'}`],
      };
    }
  }

  static isOOMLog(content: string): boolean {
    return (
      content.includes('invoked oom-killer') ||
      content.includes('Out of memory:') ||
      content.includes('oom-kill:')
    );
  }

  // ================
  // PRIVATE PARSERS
  // ================

  private static parseTrigger(lines: string[], errors: string[]): OOMTrigger {
    const defaultTrigger: OOMTrigger = {
      timestamp: '',
      triggerProcess: '',
      gfpMask: '',
      gfpFlags: [],
      order: 0,
      oomScoreAdj: 0,
    };

    const triggerLine = this.findLineContaining(lines, 'invoked oom-killer');
    if (!triggerLine) {
      errors.push('Could not find OOM trigger line');
      return defaultTrigger;
    }

    // Extract timestamp
    const timestampMatch = triggerLine.match(/^\[(.*?)\]/);
    if (timestampMatch) {
      defaultTrigger.timestamp = timestampMatch[1].trim();
    }

    // Extract trigger process
    const processMatch = triggerLine.match(/^\[.*?\]\s+(\w+)\s+invoked\s+oom-killer/);
    if (processMatch) {
      defaultTrigger.triggerProcess = processMatch[1];
    }

    // Extract gfp_mask and flags
    const gfpMatch = triggerLine.match(/gfp_mask=([^(]+)\(([^)]+)\)/);
    if (gfpMatch) {
      defaultTrigger.gfpMask = gfpMatch[1].trim();
      defaultTrigger.gfpFlags = gfpMatch[2].split('|').map((f) => f.trim());
    }

    // Extract order
    const orderMatch = triggerLine.match(/order=(\d+)/);
    if (orderMatch) {
      defaultTrigger.order = parseInt(orderMatch[1], 10);
    }

    // Extract oom_score_adj
    const scoreMatch = triggerLine.match(/oom_score_adj=(-?\d+)/);
    if (scoreMatch) {
      defaultTrigger.oomScoreAdj = parseInt(scoreMatch[1], 10);
    }

    return defaultTrigger;
  }

  private static parseSystemInfo(lines: string[], _errors?: string[]): SystemInfo {
    const defaultInfo: SystemInfo = {
      cpu: 0,
      pid: 0,
      comm: '',
      kdump: '',
      tainted: false,
      kernelVersion: '',
      hardwareVendor: '',
      hardwareModel: '',
      hardwarePlatform: '',
      bios: '',
    };

    // Find CPU/PID line
    const cpuLine = this.findLineContaining(lines, 'CPU:');
    if (cpuLine) {
      const cpuMatch = cpuLine.match(/CPU:\s*(\d+)/);
      if (cpuMatch) defaultInfo.cpu = parseInt(cpuMatch[1], 10);

      const pidMatch = cpuLine.match(/PID:\s*(\d+)/);
      if (pidMatch) defaultInfo.pid = parseInt(pidMatch[1], 10);

      const commMatch = cpuLine.match(/Comm:\s*(\S+)/);
      if (commMatch) defaultInfo.comm = commMatch[1];

      const kdumpMatch = cpuLine.match(/Kdump:\s*(\S+)/);
      if (kdumpMatch) defaultInfo.kdump = kdumpMatch[1];

      defaultInfo.tainted = !cpuLine.includes('Not tainted');

      const kernelMatch = cpuLine.match(/(?:tainted|Not tainted)\s+(\S+)/);
      if (kernelMatch) defaultInfo.kernelVersion = kernelMatch[1];
    }

    // Find Hardware line
    const hwLine = this.findLineContaining(lines, 'Hardware name:');
    if (hwLine) {
      const hwMatch = hwLine.match(/Hardware name:\s*([^,]+),\s*([^/]+)\/([^,]+),\s*BIOS\s*(.+)$/);
      if (hwMatch) {
        defaultInfo.hardwareVendor = hwMatch[1].trim();
        defaultInfo.hardwareModel = hwMatch[2].trim();
        defaultInfo.hardwarePlatform = hwMatch[3].trim();
        defaultInfo.bios = hwMatch[4].trim();
      }
    }

    return defaultInfo;
  }

  private static parseCallStack(lines: string[], _errors?: string[]): CallStack {
    const callStack: CallStack = {
      frames: [],
      registers: null,
      codeNote: null,
    };

    let inCallTrace = false;
    const registers: Partial<RegisterState> = {};

    for (const line of lines) {
      if (line.includes('Call Trace:')) {
        inCallTrace = true;
        continue;
      }

      if (line.includes('</TASK>')) {
        inCallTrace = false;
        continue;
      }

      if (inCallTrace) {
        // Parse stack frame: function+0xXX/0xYY
        const frameMatch = line.match(/(\w+)\+0x([0-9a-f]+)\/0x([0-9a-f]+)/i);
        if (frameMatch) {
          callStack.frames.push({
            function: frameMatch[1],
            offset: `0x${frameMatch[2]}`,
            size: `0x${frameMatch[3]}`,
          });
        }
      }

      // Parse registers
      if (line.includes('RIP:')) {
        const match = line.match(/RIP:\s*([0-9a-f:]+)/i);
        if (match) registers.rip = match[1];
      }
      if (line.includes('RSP:')) {
        const match = line.match(/RSP:\s*([0-9a-f:]+)/i);
        if (match) registers.rsp = match[1];
      }
      if (line.includes('EFLAGS:')) {
        const match = line.match(/EFLAGS:\s*([0-9a-f]+)/i);
        if (match) registers.eflags = match[1];
      }
      if (line.includes('RAX:')) {
        const raxMatch = line.match(/RAX:\s*([0-9a-f]+)/i);
        const rbxMatch = line.match(/RBX:\s*([0-9a-f]+)/i);
        const rcxMatch = line.match(/RCX:\s*([0-9a-f]+)/i);
        if (raxMatch) registers.rax = raxMatch[1];
        if (rbxMatch) registers.rbx = rbxMatch[1];
        if (rcxMatch) registers.rcx = rcxMatch[1];
      }
      if (line.includes('RDX:')) {
        const rdxMatch = line.match(/RDX:\s*([0-9a-f]+)/i);
        const rsiMatch = line.match(/RSI:\s*([0-9a-f]+)/i);
        const rdiMatch = line.match(/RDI:\s*([0-9a-f]+)/i);
        if (rdxMatch) registers.rdx = rdxMatch[1];
        if (rsiMatch) registers.rsi = rsiMatch[1];
        if (rdiMatch) registers.rdi = rdiMatch[1];
      }
      if (line.includes('RBP:')) {
        const rbpMatch = line.match(/RBP:\s*([0-9a-f]+)/i);
        const r08Match = line.match(/R08:\s*([0-9a-f]+)/i);
        const r09Match = line.match(/R09:\s*([0-9a-f]+)/i);
        if (rbpMatch) registers.rbp = rbpMatch[1];
        if (r08Match) registers.r08 = r08Match[1];
        if (r09Match) registers.r09 = r09Match[1];
      }
      if (line.includes('R10:')) {
        const r10Match = line.match(/R10:\s*([0-9a-f]+)/i);
        const r11Match = line.match(/R11:\s*([0-9a-f]+)/i);
        const r12Match = line.match(/R12:\s*([0-9a-f]+)/i);
        if (r10Match) registers.r10 = r10Match[1];
        if (r11Match) registers.r11 = r11Match[1];
        if (r12Match) registers.r12 = r12Match[1];
      }
      if (line.includes('R13:')) {
        const r13Match = line.match(/R13:\s*([0-9a-f]+)/i);
        const r14Match = line.match(/R14:\s*([0-9a-f]+)/i);
        const r15Match = line.match(/R15:\s*([0-9a-f]+)/i);
        if (r13Match) registers.r13 = r13Match[1];
        if (r14Match) registers.r14 = r14Match[1];
        if (r15Match) registers.r15 = r15Match[1];
      }

      // Parse code note
      if (line.includes('Code:') && line.includes('Unable to access')) {
        const noteMatch = line.match(/Code:\s*(.+)/);
        if (noteMatch) callStack.codeNote = noteMatch[1];
      }
    }

    if (Object.keys(registers).length > 0) {
      callStack.registers = registers as RegisterState;
    }

    return callStack;
  }

  private static parseMemoryInfo(lines: string[], _errors?: string[]): MemoryInfo {
    const memoryInfo: MemoryInfo = {
      memInfoPages: this.parseMemInfoPages(lines),
      nodeMemory: this.parseNodeMemory(lines),
      zones: this.parseZones(lines),
      buddyInfo: this.parseBuddyInfo(lines),
      hugepages: this.parseHugepages(lines),
      swapInfo: this.parseSwapInfo(lines),
      pageCacheInfo: this.parsePageCacheInfo(lines),
      lowmemReserve: this.parseLowmemReserve(lines),
    };

    return memoryInfo;
  }

  private static parseMemInfoPages(lines: string[]): MemInfoPages {
    const pages: MemInfoPages = {
      activeAnon: 0,
      inactiveAnon: 0,
      isolatedAnon: 0,
      activeFile: 0,
      inactiveFile: 0,
      isolatedFile: 0,
      unevictable: 0,
      dirty: 0,
      writeback: 0,
      slabReclaimable: 0,
      slabUnreclaimable: 0,
      mapped: 0,
      shmem: 0,
      pagetables: 0,
      secPagetables: 0,
      bounce: 0,
      kernelMiscReclaimable: 0,
      free: 0,
      freePcp: 0,
      freeCma: 0,
    };

    // Find lines after Mem-Info:
    let inMemInfo = false;
    for (const line of lines) {
      if (line.includes('Mem-Info:')) {
        inMemInfo = true;
        continue;
      }
      if (inMemInfo && line.includes('Node ')) {
        break;
      }
      if (inMemInfo) {
        const content = line.replace(/^\[.*?\]\s*/, '');

        const activeAnonMatch = content.match(/active_anon:(\d+)/);
        if (activeAnonMatch) pages.activeAnon = parseInt(activeAnonMatch[1], 10);

        const inactiveAnonMatch = content.match(/inactive_anon:(\d+)/);
        if (inactiveAnonMatch) pages.inactiveAnon = parseInt(inactiveAnonMatch[1], 10);

        const isolatedAnonMatch = content.match(/isolated_anon:(\d+)/);
        if (isolatedAnonMatch) pages.isolatedAnon = parseInt(isolatedAnonMatch[1], 10);

        const activeFileMatch = content.match(/active_file:(\d+)/);
        if (activeFileMatch) pages.activeFile = parseInt(activeFileMatch[1], 10);

        const inactiveFileMatch = content.match(/inactive_file:(\d+)/);
        if (inactiveFileMatch) pages.inactiveFile = parseInt(inactiveFileMatch[1], 10);

        const isolatedFileMatch = content.match(/isolated_file:(\d+)/);
        if (isolatedFileMatch) pages.isolatedFile = parseInt(isolatedFileMatch[1], 10);

        const unevictableMatch = content.match(/unevictable:(\d+)/);
        if (unevictableMatch) pages.unevictable = parseInt(unevictableMatch[1], 10);

        const dirtyMatch = content.match(/dirty:(\d+)/);
        if (dirtyMatch) pages.dirty = parseInt(dirtyMatch[1], 10);

        const writebackMatch = content.match(/writeback:(\d+)/);
        if (writebackMatch) pages.writeback = parseInt(writebackMatch[1], 10);

        const slabReclaimableMatch = content.match(/slab_reclaimable:(\d+)/);
        if (slabReclaimableMatch) pages.slabReclaimable = parseInt(slabReclaimableMatch[1], 10);

        const slabUnreclaimableMatch = content.match(/slab_unreclaimable:(\d+)/);
        if (slabUnreclaimableMatch) pages.slabUnreclaimable = parseInt(slabUnreclaimableMatch[1], 10);

        const mappedMatch = content.match(/mapped:(\d+)/);
        if (mappedMatch) pages.mapped = parseInt(mappedMatch[1], 10);

        const shmemMatch = content.match(/shmem:(\d+)/);
        if (shmemMatch) pages.shmem = parseInt(shmemMatch[1], 10);

        const pagetablesMatch = content.match(/pagetables:(\d+)/);
        if (pagetablesMatch) pages.pagetables = parseInt(pagetablesMatch[1], 10);

        const secPagetablesMatch = content.match(/sec_pagetables:(\d+)/);
        if (secPagetablesMatch) pages.secPagetables = parseInt(secPagetablesMatch[1], 10);

        const bounceMatch = content.match(/bounce:(\d+)/);
        if (bounceMatch) pages.bounce = parseInt(bounceMatch[1], 10);

        const kernelMiscMatch = content.match(/kernel_misc_reclaimable:(\d+)/);
        if (kernelMiscMatch) pages.kernelMiscReclaimable = parseInt(kernelMiscMatch[1], 10);

        const freeMatch = content.match(/free:(\d+)/);
        if (freeMatch) pages.free = parseInt(freeMatch[1], 10);

        const freePcpMatch = content.match(/free_pcp:(\d+)/);
        if (freePcpMatch) pages.freePcp = parseInt(freePcpMatch[1], 10);

        const freeCmaMatch = content.match(/free_cma:(\d+)/);
        if (freeCmaMatch) pages.freeCma = parseInt(freeCmaMatch[1], 10);
      }
    }

    return pages;
  }

  private static parseNodeMemory(lines: string[]): NodeMemoryKB[] {
    const nodeMemory: NodeMemoryKB[] = [];

    for (const line of lines) {
      // Match: Node 0 active_anon:2701952kB inactive_anon:12418048kB ...
      if (line.includes('Node ') && line.includes('active_anon:') && line.includes('kB')) {
        const nodeMatch = line.match(/Node\s+(\d+)/);
        if (!nodeMatch) continue;

        const node: NodeMemoryKB = {
          node: parseInt(nodeMatch[1], 10),
          activeAnon: this.extractKB(line, 'active_anon'),
          inactiveAnon: this.extractKB(line, 'inactive_anon'),
          activeFile: this.extractKB(line, 'active_file'),
          inactiveFile: this.extractKB(line, 'inactive_file'),
          unevictable: this.extractKB(line, 'unevictable'),
          isolatedAnon: this.extractKB(line, 'isolated\\(anon\\)'),
          isolatedFile: this.extractKB(line, 'isolated\\(file\\)'),
          mapped: this.extractKB(line, 'mapped'),
          dirty: this.extractKB(line, 'dirty'),
          writeback: this.extractKB(line, 'writeback'),
          shmem: this.extractKB(line, 'shmem'),
          shmemThp: this.extractKB(line, 'shmem_thp'),
          shmemPmdmapped: this.extractKB(line, 'shmem_pmdmapped'),
          anonThp: this.extractKB(line, 'anon_thp'),
          writebackTmp: this.extractKB(line, 'writeback_tmp'),
          kernelStack: this.extractKB(line, 'kernel_stack'),
          pagetables: this.extractKB(line, 'pagetables'),
          secPagetables: this.extractKB(line, 'sec_pagetables'),
          allUnreclaimable: line.includes('all_unreclaimable? yes'),
        };

        nodeMemory.push(node);
      }
    }

    return nodeMemory;
  }

  private static parseZones(lines: string[]): ZoneInfo[] {
    const zones: ZoneInfo[] = [];

    for (const line of lines) {
      // Match: Node 0 DMA free:13312kB boost:0kB min:64kB ...
      const zoneMatch = line.match(/Node\s+(\d+)\s+(DMA32?|Normal)\s+free:(\d+)kB/);
      if (zoneMatch) {
        const zone: ZoneInfo = {
          node: parseInt(zoneMatch[1], 10),
          zone: zoneMatch[2] as 'DMA' | 'DMA32' | 'Normal',
          free: parseInt(zoneMatch[3], 10),
          boost: this.extractKB(line, 'boost'),
          min: this.extractKB(line, 'min'),
          low: this.extractKB(line, 'low'),
          high: this.extractKB(line, 'high'),
          reservedHighatomic: this.extractKB(line, 'reserved_highatomic'),
          activeAnon: this.extractKB(line, 'active_anon'),
          inactiveAnon: this.extractKB(line, 'inactive_anon'),
          activeFile: this.extractKB(line, 'active_file'),
          inactiveFile: this.extractKB(line, 'inactive_file'),
          unevictable: this.extractKB(line, 'unevictable'),
          writepending: this.extractKB(line, 'writepending'),
          present: this.extractKB(line, 'present'),
          managed: this.extractKB(line, 'managed'),
          mlocked: this.extractKB(line, 'mlocked'),
          bounce: this.extractKB(line, 'bounce'),
          freePcp: this.extractKB(line, 'free_pcp'),
          localPcp: this.extractKB(line, 'local_pcp'),
          freeCma: this.extractKB(line, 'free_cma'),
        };

        zones.push(zone);
      }
    }

    return zones;
  }

  private static parseBuddyInfo(lines: string[]): BuddyInfo[] {
    const buddyInfo: BuddyInfo[] = [];

    for (const line of lines) {
      // Match: Node 0 DMA: 0*4kB 0*8kB 0*16kB ... = 13312kB
      const buddyMatch = line.match(/Node\s+(\d+)\s+(DMA32?|Normal):\s+(.+?)\s*=\s*(\d+)kB/);
      if (buddyMatch) {
        const blocks: BuddyBlock[] = [];
        const blockStr = buddyMatch[3];
        const blockMatches = blockStr.matchAll(/(\d+)\*(\d+)kB\s*\(([^)]*)\)/g);

        for (const match of blockMatches) {
          blocks.push({
            count: parseInt(match[1], 10),
            size: parseInt(match[2], 10),
            flags: match[3],
          });
        }

        buddyInfo.push({
          node: parseInt(buddyMatch[1], 10),
          zone: buddyMatch[2],
          blocks,
          total: parseInt(buddyMatch[4], 10),
        });
      }
    }

    return buddyInfo;
  }

  private static parseHugepages(lines: string[]): HugepagesInfo[] {
    const hugepages: HugepagesInfo[] = [];

    for (const line of lines) {
      // Match: Node 0 hugepages_total=0 hugepages_free=0 hugepages_surp=0 hugepages_size=1048576kB
      const hpMatch = line.match(
        /Node\s+(\d+)\s+hugepages_total=(\d+)\s+hugepages_free=(\d+)\s+hugepages_surp=(\d+)\s+hugepages_size=(\d+)kB/
      );
      if (hpMatch) {
        hugepages.push({
          node: parseInt(hpMatch[1], 10),
          total: parseInt(hpMatch[2], 10),
          free: parseInt(hpMatch[3], 10),
          surp: parseInt(hpMatch[4], 10),
          size: parseInt(hpMatch[5], 10),
        });
      }
    }

    return hugepages;
  }

  private static parseSwapInfo(lines: string[]): SwapInfo {
    const swapInfo: SwapInfo = {
      freeSwap: 0,
      totalSwap: 0,
      pagesInSwapCache: 0,
    };

    for (const line of lines) {
      const freeSwapMatch = line.match(/Free swap\s*=\s*(\d+)kB/);
      if (freeSwapMatch) swapInfo.freeSwap = parseInt(freeSwapMatch[1], 10);

      const totalSwapMatch = line.match(/Total swap\s*=\s*(\d+)kB/);
      if (totalSwapMatch) swapInfo.totalSwap = parseInt(totalSwapMatch[1], 10);

      const swapCacheMatch = line.match(/(\d+)\s+pages in swap cache/);
      if (swapCacheMatch) swapInfo.pagesInSwapCache = parseInt(swapCacheMatch[1], 10);
    }

    return swapInfo;
  }

  private static parsePageCacheInfo(lines: string[]): PageCacheInfo {
    const info: PageCacheInfo = {
      totalPagecachePages: 0,
      pagesRam: 0,
      pagesHighMemMovableOnly: 0,
      pagesReserved: 0,
      pagesCmaReserved: 0,
      pagesHwpoisoned: 0,
    };

    for (const line of lines) {
      const pagecacheMatch = line.match(/(\d+)\s+total pagecache pages/);
      if (pagecacheMatch) info.totalPagecachePages = parseInt(pagecacheMatch[1], 10);

      const ramMatch = line.match(/(\d+)\s+pages RAM/);
      if (ramMatch) info.pagesRam = parseInt(ramMatch[1], 10);

      const highMemMatch = line.match(/(\d+)\s+pages HighMem/);
      if (highMemMatch) info.pagesHighMemMovableOnly = parseInt(highMemMatch[1], 10);

      const reservedMatch = line.match(/(\d+)\s+pages reserved/);
      if (reservedMatch) info.pagesReserved = parseInt(reservedMatch[1], 10);

      const cmaMatch = line.match(/(\d+)\s+pages cma reserved/);
      if (cmaMatch) info.pagesCmaReserved = parseInt(cmaMatch[1], 10);

      const hwpoisonedMatch = line.match(/(\d+)\s+pages hwpoisoned/);
      if (hwpoisonedMatch) info.pagesHwpoisoned = parseInt(hwpoisonedMatch[1], 10);
    }

    return info;
  }

  private static parseLowmemReserve(lines: string[]): number[][] {
    const reserves: number[][] = [];

    for (const line of lines) {
      const reserveMatch = line.match(/lowmem_reserve\[\]:\s*([\d\s]+)/);
      if (reserveMatch) {
        const values = reserveMatch[1].trim().split(/\s+/).map((v) => parseInt(v, 10));
        reserves.push(values);
      }
    }

    return reserves;
  }

  private static parseProcessList(lines: string[], _errors?: string[]): ProcessInfo[] {
    const processes: ProcessInfo[] = [];
    let inProcessList = false;

    for (const line of lines) {
      if (line.includes('Tasks state (memory values in pages)')) {
        inProcessList = true;
        continue;
      }

      if (line.includes('oom-kill:')) {
        inProcessList = false;
        continue;
      }

      if (inProcessList) {
        // Skip header line
        if (line.includes('[  pid  ]')) continue;

        // Match: [    302]     0   302     2111      642    49152      894             0 haveged
        const processMatch = line.match(
          /\[\s*(\d+)\]\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(.+)$/
        );
        if (processMatch) {
          processes.push({
            pid: parseInt(processMatch[1], 10),
            uid: parseInt(processMatch[2], 10),
            tgid: parseInt(processMatch[3], 10),
            totalVm: parseInt(processMatch[4], 10),
            rss: parseInt(processMatch[5], 10),
            pgtablesBytes: parseInt(processMatch[6], 10),
            swapents: parseInt(processMatch[7], 10),
            oomScoreAdj: parseInt(processMatch[8], 10),
            name: processMatch[9].trim(),
          });
        }
      }
    }

    return processes;
  }

  private static parseOOMConstraint(lines: string[], errors: string[]): OOMConstraint {
    const constraint: OOMConstraint = {
      constraint: '',
      nodemask: null,
      cpuset: '',
      memsAllowed: '',
      globalOom: false,
      taskMemcg: '',
      task: '',
      pid: 0,
      uid: 0,
    };

    const oomKillLine = this.findLineContaining(lines, 'oom-kill:');
    if (!oomKillLine) {
      errors.push('Could not find oom-kill constraint line');
      return constraint;
    }

    const constraintMatch = oomKillLine.match(/constraint=(\w+)/);
    if (constraintMatch) constraint.constraint = constraintMatch[1];

    const nodemaskMatch = oomKillLine.match(/nodemask=([^,]+)/);
    if (nodemaskMatch) {
      const value = nodemaskMatch[1].trim();
      constraint.nodemask = value === '(null)' ? null : value;
    }

    const cpusetMatch = oomKillLine.match(/cpuset=([^,]+)/);
    if (cpusetMatch) constraint.cpuset = cpusetMatch[1];

    const memsMatch = oomKillLine.match(/mems_allowed=([^,]+)/);
    if (memsMatch) constraint.memsAllowed = memsMatch[1];

    constraint.globalOom = oomKillLine.includes('global_oom');

    const memcgMatch = oomKillLine.match(/task_memcg=([^,]+)/);
    if (memcgMatch) constraint.taskMemcg = memcgMatch[1];

    const taskMatch = oomKillLine.match(/task=([^,]+)/);
    if (taskMatch) constraint.task = taskMatch[1];

    const pidMatch = oomKillLine.match(/pid=(\d+)/);
    if (pidMatch) constraint.pid = parseInt(pidMatch[1], 10);

    const uidMatch = oomKillLine.match(/uid=(\d+)/);
    if (uidMatch) constraint.uid = parseInt(uidMatch[1], 10);

    return constraint;
  }

  private static parseKilledProcess(lines: string[], errors: string[]): KilledProcess {
    const killed: KilledProcess = {
      pid: 0,
      name: '',
      totalVmKB: 0,
      anonRssKB: 0,
      fileRssKB: 0,
      shmemRssKB: 0,
      uid: 0,
      pgtablesKB: 0,
      oomScoreAdj: 0,
    };

    const killedLine = this.findLineContaining(lines, 'Out of memory: Killed process');
    if (!killedLine) {
      errors.push('Could not find killed process line');
      return killed;
    }

    const pidMatch = killedLine.match(/Killed process (\d+)/);
    if (pidMatch) killed.pid = parseInt(pidMatch[1], 10);

    const nameMatch = killedLine.match(/Killed process \d+ \(([^)]+)\)/);
    if (nameMatch) killed.name = nameMatch[1];

    const totalVmMatch = killedLine.match(/total-vm:(\d+)kB/);
    if (totalVmMatch) killed.totalVmKB = parseInt(totalVmMatch[1], 10);

    const anonRssMatch = killedLine.match(/anon-rss:(\d+)kB/);
    if (anonRssMatch) killed.anonRssKB = parseInt(anonRssMatch[1], 10);

    const fileRssMatch = killedLine.match(/file-rss:(\d+)kB/);
    if (fileRssMatch) killed.fileRssKB = parseInt(fileRssMatch[1], 10);

    const shmemRssMatch = killedLine.match(/shmem-rss:(\d+)kB/);
    if (shmemRssMatch) killed.shmemRssKB = parseInt(shmemRssMatch[1], 10);

    const uidMatch = killedLine.match(/UID:(\d+)/);
    if (uidMatch) killed.uid = parseInt(uidMatch[1], 10);

    const pgtablesMatch = killedLine.match(/pgtables:(\d+)kB/);
    if (pgtablesMatch) killed.pgtablesKB = parseInt(pgtablesMatch[1], 10);

    const scoreMatch = killedLine.match(/oom_score_adj:(-?\d+)/);
    if (scoreMatch) killed.oomScoreAdj = parseInt(scoreMatch[1], 10);

    return killed;
  }

  // ================
  // UTILITY HELPERS
  // ================

  private static findLineContaining(lines: string[], search: string): string | null {
    return lines.find((line) => line.includes(search)) || null;
  }

  private static extractKB(line: string, field: string): number {
    const regex = new RegExp(`${field}[:\\s]*(-?\\d+)kB`, 'i');
    const match = line.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  }
}
