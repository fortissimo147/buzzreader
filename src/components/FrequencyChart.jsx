import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { kwColor, COLORS } from './KeywordManager';

const RANGES = [
  { label: '6時間', hours: 6 },
  { label: '24時間', hours: 24 },
  { label: '7日', hours: 168 },
];

function buildChartData(posts, keywords, hours) {
  const gran = hours <= 24 ? 'hour' : 'day';
  const bucketCount = gran === 'hour' ? hours : Math.ceil(hours / 24);
  const now = new Date();

  const buckets = {};
  for (let i = bucketCount - 1; i >= 0; i--) {
    const d = new Date(now);
    let key, label;
    if (gran === 'hour') {
      d.setHours(d.getHours() - i, 0, 0, 0);
      key = d.toISOString().slice(0, 13);
      label = `${String(d.getHours()).padStart(2, '0')}:00`;
    } else {
      d.setDate(d.getDate() - i);
      key = d.toISOString().slice(0, 10);
      label = key.slice(5);
    }
    buckets[key] = { _label: label };
    keywords.forEach(kw => { buckets[key][kw] = 0; });
  }

  const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
  for (const p of posts) {
    if (p.created_at < cutoff) continue;
    const key = gran === 'hour'
      ? p.created_at.slice(0, 13)
      : p.created_at.slice(0, 10);
    if (buckets[key] && keywords.includes(p.keyword)) {
      buckets[key][p.keyword]++;
    }
  }

  return Object.values(buckets);
}

function buildSummary(posts, keywords, hours) {
  const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
  const filtered = posts.filter(p => p.created_at >= cutoff);
  return Object.fromEntries(keywords.map(kw => {
    const kPosts = filtered.filter(p => p.keyword === kw);
    return [kw, {
      total: kPosts.length,
      score: kPosts.reduce((s, p) => s + p.score, 0),
    }];
  }));
}

export default function FrequencyChart({ posts, keywords, range, onRangeChange }) {
  if (!keywords.length) {
    return (
      <div style={s.center}>
        <p style={s.emptyTitle}>データがありません</p>
        <p style={s.hint}>キーワードを追加するとグラフが表示されます</p>
      </div>
    );
  }

  const data = buildChartData(posts, keywords, range.hours);
  const summary = buildSummary(posts, keywords, range.hours);

  return (
    <div style={s.wrapper}>
      <div style={s.controls}>
        {RANGES.map(r => (
          <button
            key={r.hours}
            style={{ ...s.rangeBtn, ...(range.hours === r.hours ? s.rangeBtnActive : {}) }}
            onClick={() => onRangeChange(r)}
          >{r.label}</button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2035" />
          <XAxis dataKey="_label" tick={{ fill: '#5a5d78', fontSize: 11 }}
                 axisLine={{ stroke: '#1e2035' }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#5a5d78', fontSize: 11 }} axisLine={false}
                 tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2d42', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#8b8ea8' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  formatter={v => <span style={{ color: '#8b8ea8' }}>{v}</span>} />
          {keywords.map(kw => (
            <Line key={kw} type="monotone" dataKey={kw}
                  stroke={kwColor(kw, keywords)} strokeWidth={2}
                  dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div style={s.summaryRow}>
        {keywords.map((kw, i) => (
          <div key={kw} style={s.card}>
            <div style={{ ...s.cardKw, color: COLORS[i % COLORS.length] }}>{kw}</div>
            <div style={s.cardNum}>{summary[kw]?.total ?? 0}</div>
            <div style={s.cardLabel}>件の投稿</div>
            <div style={s.cardMeta}>▲ {(summary[kw]?.score ?? 0).toLocaleString()} pt</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrapper: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' },
  controls: { display: 'flex', gap: 6 },
  rangeBtn: {
    background: '#1a1d2e', border: '1px solid #2a2d42', borderRadius: 20,
    color: '#8b8ea8', fontSize: 12, padding: '5px 14px', cursor: 'pointer',
  },
  rangeBtnActive: { background: '#7c6af7', border: '1px solid #7c6af7', color: '#fff' },
  summaryRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  card: { background: '#13152a', border: '1px solid #1e2035', borderRadius: 12, padding: '12px 16px', minWidth: 130 },
  cardKw: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  cardNum: { fontSize: 28, fontWeight: 700, color: '#e2e4f0', lineHeight: 1.1 },
  cardLabel: { fontSize: 11, color: '#5a5d78', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#4a4d68', marginTop: 6 },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#4a4d68' },
  hint: { fontSize: 13, color: '#3a3d58' },
};
