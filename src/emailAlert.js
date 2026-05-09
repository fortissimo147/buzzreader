import emailjs from '@emailjs/browser';

const KEY = 'br_alert';

const DEFAULT = {
  enabled: false,
  recipientEmail: '',
  threshold: 30,
  serviceId: '',
  templateId: '',
  publicKey: '',
  lastAlerted: {},
};

export function getAlertSettings() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; }
  catch { return { ...DEFAULT }; }
}

export function saveAlertSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export async function sendTestEmail(settings) {
  await emailjs.send(
    settings.serviceId,
    settings.templateId,
    {
      keyword: 'テスト',
      today_count: 10,
      avg_count: '7.5',
      increase_percent: 33,
      to_email: settings.recipientEmail,
    },
    { publicKey: settings.publicKey }
  );
}

export async function checkAndSendAlerts(posts, keywords) {
  const settings = getAlertSettings();
  if (
    !settings.enabled ||
    !settings.recipientEmail ||
    !settings.serviceId ||
    !settings.templateId ||
    !settings.publicKey
  ) return;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeMonthsAgo = new Date(now.getTime() - 90 * 86400000);

  for (const keyword of keywords) {
    const kwPosts = posts.filter(p => p.keyword === keyword);

    const todayPosts = kwPosts.filter(p => new Date(p.created_at) >= todayStart);
    const historicalPosts = kwPosts.filter(p => {
      const d = new Date(p.created_at);
      return d >= threeMonthsAgo && d < todayStart;
    });

    if (historicalPosts.length === 0) continue;

    const oldest = new Date(Math.min(...historicalPosts.map(p => new Date(p.created_at).getTime())));
    if (todayStart - oldest < 7 * 86400000) continue;

    const daysOfData = Math.max(1, (todayStart.getTime() - threeMonthsAgo.getTime()) / 86400000);
    const dailyAvg = historicalPosts.length / daysOfData;
    if (dailyAvg === 0) continue;

    const todayCount = todayPosts.length;
    const increaseRatio = todayCount / dailyAvg - 1;
    if (increaseRatio < settings.threshold / 100) continue;

    const lastAlerted = settings.lastAlerted?.[keyword];
    if (lastAlerted && new Date(lastAlerted) >= todayStart) continue;

    const increasePercent = Math.round(increaseRatio * 100);
    try {
      await emailjs.send(
        settings.serviceId,
        settings.templateId,
        {
          keyword,
          today_count: todayCount,
          avg_count: dailyAvg.toFixed(1),
          increase_percent: increasePercent,
          to_email: settings.recipientEmail,
        },
        { publicKey: settings.publicKey }
      );
      saveAlertSettings({
        ...settings,
        lastAlerted: { ...settings.lastAlerted, [keyword]: now.toISOString() },
      });
      console.log(`Alert sent for "${keyword}" (+${increasePercent}%)`);
    } catch (err) {
      console.error('Alert send error:', err);
    }
  }
}
