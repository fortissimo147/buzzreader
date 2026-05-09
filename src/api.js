const CORS = 'https://corsproxy.io/?';

async function fetchGoogleNewsJP(keyword) {
  const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ja&gl=JP&ceid=JP:ja`;
  const res = await fetch(CORS + encodeURIComponent(feed));
  if (!res.ok) throw new Error(`Google News ${res.status}`);
  const xml = new DOMParser().parseFromString(await res.text(), 'application/xml');
  return [...xml.querySelectorAll('item')].map(item => {
    const link = item.querySelector('link')?.textContent ?? '';
    const pub = item.querySelector('pubDate')?.textContent ?? '';
    const source = item.querySelector('source')?.textContent ?? 'Google News';
    return {
      id: `gnews_${btoa(encodeURIComponent(link)).slice(0, 20)}`,
      source: 'gnews',
      keyword,
      title: item.querySelector('title')?.textContent?.replace(/\s*-\s*[^-]+$/, '') ?? '',
      author: source,
      url: link,
      sub: source,
      score: 0,
      comments: 0,
      created_at: pub ? new Date(pub).toISOString() : new Date().toISOString(),
    };
  });
}

async function fetchQiita(keyword) {
  const res = await fetch(
    `https://qiita.com/api/v2/items?query=${encodeURIComponent(keyword)}&per_page=20`
  );
  if (!res.ok) throw new Error(`Qiita ${res.status}`);
  return (await res.json()).map(item => ({
    id: `qiita_${item.id}`,
    source: 'qiita',
    keyword,
    title: item.title,
    author: item.user?.id ?? '',
    url: item.url,
    sub: 'Qiita',
    score: item.likes_count ?? 0,
    comments: item.comments_count ?? 0,
    created_at: item.created_at,
  }));
}

export async function fetchKeyword(keyword) {
  const [g, q] = await Promise.allSettled([
    fetchGoogleNewsJP(keyword),
    fetchQiita(keyword),
  ]);
  return [
    ...(g.status === 'fulfilled' ? g.value : []),
    ...(q.status === 'fulfilled' ? q.value : []),
  ];
}

export async function fetchYouTube(keyword, apiKey) {
  const url = 'https://www.googleapis.com/youtube/v3/search'
    + `?part=snippet&q=${encodeURIComponent(keyword)}`
    + `&type=video&order=date&maxResults=15`
    + `&regionCode=JP&relevanceLanguage=ja`
    + `&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.items ?? []).map(item => ({
    id: `yt_${item.id.videoId}`,
    source: 'youtube',
    keyword,
    title: item.snippet.title,
    author: item.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    sub: item.snippet.description?.slice(0, 120) ?? '',
    score: 0,
    comments: 0,
    created_at: item.snippet.publishedAt,
  }));
}

export async function fetchThreads(keyword, workerUrl) {
  const res = await fetch(`${workerUrl}?q=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error(`Threads worker ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return (data.data ?? []).map(t => ({
    id: `threads_${t.id}`,
    source: 'threads',
    keyword,
    title: (t.text ?? '').slice(0, 280),
    author: t.username ?? '',
    url: `https://www.threads.net/t/${t.id}`,
    sub: 'Threads',
    score: t.like_count ?? 0,
    comments: t.reply_count ?? 0,
    created_at: t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString(),
  }));
}
