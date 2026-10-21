/**
 * Prints an ADMIN_PASSWORD_HASH for the admin panel. Reads the password from the prompt (or stdin),
 * so it never lands in shell history. Usage: npm run admin:hash --prefix backend
 */
import readline from 'node:readline';
import { hashPassword } from '../lib/admin.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stderr, terminal: process.stdin.isTTY });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const password = (await ask('Admin password: ')).replace(/\r?\n$/, '');
rl.close();
if (password.length < 10) {
  console.error('Use at least 10 characters.');
  process.exit(1);
}
process.stdout.write(`ADMIN_PASSWORD_HASH=${hashPassword(password)}\n`);
