import { tokenize } from './normalize.mjs';

const FILTERS = new Set(['any', 'name', 'description', 'body']);

const trimQuotes = value =>
  value.length > 1 && value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;

// A word is only a filter name when followed by ':' outside quotes, so
// 'https://example.com' stays plain text.
const splitQuery = query => {
  const parts = [];
  let inQuote = false;
  let inFilterValue = false;
  let filter = '_';
  let current = '';

  const push = () => {
    parts.push({ filter, raw: current });
    filter = '_';
    current = '';
  };

  for (const char of query) {
    if (char === '"') {
      current += char;
      if (inQuote) {
        push();
      }
      inQuote = !inQuote;
      continue;
    }

    if (char === ' ' && !inQuote) {
      inFilterValue = false;
      if (current) {
        push();
      }
      continue;
    }

    if (
      char === ':' &&
      !inQuote &&
      !inFilterValue &&
      FILTERS.has(current.replace(/^-/, '').toLowerCase())
    ) {
      filter = current.toLowerCase();
      current = '';
      inFilterValue = true;
      continue;
    }

    current += char;
  }

  // An unclosed quote is a phrase, so results appear while the user types.
  if (inQuote) {
    current += '"';
  }
  if (current) {
    push();
  }

  return parts;
};

/**
 * @typedef {Object} Term
 * @property {'text' | 'name' | 'description' | 'body'} field `text` searches all three.
 * @property {string[]} tokens Normalised words, matched as a phrase when there is more than one.
 * @property {boolean} prefix The last token ends with `*`.
 * @property {boolean} negated
 */

/**
 * @param {string} query
 * @returns {{ terms: Term[], any: boolean }}
 */
export const parseQuery = query => {
  const terms = [];
  let any = false;

  for (const part of splitQuery(query.trim().replace(/\s/g, ' '))) {
    let { filter, raw } = part;
    let negated = false;

    if (filter.startsWith('-')) {
      negated = true;
      filter = filter.slice(1);
    } else if (filter === '_' && raw.startsWith('-')) {
      negated = true;
      raw = raw.slice(1);
    }

    const value = trimQuotes(raw);

    if (filter === 'any') {
      if (negated || (value !== '0' && value !== '1')) {
        throw new Error('The value of filter "any" must be "0" or "1"');
      }
      any = value === '1';
      continue;
    }

    const tokens = tokenize(value).map(token => token.term);
    if (!tokens.length) {
      continue;
    }
    const prefix = value.endsWith('*');

    if (filter === '_') {
      terms.push({ field: 'text', tokens, prefix, negated });
    } else {
      // Quotes make no phrase here: name:"a b" means name:a name:b.
      tokens.forEach((token, i) =>
        terms.push({
          field: filter,
          tokens: [token],
          prefix: prefix && i === tokens.length - 1,
          negated,
        })
      );
    }
  }

  return { terms, any };
};
