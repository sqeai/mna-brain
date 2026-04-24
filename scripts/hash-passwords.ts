import { readFileSync, writeFileSync } from 'fs';
import { scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;

async function main() {
  const [, , inputFile, salt] = process.argv;

  if (!inputFile || !salt) {
    console.error('Usage: tsx scripts/hash-passwords.ts <input.txt> <salt>');
    process.exit(1);
  }

  const saltBuf = Buffer.from(salt, 'hex');
  const passwords = readFileSync(inputFile, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const hashed: string[] = [];
  for (const password of passwords) {
    const derived = await scryptAsync(password, saltBuf, KEY_LEN);
    hashed.push(`scrypt$${saltBuf.toString('hex')}$${derived.toString('hex')}`);
  }

  const outputFile = inputFile.replace(/(\.[^.]+)?$/, '.hashed$1');
  writeFileSync(outputFile, hashed.join('\n') + '\n');
  console.log(`Wrote ${hashed.length} hashed password(s) to ${outputFile}`);
}

main();
