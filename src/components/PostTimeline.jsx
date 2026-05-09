import React from 'react';
import { kwColor } from './KeywordManager';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}秒前`;
  if (s < 3600) return `${Math.floor(s / 60)}分前`;
  if (s < 86400) return `${Math.floor(s / 3600)}時間前`;
  return `${Math.floor(s / 86400)}日前`;
}

const SOURCE = {
  gnews:   { label: 'Google News', color: '#4285f4', bg: '#141e35' },
  qiita:   { label: 'Qiita',       color: '#55c500', bg: '#14251a' },
  threads: { label: 'Threads',     color: '#a855f7', bg: '#1e1428' },
};

function PostCard({ post, keywords }) {
  const src = SOURCE[post.source] ?? SOURCE.gnews;
  const color = kwColor(post.keyword, keywords);
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <span style={{ ...s.srcBadge, color: src.color, background: src.bg }}>{src.label}</span>
        <span style={s.author}>@{post.author}</span>
        <span style={s.time}>{timeAgo(post.created_at)}</span>
        <span style={{ ...s.kwTag, borderColor: color, color }}>{post.keyword}</span>
      </div>
      <a href={post.url} target="_blank" rel="noopener noreferrer" style={s.title}>
        {post.title}
      </a>
      {post.sub && <span style={s.sub}>{post.sub}</span>}
      {(post.score > 0 || post.comments > 0) && (
        <div style={s.stats}>
          {post.score > 0 && <span style={s.stat}>♥ {post.score.toLocaleString()}</span>}
          {post.comments > 0 && <span style={s.stat}>💬 {post.comments.toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
}

export default function PostTimeline({ posts, keywords }) {
  if (posts.length === 0) {
    return (
      <div style={s.empty}>
        <p style={s.emptyTitle}>投稿がありません</p>
        <p style={s.emptyHint}>キーワードを追加すると Google News・Qiita から収集します</p>
      </div>
    );
  }
  return (
    <div style={s.list}>
      {posts.map(p => <PostCard key={p.id} post={p} keywords={keywords} />)}
    </div>
  );
}

const s = {
  list: { display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 20px', overflowY: 'auto', flex: 1 },
  card: { background: '#13152a', border: '1px solid #1e2035', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  cardHead: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  srcBadge: { fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '1px 6px' },
  author: { fontSize: 12, color: '#5a5d78' },
  time: { fontSize: 12, color: '#4a4d68', flex: 1 },
  kwTag: { fontSize: 11, border: '1px solid', borderRadius: 20, padding: '1px 8px', fontWeight: 600 },
  title: { fontSize: 14, color: '#c0c4e0', lineHeight: 1.5, textDecoration: 'none', wordBreak: 'break-word' },
  sub: { fontSize: 11, color: '#4a4d68' },
  stats: { display: 'flex', gap: 16 },
  stat: { fontSize: 12, color: '#5a5d78' },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#4a4d68' },
  emptyHint: { fontSize: 13, color: '#3a3d58' },
};
