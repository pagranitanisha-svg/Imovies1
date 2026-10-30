const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSeatList } = require('../utils/seatLayout');

test('builds the configured seat identifiers in row order', () => {
  assert.deepEqual(buildSeatList(2, 3), ['A1', 'A2', 'A3', 'B1', 'B2', 'B3']);
});

test('supports the maximum configured row count', () => {
  assert.deepEqual(buildSeatList(26, 1).slice(-2), ['Y1', 'Z1']);
});
