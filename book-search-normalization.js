(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BookSearchNormalization = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function extractTitlePrefix(text) {
    if (typeof text !== 'string') return undefined;

    const phraseMatch = text.match(/(?:books?|titles?)?\s*(?:that\s+)?(?:start(?:s|ing)?|begin(?:s|ning)?)\s*(?:with\s+)?(?:the\s+letter\s+)?["']?([a-z0-9]+)/i);
    const shorthandMatch = text.match(/\b([a-z0-9]+)[-\s](?:title|titled)\s+books?\b/i);
    const match = phraseMatch || shorthandMatch;
    return match ? match[1] : undefined;
  }

  function extractStructuredFilters(text, availableGenres = []) {
    if (typeof text !== 'string') return {};
    const filters = {};
    const lowerText = text.toLowerCase();

    const maxPriceMatch = lowerText.match(/(?:under|below|less than|max(?:imum)?|cheaper than)\s*\$?(\d+(?:\.\d+)?)/);
    const minPriceMatch = lowerText.match(/(?:over|above|more than|min(?:imum)?|at least)\s*\$?(\d+(?:\.\d+)?)/);
    if (maxPriceMatch) filters.max_price = Number(maxPriceMatch[1]);
    if (minPriceMatch) filters.min_price = Number(minPriceMatch[1]);

    const beforeMatch = lowerText.match(/(?:before|prior to|older than|earlier than|pre-?)\s*(\d{4})/);
    const afterMatch = lowerText.match(/(?:after|since|newer than|post-?)\s*(\d{4})/);
    const exactYearMatch = lowerText.match(/(?:published in|in year|from year|year)\s*(\d{4})/) || lowerText.match(/\b(20\d{2}|19\d{2})\b/);
    if (beforeMatch) filters.published_before = Number(beforeMatch[1]);
    if (afterMatch) filters.published_after = Number(afterMatch[1]);
    if (!beforeMatch && !afterMatch && exactYearMatch) filters.published_year = Number(exactYearMatch[1]);

    if (/\b(low stock|running low)\b/.test(lowerText)) filters.stock_status = 'low_stock';
    else if (/\b(out of stock|sold out)\b/.test(lowerText)) filters.stock_status = 'out_of_stock';
    else if (/\b(high stock|in stock|available now|available)\b/.test(lowerText)) filters.stock_status = 'in_stock';

    const genre = availableGenres.find(item => lowerText.includes(item.toLowerCase()));
    if (genre) filters.genre = genre;

    if (/\b(recent|newest|latest|new releases?)\b/.test(lowerText)) filters.sort_by = 'year_desc';
    else if (/\b(cheap|cheapest|budget)\b/.test(lowerText)) filters.sort_by = 'price_asc';

    return filters;
  }

  function stripStructuredPhrases(text, availableGenres = []) {
    if (typeof text !== 'string') return undefined;
    let cleaned = text
      .replace(/(?:books?|titles?)?\s*(?:that\s+)?(?:start(?:s|ing)?|begin(?:s|ning)?)\s*(?:with\s+)?(?:the\s+letter\s+)?["']?[a-z0-9]+/gi, '')
      .replace(/\b[a-z0-9]+[-\s](?:title|titled)\s+books?\b/gi, '')
      .replace(/(?:under|below|less than|max(?:imum)?|cheaper than|over|above|more than|min(?:imum)?|at least)\s*\$?(\d+(?:\.\d+)?)/gi, '')
      .replace(/(?:before|prior to|older than|earlier than|after|since|newer than|published in|in year|from(?: year)?|year)\s*(\d{4})/gi, '')
      .replace(/\b(20\d{2}|19\d{2})\b/g, '')
      .replace(/\b(high stock|low stock|out of stock|sold out|in stock|available now|available|running low|recent|newest|latest|new releases?|cheap|cheapest|budget)\b/gi, '');

    for (const genre of availableGenres) {
      cleaned = cleaned.replace(new RegExp(genre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
    }

    cleaned = cleaned
      .replace(/\b(do you have|can i find|show me|show|find|search|list|get|are there|any|books?|copies|published|year|price|cost|under|below|above|before|after|in|stock|low|out of|available|genre|category)\b/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();

    return cleaned.length >= 2 ? cleaned : undefined;
  }

  function normalizeAdvancedBookSearchArgs(args, availableGenres = []) {
    const normalized = { ...(args || {}) };
    const query = normalized.query || '';
    const detectedPrefix = extractTitlePrefix(query);
    const detectedFilters = extractStructuredFilters(query, availableGenres);

    if (!normalized.title_starts_with && detectedPrefix) {
      normalized.title_starts_with = detectedPrefix;
    }
    for (const [key, value] of Object.entries(detectedFilters)) {
      if (normalized[key] === undefined || normalized[key] === null || normalized[key] === '') {
        normalized[key] = value;
      }
    }

    normalized.query = stripStructuredPhrases(query, availableGenres);

    return normalized;
  }

  return { extractTitlePrefix, extractStructuredFilters, normalizeAdvancedBookSearchArgs, stripStructuredPhrases };
});
