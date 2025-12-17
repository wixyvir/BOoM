import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { CompressionService } from './CompressionService';

// Load the example OOM log fixture for testing with real content
const fixtureOOMLog = readFileSync(
  join(__dirname, '../../tests/fixtures/example_oomkill.txt'),
  'utf-8'
);

// Load all fixtures dynamically
const fixturesDir = join(__dirname, '../../tests/fixtures');
const fixtureFiles = readdirSync(fixturesDir).filter(f => f.endsWith('.txt'));
const fixtures = fixtureFiles.map(filename => ({
  name: filename,
  content: readFileSync(join(fixturesDir, filename), 'utf-8')
}));

describe('CompressionService', () => {
  // Test all fixtures
  describe('All Fixtures Round-Trip', () => {
    fixtures.forEach(fixture => {
      it(`compresses and decompresses ${fixture.name} correctly`, async () => {
        const compressed = await CompressionService.compress(fixture.content);
        const decompressed = await CompressionService.decompress(compressed);

        expect(decompressed).toBe(fixture.content);
      });

      it(`produces smaller output for ${fixture.name}`, async () => {
        const compressed = await CompressionService.compress(fixture.content);

        // Brotli should compress OOM logs significantly
        // Base64 adds ~33% overhead, but Brotli compression should overcome this
        expect(compressed.length).toBeLessThan(fixture.content.length);
      });
    });
  });

  describe('compress and decompress round-trip', () => {
    it('compresses and decompresses short strings correctly', async () => {
      const original = 'Hello, World!';
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });

    it('compresses and decompresses long strings correctly', async () => {
      const original = fixtureOOMLog;
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });

    it('compresses and decompresses Unicode characters correctly', async () => {
      const original = '日本語テスト 🚀 émojis et accénts ñ';
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });

    it('compresses and decompresses multi-line content correctly', async () => {
      const original = `Line 1
Line 2
Line 3
    Indented line
Tab\tseparated`;
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });

    it('compresses and decompresses special characters correctly', async () => {
      const original = '<script>alert("XSS")</script> & "quotes" \'apostrophes\'';
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });
  });

  describe('compression efficiency', () => {
    it('produces compressed output shorter than input for large text', async () => {
      const original = fixtureOOMLog;
      const compressed = await CompressionService.compress(original);

      // Brotli should compress OOM logs significantly
      // Base64 adds ~33% overhead, but Brotli compression should overcome this
      expect(compressed.length).toBeLessThan(original.length);
    });

    it('produces valid base64 output', async () => {
      const original = 'Test content';
      const compressed = await CompressionService.compress(original);

      // Base64 should only contain valid characters
      expect(compressed).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });
  });

  describe('error handling', () => {
    it('throws an error for invalid base64 input to decompress', async () => {
      await expect(
        CompressionService.decompress('not-valid-base64!!!')
      ).rejects.toThrow('Failed to decompress data');
    });

    it('throws an error for corrupted compressed data', async () => {
      // Valid base64 but not valid Brotli compressed data
      const invalidCompressed = btoa('this is not brotli compressed');

      await expect(
        CompressionService.decompress(invalidCompressed)
      ).rejects.toThrow('Failed to decompress data');
    });

    it('handles empty string compression', async () => {
      const original = '';
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });
  });

  describe('idempotency', () => {
    it('produces consistent compressed output for the same input', async () => {
      const original = 'Consistent input';

      const compressed1 = await CompressionService.compress(original);
      const compressed2 = await CompressionService.compress(original);

      expect(compressed1).toBe(compressed2);
    });
  });

  describe('edge cases', () => {
    it('handles very long strings', async () => {
      const original = 'A'.repeat(100000);
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
      // Repetitive content should compress very well
      expect(compressed.length).toBeLessThan(original.length / 10);
    });

    it('handles binary-like content in strings', async () => {
      // String with various byte values
      const original = Array.from({ length: 256 }, (_, i) =>
        String.fromCharCode(i)
      ).join('');

      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });

    it('handles strings with null characters', async () => {
      const original = 'before\0middle\0after';
      const compressed = await CompressionService.compress(original);
      const decompressed = await CompressionService.decompress(compressed);

      expect(decompressed).toBe(original);
    });
  });
});
