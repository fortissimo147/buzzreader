const K = { keywords: 'br_keywords', posts: 'br_posts', settings: 'br_settings' };

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
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
  const merged = [...newPosts.filter(p => !ids.has(p.id)), ...existing]
    .filter(p => p.created_at >= cutoff)
    .slice(0, 10000);
  localStorage.setItem(K.posts, JSON.stringify(merged));
}

export function clearKeywordPosts(kw) {
  localStorage.setItem(K.posts, JSON.stringify(getPosts().filter(p => p.keyword !== kw)));
}

const DEFAULT_SETTINGS = {
  threadsWorkerUrl: '', threadsEnabled: false,
  youtubeApiKey: '', youtubeEnabled: false,
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...load(K.settings, {}) };
}

export function saveSettings(s) {
  localStorage.setItem(K.settings, JSON.stringify(s));
}
