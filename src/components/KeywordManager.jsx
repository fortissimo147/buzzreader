import React, { useState } from 'react';

export const COLORS = [
  '#7c6af7', '#f7826a', '#4ade80', '#fb923c',
  '#38bdf8', '#f472b6', '#a78bfa', '#34d399',
];

export function kwColor(kw, keywords) {
  const i = keywords.indexOf(typeof kw === 'string' ? kw : kw.keyword ?? kw);
  return COLORS[Math.max(0, i) % COLORS.length];
}

export default function KeywordManager({ keywords, activeKeyword, fetchingKw, onAdd, onRemove, onSelect }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const kw = input.trim();
    if (!kw || keywords.includes(kw)) return;
    setLoading(true);
    try { await onAdd(kw); setInput(''); }
    finally { setLoading(false); }
  }

  return (
    <aside style={s.sidebar}>
      <div style={s.logo}><span style={s.dot}>●</span> BuzzReader</div>

      <form onSubmit={handleSubmit} style={s.form}>
        <input
          style={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="キーワードを追加..."
          disabled={loading}
        />
        <button style={s.addBtn} type="submit" disabled={loading || !input.trim()}>+</button>
      </form>

      <div style={s.label}>追跡中</div>

      <ul style={s.list}>
        <li style={{ ...s.item, ...(activeKeyword === null ? s.itemActive : {}) }}
            onClick={() => onSelect(null)}>
          <span style={{ ...s.kDot, background: '#5a5d78' }} />
          <span style={s.kLabel}>すべて</span>
        </li>
        {keywords.map(kw => {
          const color = kwColor(kw, keywords);
          const isFetching = fetchingKw === kw;
          return (
            <li key={kw}
                style={{ ...s.item, ...(activeKeyword === kw ? s.itemActive : {}) }}
                onClick={() => onSelect(kw)}>
              <span style={{ ...s.kDot, background: color, opacity: isFetching ? 0.5 : 1 }} />
              <span style={s.kLabel}>{kw}</span>
              {isFetching && <span style={{ fontSize: 10, color: '#7c6af7' }}>…</span>}
              <button style={s.del}
                      onClick={e => { e.stopPropagation(); onRemove(kw); }}>×</button>
            </li>
          );
        })}
      </ul>

      {keywords.length === 0 && (
        <p style={s.hint}>キーワードを追加すると<br />Reddit・HNから収集します</p>
      )}

      <div style={s.sources}>
        <div style={s.sourceItem}><span style={{ color: '#ff6314' }}>●</span> Hacker News</div>
        <div style={s.sourceItem}><span style={{ color: '#ff4500' }}>●</span> Reddit</div>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: 220, flexShrink: 0, background: '#13152a',
    borderRight: '1px solid #1e2035', display: 'flex',
    flexDirection: 'column', padding: '20px 14px', gap: 16, overflowY: 'auto',
  },
  logo: { fontSize: 18, fontWeight: 700, color: '#e2e4f0', display: 'flex', alignItems: 'center', gap: 8 },
  dot: { color: '#7c6af7', fontSize: 12 },
  form: { display: 'flex', gap: 6 },
  input: {
    flex: 1, background: '#1a1d2e', border: '1px solid #2a2d42',
    borderRadius: 8, color: '#e2e4f0', fontSize: 13, padding: '7px 10px',
    outline: 'none', minWidth: 0,
  },
  addBtn: {
    background: '#7c6af7', border: 'none', borderRadius: 8, color: '#fff',
    fontSize: 18, width: 32, height: 32, cursor: 'pointer', flexShrink: 0,
  },
  label: { fontSize: 11, fontWeight: 600, color: '#5a5d78', textTransform: 'uppercase', letterSpacing: '0.08em' },
  list: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 },
  item: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
  itemActive: { background: '#1e2035' },
  kDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  kLabel: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  del: { background: 'none', border: 'none', color: '#5a5d78', cursor: 'pointer', fontSize: 16, padding: 0 },
  hint: { fontSize: 12, color: '#4a4d68', textAlign: 'center', lineHeight: 1.7 },
  sources: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 },
  sourceItem: { fontSize: 11, color: '#4a4d68', display: 'flex', alignItems: 'center', gap: 6 },
};
