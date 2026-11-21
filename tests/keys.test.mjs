import test from 'node:test';
import assert from 'node:assert/strict';
import { K980_KEYS } from '../keys.js';

test('keys.js contains all 99 K980 keys with valid geometry and metadata', () => {
  assert.equal(Array.isArray(K980_KEYS), true);
  assert.equal(K980_KEYS.length, 99);

  for (const key of K980_KEYS) {
    assert.equal(typeof key.id, 'string');
    assert.equal(typeof key.label, 'string');
    assert.equal(typeof key.eventCode, 'string');
    assert.ok(key.eventCode.length > 0, `Empty eventCode on ${key.id}`);
    assert.ok(Number.isFinite(key.x) && key.x >= 0, `Invalid x on ${key.id}`);
    assert.ok(Number.isFinite(key.y) && key.y >= 0, `Invalid y on ${key.id}`);
    assert.ok(Number.isFinite(key.w) && key.w > 0, `Invalid w on ${key.id}`);
    assert.ok(Number.isFinite(key.h) && key.h > 0, `Invalid h on ${key.id}`);
    assert.ok(key.x + key.w <= 655, `Key ${key.id} exceeds SVG width`);
    assert.ok(key.y + key.h <= 245, `Key ${key.id} exceeds SVG height`);
  }
});

test('key ids and eventCodes are globally unique and Enter keys are distinct', () => {
  const ids = new Set(K980_KEYS.map((k) => k.id));
  const eventCodes = new Set(K980_KEYS.map((k) => k.eventCode));

  assert.equal(ids.size, K980_KEYS.length);
  assert.equal(eventCodes.size, K980_KEYS.length);

  const mainEnter = K980_KEYS.find((k) => k.id === 'K65');
  const numpadEnter = K980_KEYS.find((k) => k.id === 'K96');
  assert.equal(mainEnter?.eventCode, 'Enter');
  assert.equal(numpadEnter?.eventCode, 'NumpadEnter');
});

test('no two keys overlap in 2D SVG coordinates', () => {
  const overlaps = [];
  for (let i = 0; i < K980_KEYS.length; i++) {
    const a = K980_KEYS[i];
    for (let j = i + 1; j < K980_KEYS.length; j++) {
      const b = K980_KEYS[j];
      const separated =
        a.x + a.w <= b.x ||
        b.x + b.w <= a.x ||
        a.y + a.h <= b.y ||
        b.y + b.h <= a.y;
      if (!separated) {
        overlaps.push(`${a.id} <-> ${b.id}`);
      }
    }
  }
  assert.deepEqual(overlaps, []);
});
