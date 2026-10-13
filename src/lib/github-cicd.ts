// Ponytail: native fetch ke GitHub REST API. libsodium hanya untuk enkripsi secret (wajib by GitHub API spec).

import _sodium from 'libsodium-wrappers';

/** Ambil public key repo untuk enkripsi secret */
async function getRepoPublicKey(token: string, owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'RupaCloud-App',
    },
  });
  if (!res.ok) throw new Error(`Gagal ambil public key GitHub repo: ${res.statusText}`);
  return res.json() as Promise<{ key: string; key_id: string }>;
}

/** Enkripsi secret value dengan repo public key (NaCl sealed box, sesuai GitHub API spec) */
async function encryptSecret(publicKeyBase64: string, secretValue: string): Promise<string> {
  await _sodium.ready;
  const sodium = _sodium;
  const keyBytes = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL);
  const secretBytes = sodium.from_string(secretValue);
  const encrypted = sodium.crypto_box_seal(secretBytes, keyBytes);
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);
}

export const githubCiCd = {
  /**
   * Enkripsi dan simpan secret ke repo GitHub user.
   * Otomatis fetch public key repo terlebih dahulu.
   */
  async setRepoSecret(token: string, owner: string, repo: string, secretName: string, secretValue: string) {
    const { key, key_id } = await getRepoPublicKey(token, owner, repo);
    const encryptedValue = await encryptSecret(key, secretValue);

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'RupaCloud-App',
      },
      body: JSON.stringify({ encrypted_value: encryptedValue, key_id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gagal set secret ${secretName}: ${err.message || res.statusText}`);
    }
  },

  /**
   * Inject file .github/workflows/deploy.yml ke repo user via GitHub API.
   * Jika file sudah ada, update (perlu SHA file lama).
   */
  async injectWorkflow(token: string, owner: string, repo: string, yamlContent: string, branch?: string) {
    const targetBranch = branch || 'main';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/deploy.yml`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'RupaCloud-App',
    };

    // Cek apakah file sudah ada di branch target (untuk mendapatkan SHA-nya)
    let sha: string | undefined;
    const checkUrl = targetBranch ? `${url}?ref=${encodeURIComponent(targetBranch)}` : url;
    const existing = await fetch(checkUrl, { headers });
    if (existing.ok) {
      const data = await existing.json() as { sha: string };
      sha = data.sha;
    }

    const payload: Record<string, any> = {
      message: 'chore: add RupaCloud deployment workflow',
      content: Buffer.from(yamlContent).toString('base64'),
    };
    if (targetBranch) payload.branch = targetBranch;
    if (sha) payload.sha = sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const rawMsg = err.message || res.statusText;
      if (res.status === 404) {
        throw new Error(
          `Gagal commit file workflow ke GitHub (${rawMsg}). Akun GitHub Anda membutuhkan izin 'workflow' untuk membuat file di .github/workflows/. Silakan putuskan dan sambungkan ulang akun GitHub Anda di halaman Pengaturan agar izin diperbarui.`
        );
      }
      throw new Error(`Gagal inject workflow: ${rawMsg}`);
    }
  },

  /** List repo milik user yang login */
  async listRepos(token: string) {
    const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=pushed', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'RupaCloud-App',
      },
    });
    if (!res.ok) throw new Error('Gagal fetch daftar repo GitHub.');
    const repos = await res.json() as { full_name: string; name: string; private: boolean }[];
    return repos.map(r => ({ fullName: r.full_name, name: r.name, isPrivate: r.private }));
  },
};
