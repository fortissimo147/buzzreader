// Cloudflare Worker — Threads API プロキシ
// デプロイ手順:
//   1. cloudflare.com で Workers & Pages → Create Application → Create Worker
//   2. このコードを貼り付けて Save and Deploy
//   3. Settings → Variables → Secret で THREADS_TOKEN を追加

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const allowed = [
      'https://fortissimo147.github.io',
      'http://localhost:3000',
      'http://localhost:3002',
    ];
    const corsOrigin = allowed.includes(origin) ? origin : allowed[0];
    const cors = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    if (!q) {
      return Response.json({ error: 'q parameter required' }, { status: 400, headers: cors });
    }

    if (!env.THREADS_TOKEN) {
      return Response.json({ error: 'THREADS_TOKEN not configured' }, { status: 500, headers: cors });
    }

    try {
      const res = await fetch(
        `https://graph.threads.net/v1.0/threads/search` +
        `?q=${encodeURIComponent(q)}` +
        `&fields=id,text,timestamp,username,like_count,reply_count` +
        `&limit=25` +
        `&access_token=${env.THREADS_TOKEN}`
      );
      const data = await res.json();
      return Response.json(data, { headers: cors });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500, headers: cors });
    }
  },
};
