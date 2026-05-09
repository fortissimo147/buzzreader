const templates = [
  (kw) => `${kw}について調べてみたらすごく興味深い内容だった。もっと知りたい！`,
  (kw) => `最近${kw}の話題をよく見かける。トレンドになってるのかも`,
  (kw) => `${kw}に関する新しい情報が出てきたね。注目している`,
  (kw) => `${kw}って実際どうなんだろう？詳しい人いたら教えてほしい`,
  (kw) => `${kw}のニュース見た？かなり大きな動きがあったみたい`,
  (kw) => `${kw}について専門家の意見が分かれているのが興味深い`,
  (kw) => `${kw}関連の話、もっと広まってほしいな`,
  (kw) => `${kw}を初めて体験したけど、なかなかよかった`,
  (kw) => `${kw}の最新動向をまとめてみた。思ったより複雑だ`,
  (kw) => `${kw}について友人と議論したら盛り上がった`,
];

const names = [
  'tanaka_tech', 'suzuki_info', 'yamamoto_news', 'watanabe_jp',
  'sato_media', 'kobayashi_web', 'ito_digital', 'nakamura_net',
  'kato_online', 'yoshida_buzz', 'hayashi_trend', 'kimura_social',
];

let counter = 0;

function generateTweet(keyword, hoursAgo) {
  const template = templates[Math.floor(Math.random() * templates.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  const createdAt = new Date(Date.now() - hoursAgo * 3600000);
  const uid = `u${Math.floor(Math.random() * 9000) + 1000}`;

  counter++;
  return {
    id: `mock_${keyword}_${Date.now()}_${counter}_${Math.random().toString(36).slice(2, 7)}`,
    keyword,
    text: template(keyword),
    author_id: uid,
    author_name: name,
    created_at: createdAt.toISOString(),
    like_count: Math.floor(Math.random() * 300),
    retweet_count: Math.floor(Math.random() * 80),
    reply_count: Math.floor(Math.random() * 40),
  };
}

function generateHistoricalTweets(keyword, count = 60) {
  return Array.from({ length: count }, (_, i) => {
    const hoursAgo = (i / count) * 24;
    const jitter = (Math.random() - 0.5) * (24 / count);
    return generateTweet(keyword, Math.max(0, hoursAgo + jitter));
  });
}

function generateRecentTweets(keyword, count = 5) {
  return Array.from({ length: count }, () =>
    generateTweet(keyword, Math.random() * 0.5)
  );
}

module.exports = { generateHistoricalTweets, generateRecentTweets };
