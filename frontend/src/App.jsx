import React, { useState, useEffect, useCallback } from 'react';
import KeywordManager from './components/KeywordManager';
import TweetTimeline from './components/TweetTimeline';
import FrequencyChart from './components/FrequencyChart';
import { getStatus, getKeywords, getTweets, getMetrics } from './api';

const TABS = ['タイムライン', '頻度チャート'];
const REFRESH_INTERVAL = 30000;

export default function App() {
  const [keywords, setKeywords] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState(null);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [range, setRange] = useState({ label: '24時間', hours: 24, gran: 'hour' });

  const loadKeywords = useCallback(async () => {
    const kws = await getKeywords();
    setKeywords(kws);
    return kws;
  }, []);

  const loadTweets = useCallback(async (keyword) => {
    setTweetsLoading(true);
    try {
      const params = { limit: 60 };
      if (keyword) params.keyword = keyword;
      const data = await getTweets(params);
      setTweets(data);
      setLastRefreshed(new Date());
    } finally {
      setTweetsLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const data = await getMetrics({ hours: range.hours, granularity: range.gran ?? 'hour' });
      setMetrics(data);
    } finally {
      setMetricsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    getStatus().then(setStatus).catch(() => {});
    loadKeywords();
  }, [loadKeywords]);

  useEffect(() => {
    loadTweets(activeKeyword);
    loadMetrics();
  }, [activeKeyword, loadTweets, loadMetrics]);

  useEffect(() => {
    const id = setInterval(() => {
      loadTweets(activeKeyword);
      loadMetrics();
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [activeKeyword, loadTweets, loadMetrics]);

  function handleRangeChange(newRange) {
    setRange(newRange);
  }

  function formatLastRefresh(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 5) return '今しがた';
    if (diff < 60) return `${diff}秒前`;
    return `${Math.floor(diff / 60)}分前`;
  }

  return (
    <div style={styles.root}>
      <KeywordManager
        keywords={keywords}
        onUpdate={loadKeywords}
        activeKeyword={activeKeyword}
        onSelectKeyword={kw => { setActiveKeyword(kw); }}
      />

      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.tabs}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(activeTab === i ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={styles.headerRight}>
            {status && (
              <span style={{
                ...styles.modeBadge,
                background: status.mode === 'demo' ? '#1a2a1a' : '#1a1a2a',
                color: status.mode === 'demo' ? '#4ade80' : '#7c6af7',
                borderColor: status.mode === 'demo' ? '#2a4a2a' : '#3a2a5a',
              }}>
                {status.mode === 'demo' ? '● デモ' : '● Live'}
              </span>
            )}
            {lastRefreshed && (
              <span style={styles.lastRefresh}>
                更新: {formatLastRefresh(lastRefreshed)}
              </span>
            )}
          </div>
        </header>

        <div style={styles.content}>
          {activeTab === 0 ? (
            <TweetTimeline tweets={tweets} keywords={keywords} loading={tweetsLoading} />
          ) : (
            <FrequencyChart
              metrics={metrics}
              keywords={keywords}
              loading={metricsLoading}
              range={range}
              onRangeChange={handleRangeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    borderBottom: '1px solid #1e2035',
    height: 52,
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    background: 'none',
    border: 'none',
    color: '#5a5d78',
    fontSize: 14,
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  tabActive: {
    background: '#1e2035',
    color: '#e2e4f0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  modeBadge: {
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid',
    borderRadius: 20,
    padding: '3px 10px',
  },
  lastRefresh: {
    fontSize: 12,
    color: '#4a4d68',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};
