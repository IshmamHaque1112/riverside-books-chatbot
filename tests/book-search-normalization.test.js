const assert = require('node:assert/strict');
const { normalizeAdvancedBookSearchArgs } = require('../book-search-normalization.js');

for (const [phrase, prefix] of [
  ['Show me books starting with B', 'B'],
  ['titles that begin with B', 'B'],
  ['show B-title books', 'B'],
  ['books start with D', 'D']
]) {
  const result = normalizeAdvancedBookSearchArgs({ query: phrase });
  assert.equal(result.title_starts_with.toLowerCase(), prefix.toLowerCase(), phrase);
  assert.equal(result.query, undefined, phrase);
}

assert.deepEqual(
  normalizeAdvancedBookSearchArgs({ query: 'Riverside', genre: 'History' }),
  { query: 'Riverside', genre: 'History' }
);

assert.deepEqual(
  normalizeAdvancedBookSearchArgs(
    { query: 'cheap science fiction books under $20 available now from 2023' },
    ['Science Fiction', 'Mystery']
  ),
  {
    query: undefined,
    genre: 'Science Fiction',
    max_price: 20,
    published_year: 2023,
    stock_status: 'in_stock',
    sort_by: 'price_asc'
  }
);

assert.deepEqual(
  normalizeAdvancedBookSearchArgs({ query: 'recent books' }),
  { query: undefined, sort_by: 'year_desc' }
);

assert.deepEqual(
  normalizeAdvancedBookSearchArgs({ query: 'Books under 20 dollars' }),
  { query: undefined, max_price: 20 }
);

assert.deepEqual(
  normalizeAdvancedBookSearchArgs({ query: 'Books published in 2021' }),
  { query: undefined, published_year: 2021 }
);

console.log('Book search normalization tests passed.');
