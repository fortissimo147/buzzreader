import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getKeywordColor } from './KeywordManager';

const RANGES = [
  { label: '6時間', hours: 6, gran: 'hour' },
  { label: '24時間', hours: 24, gran: 'hour' },
  { label: '7日', hours: 168, gran: 'day' },
];

function formatPeriod(period, gran) {
  if (gran === 'day') return period.slice(5);
  const [, time] = period.split(' ');
  return time ?? period;
}

export default function FrequencyChart({ metrics, keywords, loading, range, onRangeChange }) {
  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.hint}>読み込み中...</p>
      </div>
    );
  }

  if (!metrics || metrics.keywords?.length === 0) {
    return (
      <div style={styles.center}>
        <p style={styles.emptyTitle}>データがありません</p>
        <p style={styles.hint}>キーワードを追加するとグラフが表示されます</p>
      </div>
    );
  }

  const { data, summary } = metrics;
  const gran = RANGES.find(r => r.hours === range.hours)?.gran ?? 'hour';

  const chartData = data.map(row => ({
    ...row,
    _label: formatPeriod(row.period, gran),
  }));

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        {RANGES.map(r => (
          <button
            key={r.hours}
            style={{
              ...styles.rangeBtn,
              ...(range.hours === r.hours ? styles.rangeBtnActive : {}),
            }}
            onClick={() => onRangeChange(r)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2035" />
          <XAxis
            dataKey="_label"
            tick={{ fill: '#5a5d78', fontSize: 11 }}
            axisLine={{ stroke: '#1e2035' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#5a5d78', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1d2e',
              border: '1px solid #2a2d42',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#8b8ea8' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(v) => <span style={{ color: '#8b8ea8' }}>{v}</span>}
          />
          {metrics.keywords.map(kw => (
            <Line
              key={kw}
              type="monotone"
              dataKey={kw}
              stroke={getKeywordColor(kw, keywords)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {summary && (
        <div style={styles.summaryRow}>
          {metrics.keywords.map(kw => {
            const color = getKeywordColor(kw, keywords);
            const s = summary[kw];
            return (
              <div key={kw} style={styles.summaryCard}>
                <div style={{ ...styles.summaryKw, color }}>{kw}</div>
                <div style={styles.summaryNum}>{s.total.toLocaleString()}</div>
                <div style={styles.summaryLabel}>件のツイート</div>
                <div style={styles.summaryMeta}>
                  ♥ {s.totalLikes.toLocaleString()} ⟳ {s.totalRetweets.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    flex: 1,
    overflowY: 'auto',
  },
  controls: {
    display: 'flex',
    gap: 6,
  },
  rangeBtn: {
    background: '#1a1d2e',
    border: '1px solid #2a2d42',
    borderRadius: 20,
    color: '#8b8ea8',
    fontSize: 12,
    padding: '5px 14px',
    cursor: 'pointer',
  },
  rangeBtnActive: {
    background: '#7c6af7',
    border: '1px solid #7c6af7',
    color: '#fff',
  },
  summaryRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  summaryCard: {
    background: '#13152a',
    border: '1px solid #1e2035',
    borderRadius: 12,
    padding: '12px 16px',
    minWidth: 140,
  },
  summaryKw: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  summaryNum: {
    fontSize: 28,
    fontWeight: 700,
    color: '#e2e4f0',
    lineHeight: 1.1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#5a5d78',
    marginTop: 2,
  },
  summaryMeta: {
    fontSize: 12,
    color: '#4a4d68',
    marginTop: 6,
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#4a4d68',
  },
  hint: {
    fontSize: 13,
    color: '#3a3d58',
  },
};
