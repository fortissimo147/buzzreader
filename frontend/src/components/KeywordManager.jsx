import React, { useState } from 'react';
import { addKeyword, removeKeyword } from '../api';

const KEYWORD_COLORS = [
  '#7c6af7', '#f7826a', '#4ade80', '#fb923c',
  '#38bdf8', '#f472b6', '#a78bfa', '#34d399',
];

export function getKeywordColor(keyword, keywords) {
  const idx = keywords.findIndex(k =>
    (typeof k === 'string' ? k : k.keyword) === keyword
  );
  return KEYWORD_COLORS[idx % KEYWORD_COLORS.length];
}

export default function KeywordManager({ keywords, onUpdate, activeKeyword, onSelectKeyword }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    const kw = input.trim();
    if (!kw) return;
    setLoading(true);
    try {
      await addKeyword(kw);
      setInput('');
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(keyword) {
    await removeKeyword(keyword);
    onUpdate();
    if (activeKeyword === keyword) onSelectKeyword(null);
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoMark}>●</span> BuzzReader
      </div>

      <form onSubmit={handleAdd} style={styles.form}>
        <input
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="キーワードを追加..."
          disabled={loading}
        />
        <button style={styles.addBtn} type="submit" disabled={loading || !input.trim()}>
          {loading ? '…' : '+'}
        </button>
      </form>

      <div style={styles.sectionLabel}>追跡中</div>

      <ul style={styles.list}>
        <li
          style={{
            ...styles.item,
            ...(activeKeyword === null ? styles.itemActive : {}),
          }}
          onClick={() => onSelectKeyword(null)}
        >
          <span style={{ ...styles.dot, background: '#8b8ea8' }} />
          <span style={styles.itemLabel}>すべて</span>
        </li>
        {keywords.map(({ keyword }) => {
          const color = getKeywordColor(keyword, keywords);
          const isActive = activeKeyword === keyword;
          return (
            <li
              key={keyword}
              style={{ ...styles.item, ...(isActive ? styles.itemActive : {}) }}
              onClick={() => onSelectKeyword(keyword)}
            >
              <span style={{ ...styles.dot, background: color }} />
              <span style={styles.itemLabel}>{keyword}</span>
              <button
                style={styles.removeBtn}
                onClick={e => { e.stopPropagation(); handleRemove(keyword); }}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      {keywords.length === 0 && (
        <p style={styles.hint}>キーワードを追加すると<br />モニタリングが始まります</p>
      )}
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: '#13152a',
    borderRight: '1px solid #1e2035',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 14px',
    gap: 16,
    overflowY: 'auto',
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e2e4f0',
    letterSpacing: '-0.3px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    color: '#7c6af7',
    fontSize: 12,
  },
  form: {
    display: 'flex',
    gap: 6,
  },
  input: {
    flex: 1,
    background: '#1a1d2e',
    border: '1px solid #2a2d42',
    borderRadius: 8,
    color: '#e2e4f0',
    fontSize: 13,
    padding: '7px 10px',
    outline: 'none',
    minWidth: 0,
  },
  addBtn: {
    background: '#7c6af7',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 18,
    width: 32,
    height: 32,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#5a5d78',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: 4,
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 0.15s',
  },
  itemActive: {
    background: '#1e2035',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  itemLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#5a5d78',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  },
  hint: {
    fontSize: 12,
    color: '#4a4d68',
    textAlign: 'center',
    lineHeight: 1.7,
    marginTop: 8,
  },
};
