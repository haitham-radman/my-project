import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { buildIndex, search } from './index.mjs';
import { loadSkills } from './load-skills.mjs';

const usage =
  'Usage: node tools/skill-search/cli.mjs [--limit 10] [--json] -- <query>';

let parsed;
try {
  parsed = parseArgs({
    options: {
      limit: { type: 'string', default: '10' },
      json: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });
} catch (error) {
  // A query such as -draft is read as a flag unless it follows a bare `--`.
  console.error(`${error.message}\n${usage}`);
  process.exit(1);
}

const { values, positionals } = parsed;
const query = positionals.join(' ');
const limit = Number(values.limit);
if (!query || !Number.isInteger(limit) || limit < 1) {
  console.error(usage);
  process.exit(1);
}

const skillsDir = join(import.meta.dirname, '..', '..', '.claude', 'skills');
const index = buildIndex(await loadSkills(skillsDir));

let results;
try {
  results = search(index, query, { limit });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Skill text comes from third parties: drop control characters, such as
// terminal escape sequences, before printing it.
const clean = text =>
  text
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const shorten = (text, max) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

if (values.json) {
  console.log(JSON.stringify(results, null, 2));
} else if (!results.length) {
  console.log('No skills match.');
} else {
  for (const { score, folder, name, description, snippet } of results) {
    const label = folder === name ? name : `${name} (${folder}/)`;
    console.log(`${score.toFixed(2).padStart(6)}  ${label}`);
    console.log(`        ${shorten(clean(description), 150)}`);
    if (snippet.text) {
      console.log(`        … ${shorten(clean(snippet.text), 150)}`);
    }
  }
}
