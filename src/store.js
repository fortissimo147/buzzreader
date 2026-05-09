const K = { keywords: 'br_keywords', posts: 'br_posts' };

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

export const getKeywords = () => load(K.keywords, []);

export function addKeyword(kw) {
  const list = getKeywords();
  if (!list.includes(kw)) localStorage.setItem(K.keywords, JSON.stringify([...list, kw]));
}

export function removeKeyword(kw) {
  localStorage.setItem(K.keywords, JSON.stringify(getKeywords().filter(k => k !== kw)));
}

export const getPosts = () => load(K.posts, []);

export function addPosts(newPosts) {
  const existing = getPosts();
  const ids = new Set(existing.map(p => p.id));
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const merged = [...newPosts.filter(p => !ids.has(p.id)), ...existing]
    .filter(p => p.created_at >= cutoff)
    .slice(0, 2000);
  localStorage.setItem(K.posts, JSON.stringify(merged));
}

export function clearKeywordPosts(kw) {
  localStorage.setItem(K.posts, JSON.stringify(getPosts().filter(p => p.keyword !== kw)));
}
