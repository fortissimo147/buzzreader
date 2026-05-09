import React, { useState, useEffect, useCallback } from 'react';
import KeywordManager from './components/KeywordManager';
import PostTimeline from './components/PostTimeline';
import FrequencyChart from './components/FrequencyChart';
import AlertSettings from './components/AlertSettings';
import { getKeywords, addKeyword, removeKeyword, getPosts, addPosts, clearKeywordPosts, getSettings } from './store';
import { fetchKeyword, fetchThreads } from './api';
import { checkAndSendAlerts } from './emailAlert';

const POLL_MS = 5 * 60 * 1000;

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

  const refresh = useCallback(() => setPosts(getPosts()), []);

  const fetchAll = useCallback(async (kws) => {
    if (!kws.length) return;
    const { threadsEnabled, threadsWorkerUrl } = getSettings();

    for (const kw of kws) {
      setFetchingKw(kw);
      try {
        const sources = [fetchKeyword(kw)];
        if (threadsEnabled && threadsWorkerUrl) {
          sources.push(fetchThreads(kw, threadsWorkerUrl));
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

  async function handleAdd(kw) {
    addKeyword(kw);
    setKeywords(getKeywords());
    setFetchingKw(kw);
    try {
      const { threadsEnabled, threadsWorkerUrl } = getSettings();
      const sources = [fetchKeyword(kw)];
      if (threadsEnabled && threadsWorkerUrl) sources.push(fetchThreads(kw, threadsWorkerUrl));
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

  const displayed = activeKeyword ? posts.filter(p => p.keyword === activeKeyword) : posts;

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
            {['タイムライン', '頻度チャート'].map((tab, i) => (
              <button key={tab}
                style={{ ...s.tab, ...(activeTab === i ? s.tabActive : {}) }}
                onClick={() => setActiveTab(i)}
              >{tab}</button>
            ))}
          </div>
          <div style={s.meta}>
            {fetchingKw && <span style={s.pulse}>● {fetchingKw} 取得中</span>}
            {!fetchingKw && lastFetched && <span style={s.metaText}>{timeAgo(lastFetched)} 更新</span>}
            <span style={s.badge}>{displayed.length} 件</span>
            <button style={s.iconBtn} onClick={() => setShowSettings(true)} title="設定">⚙</button>
          </div>
        </header>
        <div style={s.content}>
          {activeTab === 0
            ? <PostTimeline posts={displayed} keywords={keywords} />
            : <FrequencyChart posts={posts} keywords={keywords} range={range} onRangeChange={setRange} />
          }
        </div>
      </div>
      {showSettings && <AlertSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

const s = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #1e2035', height: 52, flexShrink: 0 },
  tabs: { display: 'flex', gap: 4 },
  tab: { background: 'none', border: 'none', color: '#5a5d78', fontSize: 14, fontWeight: 500, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' },
  tabActive: { background: '#1e2035', color: '#e2e4f0' },
  meta: { display: 'flex', alignItems: 'center', gap: 10 },
  pulse: { fontSize: 12, color: '#7c6af7' },
  metaText: { fontSize: 12, color: '#4a4d68' },
  badge: { fontSize: 11, background: '#1e2035', color: '#8b8ea8', borderRadius: 20, padding: '2px 10px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px', borderRadius: 8, opacity: 0.7, color: '#e2e4f0' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
};
