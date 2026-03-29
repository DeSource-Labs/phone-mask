import fs from 'node:fs';

const REPORT_FILE = process.env.REPORT_FILE || 'coverage-pr-report.md';
const token = process.env.GITHUB_TOKEN;
const repo = process.env.REPO;
const prNumber = process.env.PR_NUMBER;

if (!token || !repo || !prNumber) {
  throw new Error('Missing required env vars: GITHUB_TOKEN, REPO, PR_NUMBER.');
}

if (!fs.existsSync(REPORT_FILE)) {
  throw new Error(`Coverage report file not found: ${REPORT_FILE}`);
}

const body = fs.readFileSync(REPORT_FILE, 'utf8');
const [owner, name] = repo.split('/');

if (!owner || !name) {
  throw new Error(`Invalid REPO value: ${repo}`);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'coverage-workflow'
};

/**
 * @param {string} url
 * @param {RequestInit} [init]
 */
async function request(url, init) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch(url, {
    ...init,
    headers: init?.headers ? { ...headers, ...init.headers } : headers,
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${text}`);
  }
  return res;
}

async function main() {
  await request(`https://api.github.com/repos/${owner}/${name}/issues/${prNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  console.log(`Created new coverage comment on PR #${prNumber}.`);
}

await main();
