const commonFetchHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

const PRICE_PROVIDERS = [
  {
    key: 'tata_1mg',
    label: 'Tata 1mg',
    buildSearchUrl: (query) => `https://www.1mg.com/search/all?name=${encodeURIComponent(query)}`,
  },
  {
    key: 'apollo',
    label: 'Apollo Pharmacy',
    buildSearchUrl: (query) => `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(slugifyQuery(query))}`,
    compare: compareApolloProvider,
  },
  {
    key: 'amazon',
    label: 'Amazon',
    buildSearchUrl: (query) => `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
  },
  {
    key: 'flipkart',
    label: 'Flipkart',
    buildSearchUrl: (query) => `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
  },
];

const TEXT_ENTITY_MAP = {
  '&amp;': '&',
  '&quot;': '"',
  '&#x27;': '\'',
  '&#39;': '\'',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '\\u0026': '&',
  '\\u003c': '<',
  '\\u003e': '>',
  '\\u002f': '/',
  '\\/': '/',
};

const MEDICINE_IGNORE_PATTERNS = [
  /\bmrp\b/i,
  /\bbatch\b/i,
  /\bmfg\b/i,
  /\bmanufact/i,
  /\bexpiry\b/i,
  /\bexp\b/i,
  /\bcomposition\b/i,
  /\bmarketed\b/i,
  /\bcontains\b/i,
  /\bschedule\b/i,
  /\bkeep out\b/i,
  /\bdoctor\b/i,
  /\bchemist\b/i,
  /\bwarning\b/i,
  /\bdosage\b/i,
  /\bstorage\b/i,
  /\bcustomer care\b/i,
  /\bnet qty\b/i,
  /\bfor external use\b/i,
];

const BLOCKED_RESPONSE_PATTERNS = [
  {
    pattern: /503 - Service Unavailable Error|traffic is piling up|api-services-support@amazon/i,
    note: 'The provider is blocking automated access right now.',
  },
  {
    pattern: /recaptcha|are you a human|confirming\.\.\.|robot check/i,
    note: 'The provider requires a bot check before showing prices.',
  },
  {
    pattern: /Access denied|Request blocked|Forbidden/i,
    note: 'The provider denied automated access for this request.',
  },
];

const NOISY_PRICE_SNIPPET_PATTERNS = [
  /bank offer|cashback|coupon|shop for|max discount|save extra|upi|credit card|wallet/i,
  /\b(?:qid|keywords|dib_|sr|ref|node|url|pd_rd|pf_rd|sprefix)=/i,
  /\b(?:href|class|data-|aria-)[a-z0-9_-]*=/i,
  /https?:\/\//i,
];

const stripHtml = (value = '') => {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
};

const normalizeWhitespace = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const decodeEntities = (value = '') => {
  let output = String(value || '');
  Object.entries(TEXT_ENTITY_MAP).forEach(([from, to]) => {
    output = output.split(from).join(to);
  });
  return output;
};

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slugifyQuery = (value = '') => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

const normalizeMedicineQuery = (value = '') => {
  return normalizeWhitespace(
    String(value)
      .replace(/[_|]+/g, ' ')
      .replace(/[^\w\s.+/-]+/g, ' ')
      .replace(/\s+/g, ' '),
  );
};

const parseInrAmount = (value = '') => {
  const amount = Number(String(value).replace(/[^0-9.]+/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const buildProviderBaseResult = (provider, query) => ({
  key: provider.key,
  label: provider.label,
  status: 'unavailable',
  query,
  searchUrl: provider.buildSearchUrl(query),
  url: provider.buildSearchUrl(query),
  price: null,
  rawPrice: '',
  currency: 'INR',
  productName: '',
  matchedText: '',
  note: '',
});

function scoreTitleMatch(title = '', query = '') {
  const titleTokens = tokenizeQuery(title);
  const queryTokens = tokenizeQuery(query);

  if (queryTokens.length === 0) {
    return 0;
  }

  const tokenHits = queryTokens.filter((token) => titleTokens.includes(token)).length;
  const partialHits = queryTokens.filter(
    (token) => !titleTokens.includes(token) && title.toLowerCase().includes(token),
  ).length;

  return (tokenHits * 15) + (partialHits * 8) - Math.max(0, queryTokens.length - tokenHits - partialHits) * 5;
}

const tokenizeQuery = (query = '') => {
  return normalizeMedicineQuery(query)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 3);
};

const hasSuspiciousPriceSnippet = (snippet = '') => {
  return NOISY_PRICE_SNIPPET_PATTERNS.some((pattern) => pattern.test(snippet));
};

const inferProductNameFromSnippet = (snippet = '', query = '') => {
  const cleaned = normalizeWhitespace(stripHtml(decodeEntities(snippet)))
    .replace(/₹\s?\d[\d,.]*/g, ' ')
    .replace(/\b(?:mrp|price|discount|buy now|cart|offer)\b/gi, ' ')
    .trim();

  if (!cleaned) {
    return normalizeMedicineQuery(query);
  }

  const tokens = cleaned.split(/\s+/).slice(0, 12);
  return normalizeMedicineQuery(tokens.join(' ')) || normalizeMedicineQuery(query);
};

const hasReadableProductMatch = (productName = '', queryTokens = []) => {
  const normalizedProduct = normalizeMedicineQuery(productName).toLowerCase();

  if (!normalizedProduct) {
    return false;
  }

  if (/(?:qid|keywords|dib|class|href|data|aria|http|www)/i.test(normalizedProduct)) {
    return false;
  }

  const tokenHits = queryTokens.filter((token) => normalizedProduct.includes(token)).length;
  return tokenHits >= Math.min(2, queryTokens.length);
};

const extractTrustedPriceCandidate = (html = '', query = '') => {
  const decoded = decodeEntities(html);
  const queryTokens = tokenizeQuery(query);
  if (queryTokens.length === 0) {
    return null;
  }

  const priceRegex = /₹\s?(\d[\d,]*(?:\.\d{1,2})?)/g;
  const candidates = [];
  let match;

  while ((match = priceRegex.exec(decoded)) && candidates.length < 80) {
    const start = Math.max(0, match.index - 220);
    const end = Math.min(decoded.length, match.index + 220);
    const rawSnippet = decoded.slice(start, end);
    const snippet = normalizeWhitespace(stripHtml(rawSnippet));
    const lowerSnippet = snippet.toLowerCase();
    const tokenHits = queryTokens.filter((token) => lowerSnippet.includes(token)).length;

    if (tokenHits < Math.min(2, queryTokens.length)) {
      continue;
    }

    if (hasSuspiciousPriceSnippet(snippet)) {
      continue;
    }

    const amount = parseInrAmount(match[0]);
    if (!amount) {
      continue;
    }

    const productName = inferProductNameFromSnippet(snippet, query);
    if (!hasReadableProductMatch(productName, queryTokens)) {
      continue;
    }

    candidates.push({
      amount,
      rawPrice: match[0],
      snippet,
      productName,
      score: (tokenHits * 10) - Math.min(Math.abs(80 - snippet.length), 50),
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.amount - right.amount;
  });

  return candidates[0];
};

const detectBlockedResponse = (html = '') => {
  const text = String(html || '');
  return BLOCKED_RESPONSE_PATTERNS.find((entry) => entry.pattern.test(text)) || null;
};

const extractMetaContent = (html = '', attributeName = '', attributeValue = '') => {
  const patterns = [
    new RegExp(`<meta[^>]+${attributeName}=["']${escapeRegExp(attributeValue)}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attributeName}=["']${escapeRegExp(attributeValue)}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = String(html).match(pattern);
    if (match?.[1]) {
      return decodeEntities(match[1]);
    }
  }

  return '';
};

const extractTitleTag = (html = '') => {
  const match = String(html).match(/<title>([^<]+)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1]).trim() : '';
};

const extractPriceFromText = (text = '') => {
  if (!text) {
    return null;
  }

  const rsMatch = String(text).match(/\bat\s+Rs\.?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (rsMatch?.[1]) {
    return {
      amount: Number(rsMatch[1]),
      rawPrice: `Rs.${rsMatch[1]}`,
    };
  }

  const rupeeMatch = String(text).match(/₹\s?([0-9]+(?:\.[0-9]+)?)/i);
  if (rupeeMatch?.[1]) {
    return {
      amount: Number(rupeeMatch[1]),
      rawPrice: `₹${rupeeMatch[1]}`,
    };
  }

  return null;
};

const extractApolloProductCandidates = (html = '', query = '') => {
  const decoded = decodeEntities(
    String(html || '')
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/'),
  );
  const candidateRegex = /"title":"([^"]+)","url":"(https:\/\/www\.apollopharmacy\.in\/[^"]+)"/g;
  const candidates = [];
  let match;

  while ((match = candidateRegex.exec(decoded)) && candidates.length < 40) {
    const title = normalizeMedicineQuery(match[1]);
    const url = match[2];
    const score = scoreTitleMatch(title, query);

    if (!title || !url || score <= 0) {
      continue;
    }

    candidates.push({
      title,
      url,
      score,
    });
  }

  return candidates
    .sort((left, right) => right.score - left.score)
    .filter((candidate, index, array) => array.findIndex((item) => item.url === candidate.url) === index);
};

const extractApolloProductData = (html = '', fallbackUrl = '', fallbackTitle = '') => {
  const ogDescription = extractMetaContent(html, 'property', 'og:description')
    || extractMetaContent(html, 'name', 'twitter:description')
    || extractMetaContent(html, 'name', 'description');
  const ogTitle = extractMetaContent(html, 'property', 'og:title')
    || extractTitleTag(html)
    || fallbackTitle;
  const canonicalUrl = extractMetaContent(html, 'property', 'og:url')
    || extractMetaContent(html, 'name', 'twitter:url')
    || fallbackUrl;
  const priceInfo = extractPriceFromText(ogDescription);

  if (!priceInfo?.amount) {
    return null;
  }

  return {
    price: priceInfo.amount,
    rawPrice: priceInfo.rawPrice,
    productName: normalizeMedicineQuery(
      ogTitle
        .replace(/\s*Price, Uses, Side Effects, Composition.*$/i, '')
        .replace(/\s*\|\s*19 Minutes Delivery.*$/i, '')
        .replace(/^Buy\s+/i, '')
        .replace(/\s+-\s+Apollo Pharmacy.*$/i, '')
        .trim(),
    ) || normalizeMedicineQuery(fallbackTitle),
    url: canonicalUrl || fallbackUrl,
    matchedText: ogDescription,
  };
};

const fetchProviderPage = async (url, { timeoutMs = 12000 } = {}) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: commonFetchHeaders,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  });

  const html = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    html,
  };
};

async function compareApolloProvider(provider, query) {
  const baseResult = buildProviderBaseResult(provider, query);

  try {
    const { ok, status, html } = await fetchProviderPage(baseResult.searchUrl, { timeoutMs: 12000 });

    if (!ok && status >= 400) {
      return {
        ...baseResult,
        status: 'error',
        note: `Provider request failed with status ${status}.`,
      };
    }

    const blockedReason = detectBlockedResponse(html);
    if (blockedReason) {
      return {
        ...baseResult,
        status: 'blocked',
        note: blockedReason.note,
      };
    }

    const candidates = extractApolloProductCandidates(html, query);
    const bestCandidate = candidates[0];

    if (!bestCandidate?.url) {
      return {
        ...baseResult,
        status: 'unavailable',
        note: 'Apollo search loaded, but no closely matching medicine listing could be identified automatically.',
      };
    }

    const productPage = await fetchProviderPage(bestCandidate.url, { timeoutMs: 15000 });
    if (!productPage.ok && productPage.status >= 400) {
      return {
        ...baseResult,
        status: 'error',
        url: bestCandidate.url,
        note: `Matched a product page, but Apollo returned status ${productPage.status} for the product details.`,
      };
    }

    const productData = extractApolloProductData(productPage.html, bestCandidate.url, bestCandidate.title);
    if (!productData) {
      return {
        ...baseResult,
        status: 'unavailable',
        url: bestCandidate.url,
        productName: bestCandidate.title,
        note: 'Apollo matched a product page, but the live product price could not be extracted safely.',
      };
    }

    return {
      ...baseResult,
      status: 'available',
      url: productData.url || bestCandidate.url,
      price: productData.price,
      rawPrice: productData.rawPrice,
      productName: productData.productName || bestCandidate.title,
      matchedText: productData.matchedText,
      note: 'Live price extracted from the Apollo product page.',
    };
  } catch (error) {
    return {
      ...baseResult,
      status: 'error',
      note: `Unable to compare this provider right now: ${error.message}`,
    };
  }
}

const compareSingleProvider = async (provider, query) => {
  if (typeof provider.compare === 'function') {
    return provider.compare(provider, query);
  }

  const baseResult = buildProviderBaseResult(provider, query);

  try {
    const { ok, status, html } = await fetchProviderPage(baseResult.searchUrl);

    if (!ok && status >= 400) {
      return {
        ...baseResult,
        status: 'error',
        note: `Provider request failed with status ${status}.`,
      };
    }

    const blockedReason = detectBlockedResponse(html);
    if (blockedReason) {
      return {
        ...baseResult,
        status: 'blocked',
        note: blockedReason.note,
      };
    }

    const candidate = extractTrustedPriceCandidate(html, query);
    if (!candidate) {
      return {
        ...baseResult,
        status: 'unavailable',
        note: 'Provider page loaded, but no trustworthy live price could be extracted automatically.',
      };
    }

    return {
      ...baseResult,
      status: 'available',
      price: candidate.amount,
      rawPrice: candidate.rawPrice,
      productName: candidate.productName,
      matchedText: candidate.snippet,
      note: 'Live price extracted from the provider search response.',
    };
  } catch (error) {
    return {
      ...baseResult,
      status: 'error',
      note: `Unable to compare this provider right now: ${error.message}`,
    };
  }
};

const extractMedicineNameFromText = (text = '', fallback = '') => {
  const lines = String(text || '')
    .split(/\r?\n+/)
    .map((line) => normalizeMedicineQuery(line))
    .filter(Boolean)
    .slice(0, 20);

  const candidates = [];

  lines.forEach((line, index) => {
    if (!line || line.length < 3 || line.length > 90) {
      return;
    }

    if (MEDICINE_IGNORE_PATTERNS.some((pattern) => pattern.test(line))) {
      return;
    }

    const tokenCount = line.split(/\s+/).length;
    const alphabeticTokenCount = line.split(/\s+/).filter((token) => /[a-z]/i.test(token)).length;

    if (alphabeticTokenCount === 0) {
      return;
    }

    let score = 0;

    if (/\b(?:tablet|capsule|syrup|drops|ointment|cream|gel|injection|suspension|strip|mg|ml|mcg)\b/i.test(line)) {
      score += 10;
    }

    if (/\b\d{2,4}\s?(?:mg|ml|mcg)\b/i.test(line)) {
      score += 8;
    }

    if (!/\b(?:rs|₹)\b/i.test(line)) {
      score += 3;
    }

    score += Math.max(0, 12 - index);
    score += Math.min(tokenCount, 6);

    if (/\d{5,}/.test(line)) {
      score -= 8;
    }

    candidates.push({
      line,
      score,
    });
  });

  if (candidates.length > 0) {
    candidates.sort((left, right) => right.score - left.score);
    return candidates[0].line;
  }

  const fallbackQuery = normalizeMedicineQuery(
    String(fallback || '')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[-_]+/g, ' '),
  );

  return fallbackQuery;
};

const summarizeProviderResults = (providers = []) => {
  const availableProviders = providers
    .filter((provider) => provider.status === 'available' && Number.isFinite(provider.price))
    .sort((left, right) => left.price - right.price);

  return {
    availableCount: availableProviders.length,
    checkedCount: providers.length,
    blockedCount: providers.filter((provider) => provider.status === 'blocked').length,
    unavailableCount: providers.filter((provider) => provider.status === 'unavailable').length,
    cheapest: availableProviders[0]
      ? {
        key: availableProviders[0].key,
        label: availableProviders[0].label,
        provider: availableProviders[0].label,
        price: availableProviders[0].price,
        rawPrice: availableProviders[0].rawPrice,
        url: availableProviders[0].url,
      }
      : null,
    comparedAt: new Date().toISOString(),
  };
};

const compareMedicinePrices = async ({ query }) => {
  const normalizedQuery = normalizeMedicineQuery(query);

  const providers = await Promise.all(
    PRICE_PROVIDERS.map((provider) => compareSingleProvider(provider, normalizedQuery)),
  );

  return {
    query: normalizedQuery,
    providers,
    summary: summarizeProviderResults(providers),
  };
};

module.exports = {
  compareMedicinePrices,
  extractMedicineNameFromText,
};
