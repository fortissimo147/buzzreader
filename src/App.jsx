import React, { useState, useEffect, useCallback } from 'react';
import KeywordManager from './components/KeywordManager';
import PostTimeline from './components/PostTimeline';
import FrequencyChart from './components/FrequencyChart';
import TrendingPanel from './components/TrendingPanel';
import AlertSettings from './components/AlertSettings';
import { getKeywords, addKeyword, removeKeyword, getPosts, addPosts, clearKeywordPosts, getSettings, getCompanies } from './store';
import { fetchKeyword, fetchThreads, fetchYouTube, fetchTrendingJP } from './api';
import { checkAndSendAlerts } from './emailAlert';

const POLL_MS = 5 * 60 * 1000;

const SUFFIX_RE = /株式会社|有限会社|合同会社|ホールディングス|ホールディング|グループ/g;

function matchTrends(rawTrends, companies) {
  if (!companies.length) return [];
  const normalized = companies.map(c => ({
    original: c,
    norm: c.replace(SUFFIX_RE, '').trim(),
  })).filter(c => c.norm.length >= 2);

  return rawTrends.flatMap(trend => {
    const matched = normalized
      .filter(c => trend.title.includes(c.norm) || c.norm.includes(trend.title))
      .map(c => c.original);
    return matched.length > 0 ? [{ ...trend, matchedCompanies: matched }] : [];
  });
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}秒前`;
  if (s < 3600) return `${Math.floor(s / 60)}分前`;
  return `${Math.floor(s / 3600)}時間前`;
}

export default function App() {
  const [keywords, setKeywords] = useState(getKeywords);
  const [posts, setPosts] = useState(getPosts);
  const [fetchingKw, setFetchingKw] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [range, setRange] = useState({ label: '24時間', hours: 24, gran: 'hour' });
  const [showSettings, setShowSettings] = useState(false);
  const [trends, setTrends] = useState([]);
  const [trendFetching, setTrendFetching] = useState(false);

  const refresh = useCallback(() => setPosts(getPosts()), []);

  const refreshTrends = useCallback(async () => {
    const companies = getCompanies();
    if (!companies.length) return;
    setTrendFetching(true);
    try {
      const raw = await fetchTrendingJP();
      setTrends(matchTrends(raw, companies));
    } catch (e) {
      console.error('Trends fetch error:', e);
    } finally {
      setTrendFetching(false);
    }
  }, []);

  const fetchAll = useCallback(async (kws) => {
    if (!kws.length) return;
    const { threadsEnabled, threadsWorkerUrl, youtubeEnabled, youtubeApiKey } = getSettings();

    for (const kw of kws) {
      setFetchingKw(kw);
      try {
        const sources = [fetchKeyword(kw)];
        if (threadsEnabled && threadsWorkerUrl) {
          sources.push(fetchThreads(kw, threadsWorkerUrl));
        }
        if (youtubeEnabled && youtubeApiKey) {
          sources.push(fetchYouTube(kw, youtubeApiKey));
        }
        const results = await Promise.allSettled(sources);
        results.forEach(r => { if (r.status === 'fulfilled') addPosts(r.value); });
        refresh();
      } catch (e) {
        console.error(e);
      }
    }
    setFetchingKw(null);
    setLastFetched(new Date());
    checkAndSendAlerts(getPosts(), kws).catch(console.error);
  }, [refresh]);

  useEffect(() => {
    const kws = getKeywords();
    if (kws.length) fetchAll(kws);
    const id = setInterval(() => fetchAll(getKeywords()), POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    refreshTrends();
    const id = setInterval(refreshTrends, POLL_MS);
    return () => clearInterval(id);
  }, [refreshTrends]);

  async function handleAdd(kw) {
    addKeyword(kw);
    setKeywords(getKeywords());
    setFetchingKw(kw);
    try {
      const { threadsEnabled, threadsWorkerUrl, youtubeEnabled, youtubeApiKey } = getSettings();
      const sources = [fetchKeyword(kw)];
      if (threadsEnabled && threadsWorkerUrl) sources.push(fetchThreads(kw, threadsWorkerUrl));
      if (youtubeEnabled && youtubeApiKey) sources.push(fetchYouTube(kw, youtubeApiKey));
      const results = await Promise.allSettled(sources);
      results.forEach(r => { if (r.status === 'fulfilled') addPosts(r.value); });
      refresh();
    } finally {
      setFetchingKw(null);
      setLastFetched(new Date());
    }
  }

  function handleRemove(kw) {
    removeKeyword(kw);
    clearKeywordPosts(kw);
    setKeywords(getKeywords());
    refresh();
    if (activeKeyword === kw) setActiveKeyword(null);
  }

  function handleSettingsClose() {
    setShowSettings(false);
    refreshTrends();
  }

  const displayed = activeKeyword ? posts.filter(p => p.keyword === activeKeyword) : posts;
  const hasCompanies = getCompanies().length > 0;

  return (
    <div style={s.root}>
      <KeywordManager
        keywords={keywords}
        activeKeyword={activeKeyword}
        fetchingKw={fetchingKw}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onSelect={setActiveKeyword}
      />
      <div style={s.main}>
        <header style={s.header}>
          <div style={s.tabs}>
            {['タイムライン', '頻度チャート', 'トレンド'].map((tab, i) => (
              <button key={tab}
                style={{ ...s.tab, ...(activeTab === i ? s.tabActive : {}) }}
                onClick={() => setActiveTab(i)}
              >
                {tab}
                {i === 2 && trends.length > 0 && (
                  <span style={s.trendBadge}>{trends.length}</span>
                )}
              </button>
            ))}
          </div>
          <div style={s.meta}>
            {fetchingKw && <span style={s.pulse}>● {fetchingKw} 取得中</span>}
            {trendFetching && activeTab === 2 && <span style={s.pulse}>● トレンド更新中</span>}
            {!fetchingKw && !trendFetching && lastFetched && (
              <span style={s.metaText}>{timeAgo(lastFetched)} 更新</span>
            )}
            {activeTab !== 2 && <span style={s.badge}>{displayed.length} 件</span>}
            <button style={s.iconBtn} onClick={() => setShowSettings(true)} title="設定">⚙</button>
          </div>
        </header>
        <div style={s.content}>
          {activeTab === 0 && <PostTimeline posts={displayed} keywords={keywords} />}
          {activeTab === 1 && <FrequencyChart posts={posts} keywords={keywords} range={range} onRangeChange={setRange} />}
          {activeTab === 2 && <TrendingPanel trends={trends} trendFetching={trendFetching} hasCompanies={hasCompanies} />}
        </div>
      </div>
      {showSettings && <AlertSettings onClose={handleSettingsClose} />}
    </div>
  );
}

const s = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #1e2035', height: 52, flexShrink: 0 },
  tabs: { display: 'flex', gap: 4 },
  tab: { background: 'none', border: 'none', color: '#5a5d78', fontSize: 14, fontWeight: 500, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  tabActive: { background: '#1e2035', color: '#e2e4f0' },
  trendBadge: { fontSize: 10, background: '#f7826a', color: '#fff', borderRadius: 20, padding: '0 5px', fontWeight: 700 },
  meta: { display: 'flex', alignItems: 'center', gap: 10 },
  pulse: { fontSize: 12, color: '#7c6af7' },
  metaText: { fontSize: 12, color: '#4a4d68' },
  badge: { fontSize: 11, background: '#1e2035', color: '#8b8ea8', borderRadius: 20, padding: '2px 10px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px', borderRadius: 8, opacity: 0.7, color: '#e2e4f0' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
};
