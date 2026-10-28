import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';
import { stdin, stderr } from 'node:process';
import { createInterface } from 'node:readline/promises';

import { SystemClock } from '@sher/shared-utils';
import QRCode from 'qrcode';

import { AuditService } from './audit/audit.service';
import { loadConfig } from './config';
import { createControlPool } from './db/pool';
import { OperatorsService } from './operators/operators.service';

/**
 * Server-only operator recovery.
 *
 * The database mutation stays in OperatorsService. This wrapper owns only the
 * shell concerns: flags, OS identity and the short-lived QR image. The PNG is
 * born mode 0600 inside a mode-0700 temporary directory and is removed before
 * the command exits, including an interrupted scan where the process can trap
 * the signal.
 */
async function main(): Promise<void> {
  const email = flag('--email');
  const password = flag('--password');
  const performedBy = flag('--performed-by');
  const reason = flag('--reason');
  if (email === null || password === null || performedBy === null || reason === null) {
    note(
      'Usage: operator:recover -- --email <e> --password <p> --performed-by <name> --reason <reason>',
    );
    process.exitCode = 1;
    return;
  }
  if (!stdin.isTTY) {
    note('Operator recovery must run in an interactive terminal so the QR image can be removed safely.');
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();
  const pool = createControlPool(config.databaseUrl);
  let directory = '';
  const cleanup = (): void => {
    if (directory !== '') rmSync(directory, { recursive: true, force: true });
  };
  const interrupted = (): never => {
    cleanup();
    process.exit(130);
  };
  process.once('SIGINT', interrupted);
  process.once('SIGTERM', interrupted);

  try {
    const clock = new SystemClock();
    const audit = new AuditService(pool);
    const operators = new OperatorsService(pool, config, clock, audit);
    const recovered = await operators.recover({
      email,
      password,
      performedBy,
      osUsername: userInfo().username,
      reason,
    });

    directory = mkdtempSync(join(tmpdir(), 'sher-control-recovery-'));
    const imagePath = join(directory, 'authenticator.png');
    const png = await QRCode.toBuffer(recovered.totpUri, { type: 'png', width: 360, margin: 2 });
    writeFileSync(imagePath, png, { flag: 'wx', mode: 0o600 });

    note(`Operator recovered: ${email.trim().toLowerCase()}`);
    note('All previous sessions were revoked. The authenticator must be enrolled again.');
    note(`Open and scan this temporary QR image: ${imagePath}`);
    const prompt = createInterface({ input: stdin, output: stderr });
    try {
      await prompt.question('Press Enter after the QR code has been scanned; the image will be deleted. ');
    } finally {
      prompt.close();
    }
    cleanup();
    directory = '';
    note('Temporary QR image deleted.');
  } finally {
    cleanup();
    process.removeListener('SIGINT', interrupted);
    process.removeListener('SIGTERM', interrupted);
    await pool.end();
  }
}

function flag(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function note(line: string): void {
  stderr.write(`${line}\n`);
}

void main();
