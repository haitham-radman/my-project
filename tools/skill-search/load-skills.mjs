import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const FRONTMATTER = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;
const KEY = /^([A-Za-z_][\w-]*):[ \t]*(.*)$/;
const INDENTED = /^(?:[ \t]+\S|\s*$)/;

const dedent = lines => {
  const indents = lines
    .filter(line => line.trim())
    .map(line => line.match(/^[ \t]*/)[0].length);
  const margin = indents.length ? Math.min(...indents) : 0;
  return lines.map(line => line.slice(margin));
};

// Folds a block scalar: `|` keeps the lines, `>` joins them with spaces and
// keeps a blank line as a paragraph break.
const blockScalar = (style, lines) => {
  const text = dedent(lines).join('\n').replace(/\n+$/, '');
  return style.startsWith('|') ? text : text.replace(/([^\n])\n(?!\n)/g, '$1 ');
};

const quoted = (first, rest) => {
  const quote = first[0];
  const single = quote === "'";
  let text = first;
  let next = 0;

  // The closing quote may be on a later line.
  const closed = value =>
    single ? /^'(?:[^']|'')*'$/.test(value) : /^"(?:[^"\\]|\\.)*"$/.test(value);
  while (!closed(text) && next < rest.length) {
    text += ` ${rest[next++].trim()}`;
  }

  const inner = text.slice(1, -1);
  if (single) {
    return inner.replace(/''/g, "'");
  }
  try {
    return JSON.parse(`"${inner}"`);
  } catch {
    return inner;
  }
};

/**
 * Reads the top-level `name` and `description` of a SKILL.md, whatever scalar
 * style they use, and ignores every other key. This is not a YAML parser.
 *
 * @param {string} text
 * @returns {{ name: string, description: string, body: string }}
 */
export const parseSkill = text => {
  const source = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = source.match(FRONTMATTER);
  const result = { name: '', description: '', body: source };
  if (!match) {
    return result;
  }
  result.body = source.slice(match[0].length);

  const lines = match[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const found = lines[i].match(KEY);
    if (!found || !(found[1] === 'name' || found[1] === 'description')) {
      continue;
    }

    let end = i + 1;
    while (end < lines.length && INDENTED.test(lines[end])) {
      end++;
    }
    const rest = lines.slice(i + 1, end);
    const value = found[2].trim();

    let parsed;
    if (/^[|>][+-]?\d?$/.test(value)) {
      parsed = blockScalar(value, rest);
    } else if (value.startsWith('"') || value.startsWith("'")) {
      parsed = quoted(value, rest);
    } else {
      parsed = [value, ...rest.map(line => line.trim())]
        .filter(Boolean)
        .join(' ');
    }
    result[found[1]] = parsed.trim();
  }
  return result;
};

/**
 * @param {string} dir The .claude/skills folder.
 * @returns {Promise<import('./index.mjs').Skill[]>}
 */
export const loadSkills = async dir => {
  const folders = (await readdir(dir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  const skills = await Promise.all(
    folders.map(async folder => {
      let text;
      try {
        text = await readFile(join(dir, folder, 'SKILL.md'), 'utf8');
      } catch {
        return null;
      }
      const skill = parseSkill(text);
      return { folder, ...skill, name: skill.name || folder };
    })
  );
  return skills.filter(Boolean);
};
