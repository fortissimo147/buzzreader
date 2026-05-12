import React from 'react';

function trafficColor(traffic) {
  if (!traffic) return '#5a5d78';
  if (traffic.includes('M')) return '#f7826a';
  const n = parseInt(traffic);
  if (n >= 500) return '#fb923c';
  if (n >= 100) return '#fbbf24';
  return '#8b8ea8';
}

export default function TrendingPanel({ trends, trendFetching, hasCompanies }) {
  if (!hasCompanies) {
    return (
      <div style={s.empty}>
        <p style={s.emptyTitle}>企業リストが未設定です</p>
        <p style={s.emptyHint}>⚙ 設定 → 「東証企業リスト」に企業名を貼り付けてください</p>
      </div>
    );
  }

  if (trendFetching && trends.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyTitle}>トレンドを取得中...</p>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyTitle}>該当企業のトレンドなし</p>
        <p style={s.emptyHint}>現在の日本トレンドに登録企業は含まれていません</p>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.list}>
        {trends.map((t, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardHead}>
              <span style={s.rank}>#{t.rank}</span>
              <span style={s.trendTitle}>{t.title}</span>
              <span style={{ ...s.traffic, color: trafficColor(t.traffic) }}>
                {t.traffic || '–'}
              </span>
            </div>
            <div style={s.companies}>
              {t.matchedCompanies.map((c, j) => (
                <span key={j} style={s.companyTag}>{c}</span>
              ))}
            </div>
            {t.newsItems.length > 0 && (
              <div style={s.articles}>
                {t.newsItems.slice(0, 2).map((n, j) => (
                  <a key={j} href={n.url} target="_blank" rel="noopener noreferrer" style={s.article}>
                    📰 {n.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  container: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#13152a', border: '1px solid #1e2035', borderRadius: 12,
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 10 },
  rank: { fontSize: 12, color: '#5a5d78', fontWeight: 700, minWidth: 28, flexShrink: 0 },
  trendTitle: { fontSize: 15, fontWeight: 600, color: '#e2e4f0', flex: 1 },
  traffic: { fontSize: 12, fontWeight: 700, flexShrink: 0 },
  companies: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  companyTag: {
    fontSize: 11, background: '#1e2035', color: '#7c6af7',
    border: '1px solid #3a2d6a', borderRadius: 20, padding: '2px 10px', fontWeight: 600,
  },
  articles: { display: 'flex', flexDirection: 'column', gap: 4 },
  article: {
    fontSize: 12, color: '#8b8ea8', textDecoration: 'none',
    lineHeight: 1.5, wordBreak: 'break-word',
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#4a4d68' },
  emptyHint: { fontSize: 13, color: '#3a3d58', textAlign: 'center', padding: '0 20px' },
};
