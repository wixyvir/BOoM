# OOM Trace Analysis

This document analyzes the structure and values found in the `example_oomkill.txt` Linux Out-Of-Memory (OOM) trace.

## 1. Trigger Event
The log begins with the event that triggered the OOM killer.
```
[ven. nov. 28 07:26:44 2025] postmaster invoked oom-killer: gfp_mask=0x140cca(GFP_HIGHUSER_MOVABLE|__GFP_COMP), order=0, oom_score_adj=0
```
-   **Invoker**: `postmaster` (PostgreSQL process) requested memory.
-   **gfp_mask**: Flags describing the memory allocation request (e.g., `GFP_HIGHUSER_MOVABLE`).
-   **order**: The size of the allocation request (order 0 = 1 page).
-   **oom_score_adj**: Adjustment score for the invoking process.

## 2. System Information
Context about the system state at the time of the crash.
```
[ven. nov. 28 07:26:44 2025] CPU: 7 PID: 3240780 Comm: postmaster Kdump: loaded Not tainted 5.14.0-362.8.1.el9_3.x86_64 #1
[ven. nov. 28 07:26:44 2025] Hardware name: VMware, Inc. VMware20,1/440BX Desktop Reference Platform...
```
-   **CPU**: The CPU core executing the code.
-   **PID/Comm**: Process ID and command name.
-   **Kernel**: Version `5.14.0-362.8.1.el9_3.x86_64`.
-   **Hardware**: Running on VMware virtualization.

## 3. Call Trace
The kernel stack trace showing the execution path leading to `out_of_memory`.
```
[ven. nov. 28 07:26:44 2025] Call Trace:
...
[ven. nov. 28 07:26:44 2025]  out_of_memory+0xed/0x2e0
[ven. nov. 28 07:26:44 2025]  __alloc_pages_slowpath.constprop.0+0x6e8/0x960
...
```
This confirms that a page fault (`exc_page_fault`) led to a memory allocation attempt (`__alloc_pages`) which failed, triggering the OOM killer.

## 4. Memory Info (Mem-Info)
Global memory statistics in pages (usually 4KB).
```
[ven. nov. 28 07:26:44 2025] Mem-Info:
[ven. nov. 28 07:26:44 2025] active_anon:675488 inactive_anon:3104512 isolated_anon:0
...
[ven. nov. 28 07:26:44 2025] free:33077 free_pcp:0 free_cma:0
```
-   **active_anon/inactive_anon**: Anonymous memory (heap, stack) usage.
-   **active_file/inactive_file**: Page cache memory.
-   **free**: Number of free pages.

## 5. Node Memory State
Detailed breakdown per NUMA node (Node 0).
```
[ven. nov. 28 07:26:44 2025] Node 0 active_anon:2701952kB inactive_anon:12418048kB ...
```
-   Shows memory in kB.
-   **DMA/DMA32/Normal**: Memory zones and their free pages.
-   **Lowmem_reserve**: Memory reserved for critical kernel operations.

## 6. Swap Status
Usage of swap space.
```
[ven. nov. 28 07:26:44 2025] Free swap  = 1694460kB
[ven. nov. 28 07:26:44 2025] Total swap = 2097148kB
```
-   Swap was available (~1.6GB free), but likely not enough or not usable fast enough to satisfy the request.

## 7. Tasks State (Process List)
A snapshot of all processes and their memory usage at the time of OOM.
```
[ven. nov. 28 07:26:44 2025] [  pid  ]   uid  tgid total_vm      rss pgtables_bytes swapents oom_score_adj name
...
[ven. nov. 28 07:26:44 2025] [3499662]    26 3499662  1270759  1075110  9220096        0             0 postmaster
```
-   **total_vm**: Virtual memory size (in pages).
-   **rss**: Resident Set Size (physical memory in use, in pages).
-   **pgtables_bytes**: Memory used by page tables.
-   **oom_score_adj**: User-set adjustment to OOM score (-1000 to 1000).

## 8. The Kill Decision
The conclusion of the OOM killer.
```
[ven. nov. 28 07:26:44 2025] Out of memory: Killed process 3499662 (postmaster) total-vm:5083036kB, anon-rss:854636kB, file-rss:0kB, shmem-rss:3445804kB, UID:26 pgtables:9004kB oom_score_adj:0
```
-   **Killed process**: `postmaster` (PID 3499662).
-   **Reason**: It was likely the largest consumer or had the highest OOM score.
-   **Stats**:
    -   `total-vm:5083036kB` (~5GB virtual)
    -   `shmem-rss:3445804kB` (~3.4GB shared memory)
