import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const packageEntries = await readdir('packages', { withFileTypes: true });
let formattedCount = 0;

for (const entry of packageEntries) {
  if (!entry.isDirectory()) continue;

  const changelogPath = path.join('packages', entry.name, 'CHANGELOG.md');
  const original = await readOptionalFile(changelogPath);
  if (original === null) continue;

  const formatted = formatUpdatedDependenciesSpacing(original);
  if (formatted === original) continue;

  await writeFile(changelogPath, formatted);
  formattedCount += 1;
}

console.log(`Formatted dependency changelog spacing in ${formattedCount} file(s).`);

async function readOptionalFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function formatUpdatedDependenciesSpacing(markdown: string): string {
  const lines = markdown.split('\n');
  const formattedLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('- Updated dependencies [') && formattedLines.at(-1)?.trim()) {
      formattedLines.push('');
    }

    formattedLines.push(line);
  }

  return formattedLines.join('\n');
}
