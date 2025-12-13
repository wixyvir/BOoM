# OOM Viewer

## Project Overview

**OOM Viewer** is a web application for analyzing technical snippets such as logs, stack traces, or configuration files (particularly OOM - Out of Memory - kill logs). Users can paste text content, which gets compressed and encoded into a shareable URL, allowing easy sharing of analyzed snippets.

## Purpose

- Analyze technical logs and snippets
- Compress content using Brotli for efficient URL storage
- Generate shareable URLs containing the compressed data in the URL hash
- Display analysis results with proper formatting

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
├── App.css               # Additional app styles
├── components/
│   └── Layout.tsx        # Main layout with header/footer
├── pages/
│   ├── InputPage.tsx     # Homepage with text input for snippets
│   └── ResultPage.tsx    # Results display page (reads hash from URL)
├── services/
│   └── CompressionService.ts  # Brotli compression/decompression
├── lib/
│   └── utils.ts          # cn() utility for className merging
└── assets/
    └── react.svg
```

## Key Files

### Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite config (excludes brotli-wasm from optimizeDeps)
- `tailwind.config.js` - Custom colors (primary palette, slate-850) and Inter font
- `tsconfig.app.json` - TypeScript strict mode, ES2022 target
- `eslint.config.js` - ESLint with TypeScript and React hooks rules
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer

### Core Logic
- **CompressionService**: Lazy-loads brotli-wasm, compresses text to base64, decompresses base64 back to text
- **InputPage**: Textarea input, calls CompressionService.compress(), navigates to `/result#<compressed>`
- **ResultPage**: Reads URL hash, decompresses with CompressionService.decompress(), displays raw content

## Routes

- `/` - Input page (paste snippets)
- `/result` - Result page (snippet in URL hash)
- `*` - Redirects to `/`

## NPM Scripts

```bash
npm run dev      # Start development server
npm run build    # TypeScript check + Vite build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Design

- Clean, minimal UI with slate/blue color scheme
- Responsive layout with container constraints
- Subtle animations (fade-in, slide-in)
- Dark code blocks for displaying raw content
- Sticky header with blur effect
