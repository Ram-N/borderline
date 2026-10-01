import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

// Rename landmark.html → index.html in the output so the shared
// vercel.json rewrite ("/(.*)" → "/index.html") works for both apps.
function renameLandmarkHtml(): Plugin {
  return {
    name: 'rename-landmark-html',
    closeBundle() {
      const src = path.resolve('dist-landmark/landmark.html');
      const dest = path.resolve('dist-landmark/index.html');
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), renameLandmarkHtml()],
  build: {
    outDir: 'dist-landmark',
    rollupOptions: {
      input: 'landmark.html',
    },
  },
});
