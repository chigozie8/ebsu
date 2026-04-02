#!/usr/bin/env node
// This script patches vite.config.ts to auto-start server.ts when Vite starts
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd());
const viteConfigPath = resolve(root, 'vite.config.ts');
const pkgPath = resolve(root, 'package.json');

// 1. Patch vite.config.ts — add spawn import and expressServerPlugin
let vite = readFileSync(viteConfigPath, 'utf8');

if (!vite.includes('expressServerPlugin')) {
  // Add import
  vite = vite.replace(
    `import { defineConfig, loadEnv } from 'vite'\nimport react from '@vitejs/plugin-react'`,
    `import { defineConfig, loadEnv } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport { spawn } from 'child_process'\n\n// Plugin to auto-start the Express API server alongside Vite\nfunction expressServerPlugin() {\n  let proc = null;\n  return {\n    name: 'express-server',\n    apply: 'serve',\n    configureServer() {\n      if (proc) return;\n      proc = spawn('npx', ['tsx', 'server.ts'], {\n        stdio: 'inherit',\n        shell: true,\n        env: { ...process.env },\n      });\n      proc.on('error', (err) => console.error('[api-server] start error:', err.message));\n      process.on('exit', () => proc && proc.kill());\n    },\n  };\n}`
  );

  // Add plugin to plugins array
  vite = vite.replace(
    `plugins: [react()],`,
    `plugins: [react(), expressServerPlugin()],`
  );

  writeFileSync(viteConfigPath, vite, 'utf8');
  console.log('[patch] vite.config.ts updated — expressServerPlugin added');
} else {
  console.log('[patch] vite.config.ts already patched');
}

// 2. Patch package.json — update dev script
let pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (pkg.scripts.dev === 'vite') {
  pkg.scripts.dev = 'vite'; // keep as vite — plugin handles server startup
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log('[patch] package.json dev script: vite (plugin auto-starts server.ts)');
} else {
  console.log('[patch] package.json already patched');
}

console.log('[patch] Done!');
