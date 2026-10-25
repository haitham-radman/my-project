import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import { buildIndex, search } from './index.mjs';
import { loadSkills, parseSkill } from './load-skills.mjs';
import { normalizeText, tokenize } from './normalize.mjs';
import { parseQuery } from './parse-query.mjs';

const skillsDir = join(import.meta.dirname, '..', '..', '.claude', 'skills');

const skills = [
  {
    folder: 'humanizer',
    name: 'humanizer',
    description: 'Rewrite AI-sounding text so it reads like the writer.',
    body: 'Remove stock AI words. Never remove licence notices.',
  },
  {
    folder: 'scrapling',
    name: 'scrapling-official',
    description: 'Scrape web pages with a headless browser.',
    body: 'Spiders obey robots.txt. Ask before installs, then run the spider.',
  },
  {
    folder: 'cafe',
    name: 'cafe-menu',
    description: 'A naïve résumé builder.',
    body: 'Designs one-page résumés. Spiders are not involved.',
  },
];
const index = buildIndex(skills);
const folders = query => search(index, query).map(r => r.folder);

describe('skill-search', () => {
  for (const [label, text, expected] of [
    [
      'plain',
      '---\nname: a-b\ndescription: Does a thing.\n---\nBody',
      { name: 'a-b', description: 'Does a thing.', body: 'Body' },
    ],
    [
      'plain over several lines',
      '---\nname: a\ndescription: first line\n  second line\nlicense: MIT\n---\nB',
      { name: 'a', description: 'first line second line', body: 'B' },
    ],
    [
      'double quoted with an escape',
      '---\nname: a\ndescription: "Say \\"hi\\": it\'s fine"\n---\nB',
      { name: 'a', description: 'Say "hi": it\'s fine', body: 'B' },
    ],
    [
      'double quoted across lines',
      '---\nname: a\ndescription: "one\n  two"\n---\nB',
      { name: 'a', description: 'one two', body: 'B' },
    ],
    [
      'single quoted',
      "---\nname: a\ndescription: 'it''s here: yes'\n---\nB",
      { name: 'a', description: "it's here: yes", body: 'B' },
    ],
    [
      'literal block',
      '---\nname: a\ndescription: |\n  line one\n  line two\nlicense: MIT\n---\nB',
      { name: 'a', description: 'line one\nline two', body: 'B' },
    ],
    [
      'folded block',
      '---\nname: a\ndescription: >-\n  folded\n  text\n---\nB',
      { name: 'a', description: 'folded text', body: 'B' },
    ],
    [
      'keys in any order, nested keys ignored',
      '---\nlicense: MIT\nmetadata:\n  description: nested\n  name: nested\ndescription: top\nname: top-name\n---\nB',
      { name: 'top-name', description: 'top', body: 'B' },
    ],
    [
      'CRLF line endings',
      '---\r\nname: a\r\ndescription: crlf\r\n---\r\nB',
      { name: 'a', description: 'crlf', body: 'B' },
    ],
    [
      'no frontmatter',
      '# Just text',
      { name: '', description: '', body: '# Just text' },
    ],
  ]) {
    test(`parses ${label}`, () => {
      assert.deepEqual(parseSkill(text), expected);
    });
  }

  test('normalisation drops case and diacritics but keeps offsets', () => {
    assert.equal(normalizeText('Café NAÏVE'), 'cafe naive');
    assert.deepEqual(tokenize('Un café!'), [
      { term: 'un', start: 0, end: 2 },
      { term: 'cafe', start: 3, end: 7 },
    ]);
  });

  for (const [query, expected] of [
    [
      'foo bar',
      [
        ['text', ['foo']],
        ['text', ['bar']],
      ],
    ],
    ['"foo bar"', [['text', ['foo', 'bar']]]],
    ['design-taste', [['text', ['design', 'taste']]]],
    [
      'name:"a b"',
      [
        ['name', ['a']],
        ['name', ['b']],
      ],
    ],
    ['unknown:thing', [['text', ['unknown', 'thing']]]],
    ['"foo ba', [['text', ['foo', 'ba']]]],
  ]) {
    test(`parses the query ${query}`, () => {
      assert.deepEqual(
        parseQuery(query).terms.map(t => [t.field, t.tokens]),
        expected
      );
    });
  }

  test('parses negation, prefix and any', () => {
    const { terms, any } = parseQuery('-foo -name:bar baz* any:1');
    assert.equal(any, true);
    assert.deepEqual(
      terms.map(t => [t.field, t.negated, t.prefix]),
      [
        ['text', true, false],
        ['name', true, false],
        ['text', false, true],
      ]
    );
    assert.throws(() => parseQuery('any:2'), /must be "0" or "1"/);
  });

  test('requires every term unless any:1', () => {
    assert.deepEqual(folders('spiders ask'), ['scrapling']);
    assert.equal(folders('any:1 licence spiders').length, 3);
  });

  test('excludes negated terms; only exclusions match nothing', () => {
    assert.ok(!folders('spiders -robots').includes('scrapling'));
    assert.deepEqual(folders('-spiders'), []);
  });

  test('matches phrases only when words are adjacent', () => {
    assert.deepEqual(folders('"stock ai words"'), ['humanizer']);
    assert.deepEqual(folders('"words stock"'), []);
  });

  test('expands a trailing * as a prefix', () => {
    assert.deepEqual(folders('scrap*'), ['scrapling']);
    assert.deepEqual(folders('resum*').sort(), ['cafe']);
  });

  test('searches without regard to diacritics', () => {
    assert.deepEqual(folders('naive resume'), ['cafe']);
  });

  test('field filters limit where a word may match', () => {
    assert.deepEqual(folders('name:scrapling'), ['scrapling']);
    assert.deepEqual(folders('name:spiders'), []);
    assert.deepEqual(folders('description:headless'), ['scrapling']);
    assert.deepEqual(folders('body:headless'), []);
  });

  test('a name match outranks a mention in a long body', () => {
    const filler = 'filler words '.repeat(30);
    const ranked = buildIndex([
      {
        folder: 'b',
        name: 'beta',
        description: 'tool',
        body: `alpha ${filler}`,
      },
      { folder: 'a', name: 'alpha', description: 'tool', body: filler },
      { folder: 'c', name: 'gamma', description: 'tool', body: filler },
    ]);
    assert.deepEqual(
      search(ranked, 'alpha').map(r => r.folder),
      ['a', 'b']
    );
  });

  test('snippet ranges point at the matched body text', () => {
    const [{ snippet }] = search(index, 'robots');
    const [[start, end]] = snippet.ranges;
    assert.equal(snippet.text.slice(start, end), 'robots');
  });

  test('honours limit and an empty query', () => {
    assert.equal(
      search(index, 'any:1 licence spiders', { limit: 1 }).length,
      1
    );
    assert.deepEqual(search(index, '   '), []);
  });
});

describe('skill-search over .claude/skills', () => {
  test('every skill has a name and description, and the index finds it', async () => {
    const real = await loadSkills(skillsDir);
    assert.ok(real.length > 80);
    assert.deepEqual(
      real.filter(s => !s.name || !s.description).map(s => s.folder),
      []
    );

    const index = buildIndex(real);
    assert.equal(search(index, 'name:humanizer')[0].folder, 'humanizer');
    // The folder and the frontmatter name differ for this third-party skill.
    const [scrapling] = search(index, 'name:scrapling');
    assert.deepEqual(
      [scrapling.folder, scrapling.name],
      ['scrapling', 'scrapling-official']
    );
  });

  test('the command line prints ranked skills', () => {
    const run = (...args) =>
      spawnSync(
        process.execPath,
        [join(import.meta.dirname, 'cli.mjs'), ...args],
        {
          encoding: 'utf8',
        }
      );

    const ok = run('--limit', '3', '--', 'name:humanizer');
    assert.equal(ok.status, 0);
    assert.match(ok.stdout, /^\s*[\d.]+\s+humanizer$/m);

    assert.equal(run('-nope').status, 1);
    assert.match(
      run('--limit', '3', '--', 'zzzqqqxxx').stdout,
      /No skills match/
    );
  });
});
