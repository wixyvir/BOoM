# BOoM Viewer

## Project Overview

**BOoM Viewer** (Better Out of Memory Viewer) is a web application for analyzing Linux OOM (Out of Memory) kill logs. Users can paste OOM log content, which gets compressed and encoded into a shareable URL, allowing easy sharing of analyzed logs.

## Purpose

- Analyze Linux OOM kill logs with structured parsing
- Extract metrics: system info, memory statistics, process list, kill decision
- Compress content using Brotli for efficient URL storage
- Generate shareable URLs containing the compressed data in the URL hash
- Display analysis results with visual components

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 3.4 with custom color palette (primary blues, slate grays)
- **Routing**: React Router DOM 7
- **Compression**: brotli-wasm (WebAssembly Brotli compression)
- **Icons**: lucide-react
- **Utilities**: clsx + tailwind-merge for className management

## Project Structure

```
src/
├── main.tsx              # React app entry point
├── App.tsx               # Main app with router setup
├── index.css             # Tailwind imports and base styles
├── types/
│   └── OOMTypes.ts       # TypeScript interfaces for OOM parsing
├── components/
│   ├── Layout.tsx        # Main layout with header/footer
│   └── oom/              # OOM analysis components
│       ├── OOMAnalysis.tsx           # Main container
│       ├── shared/
│       │   ├── SectionCard.tsx       # Card wrapper with variants
│       │   ├── MetricDisplay.tsx     # Key-value metric display
│       │   ├── MemoryBar.tsx         # Visual memory bar
│       │   └── CollapsibleSection.tsx
│       └── sections/
│           ├── TriggerSection.tsx    # OOM trigger info
│           ├── SystemInfoSection.tsx # Kernel, hardware
│           ├── CallStackSection.tsx  # Stack trace, registers
│           ├── MemorySection.tsx     # Memory stats, zones
│           ├── ProcessListSection.tsx     # Sortable process table
│           ├── ProcessDistributionSection.tsx # Memory distribution with deduplication
│           └── KillDecisionSection.tsx    # Kill reason, victim
├── pages/
│   ├── InputPage.tsx     # Homepage with text input
│   └── ResultPage.tsx    # Results with tabs (Analysis/Raw)
├── services/
│   ├── CompressionService.ts  # Brotli compression
│   └── OOMParserService.ts    # OOM log parser
└── lib/
    └── utils.ts          # cn() utility
```

## OOM Parser Service

The `OOMParserService` parses Linux kernel OOM kill logs and extracts:

### Parsed Entities

1. **OOMTrigger**: timestamp, trigger process, gfp_mask, flags, order, oom_score_adj
2. **SystemInfo**: CPU, PID, kernel version, hardware vendor/model/BIOS
3. **CallStack**: stack frames, CPU registers, code notes
4. **MemoryInfo**:
   - `memInfoPages`: active_anon, inactive_anon, shmem, free, mapped, slab, etc.
   - `nodeMemory`: per-node KB values
   - `zones`: DMA/DMA32/Normal with free/min/low/high thresholds
   - `buddyInfo`: page fragmentation
   - `hugepages`: 1GB and 2MB huge pages
   - `swapInfo`: free/total swap, pages in cache
5. **ProcessInfo[]**: pid, uid, name, total_vm, rss, pgtables, swapents, oom_score_adj
6. **OOMConstraint**: constraint type, cgroup, global_oom flag
7. **KilledProcess**: pid, name, total-vm, anon-rss, file-rss, shmem-rss

### Usage

```typescript
import { OOMParserService } from './services/OOMParserService';

// Check if content is an OOM log
if (OOMParserService.isOOMLog(content)) {
  const result = OOMParserService.parse(content);
  if (result.success && result.data) {
    // Use result.data (ParsedOOMLog)
  }
}
```

## Key Files

### Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite config (excludes brotli-wasm from optimizeDeps)
- `tailwind.config.js` - Custom colors (primary palette, slate-850) and Inter font
- `tsconfig.app.json` - TypeScript strict mode, ES2022 target
- `Dockerfile` - Multi-stage production build (Node 22 Alpine + nginx Alpine)
- `nginx.conf` - nginx configuration for SPA routing

### Core Services
- **CompressionService**: Lazy-loads brotli-wasm, compresses/decompresses text
- **OOMParserService**: Static class with regex-based parsing, returns structured data

### Pages
- **InputPage**: Textarea input, compresses and navigates to result
- **ResultPage**: Decompresses, detects OOM logs, shows Analysis or Raw tabs

## Routes

- `/` - Input page (paste snippets)
- `/result` - Result page (snippet in URL hash, auto-detects OOM logs)
- `*` - Redirects to `/`

## NPM Scripts

```bash
npm run dev      # Start development server
npm run build    # TypeScript check + Vite build
npm run lint     # Run ESLint
npm run preview  # Preview production build
npm run test     # Run tests in watch mode
npm run test:run # Run tests once
npm run test:coverage # Run tests with coverage
```

## Docker

```bash
docker build -t boom-viewer .     # Build production image
docker run -p 8080:80 boom-viewer # Run on port 8080
```

## Design

- Clean, minimal UI with slate/blue color scheme
- Responsive layout with container constraints
- Tab navigation for Analysis vs Raw content
- Visual memory bars with threshold-based coloring
- Sortable, searchable process table
- Highlighted killed process in danger styling
- Collapsible sections for verbose data (call stack, detailed stats)

## Shared Memory Handling

Linux reports RSS (Resident Set Size) per-process, but shared memory regions (e.g., PostgreSQL `shared_buffers`) are counted in **each process** that maps them. This can cause summed RSS to exceed physical RAM.

### ProcessDistributionSection Features

1. **Warning Note**: When system shared memory is detected and total RSS exceeds it, an amber info box explains the double-counting issue.

2. **Deduplicate Shared Memory Toggle**: A checkbox that switches between:
   - **Off (default)**: Shows sum of all processes' RSS per group
   - **On**: Shows only the **largest process's RSS** per group as an estimate of unique memory

   The deduplication uses max RSS per group because processes with the same name (e.g., `postmaster`, `httpd`) typically share most of their memory via shared memory segments or copy-on-write pages.

### Example
For 50 PostgreSQL `postmaster` processes each reporting ~1GB RSS (mostly the same 4GB shared_buffers):
- **Default view**: 50 × 1GB = ~50GB (misleading)
- **Deduplicated view**: max(1GB) = ~1GB per group (realistic)

### Per-Process Shared Memory Limitation

The Linux kernel's OOM log format does **not** include per-process shared memory in the process table. The table only shows: `pid, uid, tgid, total_vm, rss, pgtables_bytes, swapents, oom_score_adj, name`.

The breakdown into `anon-rss`, `file-rss`, and `shmem-rss` is **only** available for the killed process in the final line. Therefore, we can only display the system-wide shared memory total from the `Mem-Info` section.

## UI Features

### InputPage
- Collapsible help sections with commands for extracting OOM logs via `dmesg`, `journalctl`, and log files
- Copy-to-clipboard buttons on code blocks

### ProcessDistributionSection
- Click on any PID in the expanded process list to scroll to that process in the Process List table
- Clicked process row is highlighted with a yellow background and ring for 4 seconds
- System shared memory displayed in the header alongside total RSS

### Navigation
- Clicking the logo in the header navigates back to the input page
