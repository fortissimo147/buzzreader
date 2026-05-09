const { TwitterApi } = require('twitter-api-v2');

let client;

function getClient() {
  if (!client) {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (!token) throw new Error('TWITTER_BEARER_TOKEN not set');
    client = new TwitterApi(token);
  }
  return client.readOnly;
}

async function searchTweets(keyword) {
  const api = getClient();

  const response = await api.v2.search({
    query: `${keyword} -is:retweet`,
    max_results: 100,
    'tweet.fields': 'created_at,public_metrics,author_id',
    'user.fields': 'name,username',
    expansions: 'author_id',
  });

  const users = {};
  for (const user of response.includes?.users ?? []) {
    users[user.id] = user;
  }

  return (response.data ?? []).map(tweet => ({
    id: tweet.id,
    keyword,
    text: tweet.text,
    author_id: tweet.author_id,
    author_name: users[tweet.author_id]?.name ?? '',
    created_at: tweet.created_at,
    like_count: tweet.public_metrics?.like_count ?? 0,
    retweet_count: tweet.public_metrics?.retweet_count ?? 0,
    reply_count: tweet.public_metrics?.reply_count ?? 0,
  }));
}

module.exports = { searchTweets };
