async function fetchReddit(keyword) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=25&t=week`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Reddit ${res.status}`);
  const { data } = await res.json();
  return (data?.children ?? []).map(({ data: p }) => ({
    id: `reddit_${p.id}`,
    source: 'reddit',
    keyword,
    title: p.title,
    author: p.author,
    url: `https://reddit.com${p.permalink}`,
    sub: p.subreddit_name_prefixed,
    score: p.score ?? 0,
    comments: p.num_comments ?? 0,
    created_at: new Date(p.created_utc * 1000).toISOString(),
  }));
}

async function fetchHN(keyword) {
  const since = Math.floor((Date.now() - 7 * 86400000) / 1000);
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(keyword)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=25`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN ${res.status}`);
  const data = await res.json();
  return (data.hits ?? []).map(h => ({
    id: `hn_${h.objectID}`,
    source: 'hackernews',
    keyword,
    title: h.title ?? '(no title)',
    author: h.author ?? '',
    url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
    sub: 'Hacker News',
    score: h.points ?? 0,
    comments: h.num_comments ?? 0,
    created_at: new Date(h.created_at_i * 1000).toISOString(),
  }));
}

export async function fetchKeyword(keyword) {
  const [r, h] = await Promise.allSettled([fetchReddit(keyword), fetchHN(keyword)]);
  return [
    ...(r.status === 'fulfilled' ? r.value : []),
    ...(h.status === 'fulfilled' ? h.value : []),
  ];
}
