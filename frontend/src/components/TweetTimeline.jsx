import React from 'react';
import { getKeywordColor } from './KeywordManager';

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

function TweetCard({ tweet, keywords }) {
  const color = getKeywordColor(tweet.keyword, keywords);
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.author}>@{tweet.author_name || tweet.author_id}</span>
        <span style={styles.time}>{timeAgo(tweet.created_at)}</span>
        <span style={{ ...styles.tag, borderColor: color, color }}>
          {tweet.keyword}
        </span>
      </div>
      <p style={styles.text}>{tweet.text}</p>
      <div style={styles.stats}>
        <span style={styles.stat}>♥ {tweet.like_count.toLocaleString()}</span>
        <span style={styles.stat}>⟳ {tweet.retweet_count.toLocaleString()}</span>
        <span style={styles.stat}>💬 {tweet.reply_count.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function TweetTimeline({ tweets, keywords, loading }) {
  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>読み込み中...</p>
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div style={styles.center}>
        <p style={styles.emptyTitle}>ツイートがありません</p>
        <p style={styles.emptyHint}>キーワードを追加するとツイートが表示されます</p>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {tweets.map(tweet => (
        <TweetCard key={tweet.id} tweet={tweet} keywords={keywords} />
      ))}
    </div>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
  },
  card: {
    background: '#13152a',
    border: '1px solid #1e2035',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  author: {
    fontSize: 13,
    fontWeight: 600,
    color: '#8b8ea8',
  },
  time: {
    fontSize: 12,
    color: '#5a5d78',
    flex: 1,
  },
  tag: {
    fontSize: 11,
    border: '1px solid',
    borderRadius: 20,
    padding: '1px 8px',
    fontWeight: 600,
  },
  text: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#d0d2e8',
  },
  stats: {
    display: 'flex',
    gap: 16,
  },
  stat: {
    fontSize: 12,
    color: '#5a5d78',
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#5a5d78',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #2a2d42',
    borderTopColor: '#7c6af7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    color: '#5a5d78',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#4a4d68',
  },
  emptyHint: {
    fontSize: 13,
    color: '#3a3d58',
  },
};
