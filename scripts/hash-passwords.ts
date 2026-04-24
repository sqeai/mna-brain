import { readFileSync, writeFileSync } from "fs";
import { scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;

// how to use?
// tsx scripts/hash-passwords.ts <csv-file-name> <salt-hex>

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

async function main() {
  const [, , inputFile, salt] = process.argv;

  if (!inputFile || !salt) {
    console.error(
      "Usage: tsx scripts/hash-passwords.ts <input.csv> <salt-hex>",
    );
    process.exit(1);
  }

  const saltBuf = Buffer.from(salt, "hex");
  const lines = readFileSync(inputFile, "utf-8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const header = parseCsvLine(lines[0]);
  const emailIdx = header.indexOf("email");
  const passwordIdx = header.indexOf("password");

  if (emailIdx === -1 || passwordIdx === -1) {
    console.error('CSV must have "email" and "password" columns');
    process.exit(1);
  }

  const rows: string[] = ["email,password"];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const email = fields[emailIdx];
    const password = fields[passwordIdx];

    if (!email || !password) {
      console.warn(`Skipping row ${i + 1}: missing email or password`);
      continue;
    }

    const derived = await scryptAsync(password, saltBuf, KEY_LEN);
    const hashed = `scrypt$${saltBuf.toString("hex")}$${derived.toString("hex")}`;
    rows.push(`${email},${hashed}`);
  }

  const outputFile = inputFile.replace(/(\.[^.]+)?$/, ".hashed$1");
  writeFileSync(outputFile, rows.join("\n") + "\n");
  console.log(`Wrote ${rows.length - 1} hashed row(s) to ${outputFile}`);
}

main();
