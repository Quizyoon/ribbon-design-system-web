import { existsSync, lstatSync, unlinkSync, rmSync, symlinkSync, realpathSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(__dirname, '..');
const linkPath = resolve(docsRoot, 'build');

// Resolve ribbon-design-system via Node module resolution (handles workspace hoisting)
const require = createRequire(resolve(docsRoot, 'package.json'));
const tokensPkg = require.resolve('ribbon-design-system/package.json');
const targetPath = resolve(dirname(realpathSync(tokensPkg)), 'build');

// Remove existing build/ (directory or symlink)
if (existsSync(linkPath)) {
  const stat = lstatSync(linkPath);
  if (stat.isSymbolicLink()) {
    unlinkSync(linkPath);
  } else {
    rmSync(linkPath, { recursive: true });
  }
}

// Create symlink
symlinkSync(targetPath, linkPath, 'dir');
console.log(`✓ ribbon-docs/build → ${targetPath}`);
