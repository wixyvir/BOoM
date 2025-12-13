// ====================
// 1. System Information Types
// ====================
export interface OOMTrigger {
  timestamp: string;
  triggerProcess: string;
  gfpMask: string;
  gfpFlags: string[];
  order: number;
  oomScoreAdj: number;
}

export interface SystemInfo {
  cpu: number;
  pid: number;
  comm: string;
  kdump: string;
  tainted: boolean;
  kernelVersion: string;
  hardwareVendor: string;
  hardwareModel: string;
  hardwarePlatform: string;
  bios: string;
}

// ====================
// 2. Call Stack Types
// ====================
export interface StackFrame {
  function: string;
  offset: string;
  size: string;
}

export interface RegisterState {
  rip: string;
  rsp: string;
  eflags: string;
  rax: string;
  rbx: string;
  rcx: string;
  rdx: string;
  rsi: string;
  rdi: string;
  rbp: string;
  r08: string;
  r09: string;
  r10: string;
  r11: string;
  r12: string;
  r13: string;
  r14: string;
  r15: string;
}

export interface CallStack {
  frames: StackFrame[];
  registers: RegisterState | null;
  codeNote: string | null;
}

// ====================
// 3. Memory Statistics Types
// ====================
export interface MemInfoPages {
  activeAnon: number;
  inactiveAnon: number;
  isolatedAnon: number;
  activeFile: number;
  inactiveFile: number;
  isolatedFile: number;
  unevictable: number;
  dirty: number;
  writeback: number;
  slabReclaimable: number;
  slabUnreclaimable: number;
  mapped: number;
  shmem: number;
  pagetables: number;
  secPagetables: number;
  bounce: number;
  kernelMiscReclaimable: number;
  free: number;
  freePcp: number;
  freeCma: number;
}

export interface NodeMemoryKB {
  node: number;
  activeAnon: number;
  inactiveAnon: number;
  activeFile: number;
  inactiveFile: number;
  unevictable: number;
  isolatedAnon: number;
  isolatedFile: number;
  mapped: number;
  dirty: number;
  writeback: number;
  shmem: number;
  shmemThp: number;
  shmemPmdmapped: number;
  anonThp: number;
  writebackTmp: number;
  kernelStack: number;
  pagetables: number;
  secPagetables: number;
  allUnreclaimable: boolean;
}

export interface ZoneInfo {
  node: number;
  zone: 'DMA' | 'DMA32' | 'Normal' | string;
  free: number;
  boost: number;
  min: number;
  low: number;
  high: number;
  reservedHighatomic: number;
  activeAnon: number;
  inactiveAnon: number;
  activeFile: number;
  inactiveFile: number;
  unevictable: number;
  writepending: number;
  present: number;
  managed: number;
  mlocked: number;
  bounce: number;
  freePcp: number;
  localPcp: number;
  freeCma: number;
}

export interface BuddyBlock {
  count: number;
  size: number;
  flags: string;
}

export interface BuddyInfo {
  node: number;
  zone: string;
  blocks: BuddyBlock[];
  total: number;
}

export interface HugepagesInfo {
  node: number;
  size: number;
  total: number;
  free: number;
  surp: number;
}

export interface SwapInfo {
  freeSwap: number;
  totalSwap: number;
  pagesInSwapCache: number;
}

export interface PageCacheInfo {
  totalPagecachePages: number;
  pagesRam: number;
  pagesHighMemMovableOnly: number;
  pagesReserved: number;
  pagesCmaReserved: number;
  pagesHwpoisoned: number;
}

export interface MemoryInfo {
  memInfoPages: MemInfoPages;
  nodeMemory: NodeMemoryKB[];
  zones: ZoneInfo[];
  buddyInfo: BuddyInfo[];
  hugepages: HugepagesInfo[];
  swapInfo: SwapInfo;
  pageCacheInfo: PageCacheInfo;
  lowmemReserve: number[][];
}

// ====================
// 4. Process List Types
// ====================
export interface ProcessInfo {
  pid: number;
  uid: number;
  tgid: number;
  totalVm: number;
  rss: number;
  pgtablesBytes: number;
  swapents: number;
  oomScoreAdj: number;
  name: string;
}

// ====================
// 5. OOM Kill Decision Types
// ====================
export interface OOMConstraint {
  constraint: string;
  nodemask: string | null;
  cpuset: string;
  memsAllowed: string;
  globalOom: boolean;
  taskMemcg: string;
  task: string;
  pid: number;
  uid: number;
}

export interface KilledProcess {
  pid: number;
  name: string;
  totalVmKB: number;
  anonRssKB: number;
  fileRssKB: number;
  shmemRssKB: number;
  uid: number;
  pgtablesKB: number;
  oomScoreAdj: number;
}

// ====================
// 6. Main Parsed Log Type
// ====================
export interface ParsedOOMLog {
  trigger: OOMTrigger;
  systemInfo: SystemInfo;
  callStack: CallStack;
  memoryInfo: MemoryInfo;
  processes: ProcessInfo[];
  oomConstraint: OOMConstraint;
  killedProcess: KilledProcess;
  rawLog: string;
  parseErrors: string[];
}

// ====================
// 7. Parser Result Type
// ====================
export interface OOMParseResult {
  success: boolean;
  data: ParsedOOMLog | null;
  errors: string[];
}
