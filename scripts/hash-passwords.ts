import { readFileSync, writeFileSync } from 'fs';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;
const SALT_LEN = 16;

async function main() {
  const [, , inputFile] = process.argv;

  if (!inputFile) {
    console.error('Usage: tsx scripts/hash-passwords.ts <input.txt>');
    process.exit(1);
  }

  const passwords = readFileSync(inputFile, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const hashed: string[] = [];
  for (const password of passwords) {
    const saltBuf = randomBytes(SALT_LEN);
    const derived = await scryptAsync(password, saltBuf, KEY_LEN);
    hashed.push(`scrypt$${saltBuf.toString('hex')}$${derived.toString('hex')}`);
  }

  const outputFile = inputFile.replace(/(\.[^.]+)?$/, '.hashed$1');
  writeFileSync(outputFile, hashed.join('\n') + '\n');
  console.log(`Wrote ${hashed.length} hashed password(s) to ${outputFile}`);
}

main();
