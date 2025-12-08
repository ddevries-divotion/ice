import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

const PUB_DIR = 'dist';

export default defineConfig({
  root: resolve(__dirname, 'demo'),
  publicDir: resolve(__dirname, PUB_DIR),
  server: {
    port: 5173,
  },
});