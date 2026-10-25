import { tokenize } from './normalize.mjs';
import { parseQuery } from './parse-query.mjs';

const FIELDS = ['name', 'description', 'body'];
const K1 = 1.2;
const B = 0.75;
const SNIPPET_BEFORE = 60;
const SNIPPET_AFTER = 120;

const FIELDS_OF = {
  text: FIELDS,
  name: ['name'],
  description: ['description'],
  body: ['body'],
};

const mean = values =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

const idf = (docsWithHits, totalDocs) =>
  Math.max(
    Math.log((totalDocs - docsWithHits + 0.5) / (docsWithHits + 0.5) + 1),
    0
  );

const bm25 = (idfValue, freq, length, avgLength) =>
  avgLength === 0
    ? 0
    : (idfValue * freq * (K1 + 1)) /
      (freq + K1 * (1 - B + B * (length / avgLength)));

/**
 * @typedef {Object} Skill
 * @property {string} folder Folder name under .claude/skills.
 * @property {string} name Frontmatter name, which can differ from the folder.
 * @property {string} description
 * @property {string} body SKILL.md after the frontmatter.
 */

/**
 * @param {Skill[]} skills
 */
export const buildIndex = skills => {
  const docs = skills.map((skill, id) => ({
    id,
    ...skill,
    tokens: Object.fromEntries(
      FIELDS.map(field => [field, tokenize(skill[field])])
    ),
  }));

  // term -> docId -> field -> token positions
  const postings = new Map();
  for (const doc of docs) {
    for (const field of FIELDS) {
      doc.tokens[field].forEach(({ term }, position) => {
        if (!postings.has(term)) {
          postings.set(term, new Map());
        }
        const byDoc = postings.get(term);
        if (!byDoc.has(doc.id)) {
          byDoc.set(doc.id, { name: [], description: [], body: [] });
        }
        byDoc.get(doc.id)[field].push(position);
      });
    }
  }

  const avgLength = Object.fromEntries(
    FIELDS.map(field => [field, mean(docs.map(d => d.tokens[field].length))])
  );

  return { docs, postings, avgLength };
};

// docId -> field -> positions of one word, or of every word it prefixes.
const positionsOf = (index, token, prefix) => {
  const merged = new Map();
  const add = byDoc => {
    for (const [docId, fields] of byDoc) {
      if (!merged.has(docId)) {
        merged.set(docId, {
          name: new Set(),
          description: new Set(),
          body: new Set(),
        });
      }
      for (const field of FIELDS) {
        fields[field].forEach(p => merged.get(docId)[field].add(p));
      }
    }
  };

  if (prefix) {
    for (const [word, byDoc] of index.postings) {
      if (word.startsWith(token)) {
        add(byDoc);
      }
    }
  } else if (index.postings.has(token)) {
    add(index.postings.get(token));
  }
  return merged;
};

// docId -> field -> start positions of the phrase.
const matchTerm = (index, term) => {
  const last = term.tokens.length - 1;
  const lists = term.tokens.map((token, i) =>
    positionsOf(index, token, term.prefix && i === last)
  );
  const matches = new Map();

  for (const [docId, first] of lists[0]) {
    const found = {};
    for (const field of FIELDS_OF[term.field]) {
      found[field] = [...first[field]].filter(start =>
        lists.every((list, i) => list.get(docId)?.[field].has(start + i))
      );
    }
    if (FIELDS.some(field => found[field]?.length)) {
      matches.set(docId, found);
    }
  }
  return matches;
};

// Shows where the words appear in the body, or the start of the description
// when only the name or description matched.
const makeSnippet = (doc, positiveTerms, matches) => {
  const ranges = [];
  positiveTerms.forEach((term, i) => {
    for (const start of matches[i].get(doc.id)?.body ?? []) {
      ranges.push([
        doc.tokens.body[start].start,
        doc.tokens.body[start + term.tokens.length - 1].end,
      ]);
    }
  });
  ranges.sort((a, b) => a[0] - b[0]);

  if (!ranges.length) {
    return { text: '', ranges: [] };
  }

  // Start and end on whole words, except at the edges of the body.
  const { body } = doc;
  let from = Math.max(0, ranges[0][0] - SNIPPET_BEFORE);
  let to = Math.min(body.length, ranges[0][1] + SNIPPET_AFTER);
  while (from > 0 && from < ranges[0][0] && /\S/.test(body[from - 1])) {
    from++;
  }
  while (to < body.length && to > ranges[0][1] && /\S/.test(body[to])) {
    to--;
  }
  return {
    text: body.slice(from, to),
    ranges: ranges
      .filter(([start, end]) => start >= from && end <= to)
      .map(([start, end]) => [start - from, end - from]),
  };
};

/**
 * All terms must match, unless the query contains `any:1`. A query of only
 * exclusions has nothing to rank and returns no results.
 *
 * @param {ReturnType<typeof buildIndex>} index
 * @param {string} query
 * @param {{ limit?: number }} [options]
 */
export const search = (index, query, { limit = 20 } = {}) => {
  const { terms, any } = parseQuery(query);
  const positive = terms.filter(t => !t.negated);
  const negative = terms.filter(t => t.negated);

  if (!positive.length) {
    return [];
  }

  const positiveMatches = positive.map(term => matchTerm(index, term));
  const ids = positiveMatches.map(m => new Set(m.keys()));
  const candidates = any
    ? [...new Set(ids.flatMap(set => [...set]))]
    : [...ids[0]].filter(id => ids.every(set => set.has(id)));

  const excluded = new Set(
    negative.flatMap(term => [...matchTerm(index, term).keys()])
  );
  const docs = candidates
    .filter(id => !excluded.has(id))
    .map(id => index.docs[id]);

  // Document frequency per term and field, as FTS reports in matchinfo.
  const docsWithHits = positive.map((term, j) =>
    Object.fromEntries(
      FIELDS.map(field => [
        field,
        [...positiveMatches[j].values()].filter(f => f[field]?.length).length,
      ])
    )
  );

  return docs
    .map(doc => {
      let score = 0;
      const fields = new Set();
      positive.forEach((term, j) => {
        const found = positiveMatches[j].get(doc.id);
        for (const field of FIELDS_OF[term.field]) {
          const freq = found?.[field]?.length ?? 0;
          if (!freq) {
            continue;
          }
          fields.add(field);
          score += bm25(
            idf(docsWithHits[j][field], index.docs.length),
            freq,
            doc.tokens[field].length,
            index.avgLength[field]
          );
        }
      });

      return {
        folder: doc.folder,
        name: doc.name,
        description: doc.description,
        score,
        fields: FIELDS.filter(field => fields.has(field)),
        snippet: makeSnippet(doc, positive, positiveMatches),
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
};
