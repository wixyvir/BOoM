import brotliPromise, { type BrotliWasmType } from 'brotli-wasm';

export class CompressionService {
    private static brotli: BrotliWasmType | null = null;

    private static async init() {
        if (!this.brotli) {
            this.brotli = await brotliPromise;
        }
    }

    static async compress(text: string): Promise<string> {
        try {
            await this.init();
            if (!this.brotli) throw new Error('Brotli not initialized');

            const data = new TextEncoder().encode(text);
            const compressed = this.brotli.compress(data);

            // Convert Uint8Array to binary string for btoa
            // Using a more efficient approach for large arrays if possible, but map is safe
            const binaryString = Array.from(compressed)
                .map((byte) => String.fromCharCode(byte as number))
                .join('');
            return btoa(binaryString);
        } catch (error) {
            console.error('Compression failed:', error);
            throw new Error('Failed to compress data');
        }
    }

    static async decompress(encoded: string): Promise<string> {
        try {
            await this.init();
            if (!this.brotli) throw new Error('Brotli not initialized');

            const binaryString = atob(encoded);
            const compressed = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                compressed[i] = binaryString.charCodeAt(i);
            }

            const decompressed = this.brotli.decompress(compressed);
            return new TextDecoder().decode(decompressed);
        } catch (error) {
            console.error('Decompression failed:', error);
            throw new Error('Failed to decompress data');
        }
    }
}
