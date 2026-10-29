'use strict';
const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine.js');

test('detects language by dominant script', () => {
  assert.strictEqual(E.detectLang('اكتب لي مقالاً عن القهوة'), 'ar');
  assert.strictEqual(E.detectLang('write an article about coffee'), 'en');
});

test('detects task type in both languages', () => {
  assert.strictEqual(E.detectType('Debug this python function, it throws an error'), 'coding');
  assert.strictEqual(E.detectType('اكتب إيميل متابعة للعميل'), 'email');
  assert.strictEqual(E.detectType('hello there'), 'general');
});

test('enhance keeps the user text and adds missing sections', () => {
  const r = E.enhance('Help me write a business plan for my startup...');
  assert.ok(r.prompt.includes('Help me write a business plan for my startup.'));
  for (const c of ['role', 'context', 'steps', 'format', 'rules', 'clarify']) assert.ok(r.changes.includes(c), c);
  assert.ok(r.after > r.before);
  assert.strictEqual(r.lang, 'en');
});

test('enhance does not duplicate a role the user already gave', () => {
  const r = E.enhance('You are a lawyer. Summarize this contract as a table.');
  assert.ok(!r.changes.includes('role'));
  assert.ok(!r.changes.includes('format'));
});

test('arabic input yields an arabic prompt', () => {
  const r = E.enhance('ساعدني في كتابة خطة عمل');
  assert.strictEqual(r.lang, 'ar');
  assert.ok(r.prompt.includes('## الدور'));
  assert.ok(!r.prompt.includes('## Role'));
});

test('claude model gets tagged sections, others get markdown', () => {
  assert.ok(E.enhance('plan a trip', { model: 'claude' }).prompt.includes('<task>'));
  assert.ok(E.enhance('plan a trip', { model: 'chatgpt' }).prompt.includes('## Task'));
});

test('explicit type overrides detection', () => {
  assert.strictEqual(E.enhance('hello', { type: 'coding' }).type, 'coding');
});

test('empty input returns null', () => {
  assert.strictEqual(E.enhance('   '), null);
  assert.strictEqual(E.fromTemplate({ task: '' }), null);
});

test('template assembles only the filled fields', () => {
  const r = E.fromTemplate({ role: 'a chef', task: 'plan a menu', tone: 'warm', rules: 'No nuts\n- Max 5 dishes' });
  assert.ok(r.prompt.includes('You are a chef.'));
  assert.ok(r.prompt.includes('- No nuts\n- Max 5 dishes'));
  assert.ok(r.prompt.includes('Tone: warm'));
  assert.ok(!r.prompt.includes('Output format'));
});

test('score is bounded and grows with structure', () => {
  assert.strictEqual(E.score(''), 0);
  const s = E.score(E.enhance('write a post').prompt);
  assert.ok(s > E.score('write a post') && s <= 100);
});
