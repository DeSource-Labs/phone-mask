import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const packageEntries = await readdir('packages', { withFileTypes: true });
const formattedFiles = await Promise.all(
  packageEntries.map(async (entry) => {
    if (!entry.isDirectory()) return false;

    const changelogPath = path.join('packages', entry.name, 'CHANGELOG.md');
    const original = await readOptionalFile(changelogPath);
    if (original === null) return false;

    const formatted = formatUpdatedDependenciesSpacing(original);
    if (formatted === original) return false;

    await writeFile(changelogPath, formatted);
    return true;
  })
);
const formattedCount = formattedFiles.filter(Boolean).length;

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
