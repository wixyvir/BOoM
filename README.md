# BOoM Viewer

**Better Out of Memory Viewer** - A web application for analyzing Linux OOM (Out of Memory) kill logs.

## Disclaimer

> **:warning: Warning**
> This project is in early development stage. The parser may not correctly handle all OOM log formats. Use with caution and always verify critical information manually.

- I am not a frontend software engineer so I use CLAUDE to help me build this, so I can easily view and share Out of Memory traces.

## Screenshot

![BOoM Viewer Screenshot](documentation/screenshot.png)


## Alpha online access

- https://boom.cyprien.eu/

## Features

- Parse and analyze Linux kernel OOM kill logs
- Extract structured information: trigger process, memory statistics, process list, kill decision
- Visual memory bars and sortable process tables
- Shareable URLs - paste a log, get a compressed URL to share
- Client-side only - no data sent to any server

## Demo

Paste your OOM log content and get an instant analysis with:
- System information (kernel version, hardware)
- Memory breakdown (anonymous, file, shmem, swap)
- Process list with memory usage
- Kill decision details

## Installation for development

```bash
# Clone the repository
cd boom-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. Open the application in your browser
2. Paste your OOM kill log (from `dmesg`, `journalctl`, or `/var/log/messages`)
3. Click "Analyze" to parse and visualize the log
4. Share the generated URL with others

### Extracting OOM Logs

```bash
# From dmesg
dmesg | grep -A 200 "invoked oom-killer"

# From journalctl
journalctl -k | grep -A 200 "invoked oom-killer"

# From log files
grep -A 200 "invoked oom-killer" /var/log/messages
```

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS
- **Compression**: Brotli (via brotli-wasm)
- **Testing**: Vitest

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Test Fixtures

The parser is tested against real-world OOM logs stored in `tests/fixtures/`:

To add a new test fixture:
1. Add your `.txt` file to `tests/fixtures/`
2. Run `npm test` - the new fixture will be automatically tested
3. All fixtures must pass the core parsing tests (trigger, system info, memory, processes, etc.)

## Docker

Build and run the production image:

```bash
# Build the image
docker build -t boom-viewer .

# Run the container
docker run -p 8080:80 boom-viewer
```

Then open http://localhost:8080 in your browser.

## Known Limitations

The parser has been tested against multiple OOM log formats and handles most cases correctly. However, some edge cases remain:

### Parsing Limitations

1. **DMA Zone**: The DMA memory zone (without "32") is not extracted due to a regex pattern limitation
   - `DMA32` and `Normal` zones are parsed correctly
   - Buddy info for the plain `DMA` zone is also skipped

2. **Page Tables**: Multi-line memory info fields like `pagetables` on continuation lines may return 0
   - This occurs when the field appears on a line without a timestamp prefix

3. **RIP Register**: The RIP register value is partially truncated
   - Format `0033:0x65c2a5` is parsed as `0033:0` due to the `x` character not being in the regex character class
   - Other registers (RSP, RAX, RBX, etc.) parse correctly

### Testing

All limitations are documented in the test suite with specific test cases. The parser is tested against multiple real-world OOM log fixtures to ensure reliability.

### Future Improvements

These limitations will be addressed in future releases. Contributions to improve the parser are welcome!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source. See the LICENSE file for details.

