import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export interface SshKeyPair {
  privateKey: string; // PEM/OpenSSH format
  publicKey: string;  // OpenSSH authorized_keys format
}

/**
 * Generate Ed25519 SSH key pair menggunakan ssh-keygen CLI.
 * Lazy: pakai native CLI daripada implementasi crypto manual.
 * ponytail: simpan sementara di /tmp, hapus setelah dibaca.
 */
export async function generateSshKeyPair(comment = 'rupacloud-cicd'): Promise<SshKeyPair> {
  const keyPath = join(tmpdir(), `rupa-sshkey-${Date.now()}`);

  await execAsync(`ssh-keygen -t ed25519 -f ${keyPath} -N "" -C "${comment}"`);

  const [privateKey, publicKey] = await Promise.all([
    readFile(keyPath, 'utf8'),
    readFile(`${keyPath}.pub`, 'utf8'),
  ]);

  // Cleanup
  await Promise.all([unlink(keyPath), unlink(`${keyPath}.pub`)]);

  return { privateKey, publicKey: publicKey.trim() };
}
