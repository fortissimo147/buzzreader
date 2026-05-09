import React, { useState } from 'react';
import { getAlertSettings, saveAlertSettings, sendTestEmail } from '../emailAlert';

export default function AlertSettings({ onClose }) {
  const [cfg, setCfg] = useState(getAlertSettings);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState(null);

  const set = (key, val) => setCfg(prev => ({ ...prev, [key]: val }));

  function handleSave() {
    saveAlertSettings(cfg);
    onClose();
  }

  async function handleTest() {
    setTesting(true);
    setTestMsg(null);
    try {
      await sendTestEmail(cfg);
      setTestMsg({ ok: true, text: 'テストメールを送信しました ✓' });
    } catch (err) {
      setTestMsg({ ok: false, text: 'エラー: ' + (err?.text ?? err?.message ?? String(err)) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={e => e.stopPropagation()}>
        <div style={s.head}>
          <span style={s.title}>アラート設定</span>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <label style={s.toggle}>
          <input type="checkbox" checked={cfg.enabled}
                 onChange={e => set('enabled', e.target.checked)} />
          <span>アラートを有効にする</span>
        </label>

        <div style={s.group}>
          <div style={s.groupLabel}>受信メールアドレス</div>
          <input style={s.input} type="email" placeholder="you@example.com"
                 value={cfg.recipientEmail} onChange={e => set('recipientEmail', e.target.value)} />
        </div>

        <div style={s.group}>
          <div style={s.groupLabel}>アラート閾値</div>
          <div style={s.row}>
            <input style={{ ...s.input, width: 80 }} type="number" min="1" max="500"
                   value={cfg.threshold} onChange={e => set('threshold', Number(e.target.value))} />
            <span style={s.unit}>% 上昇で送信</span>
          </div>
          <div style={s.hint}>本日の件数が過去3ヶ月の日次平均より {cfg.threshold}% 上回ったとき送信します（1日1回まで）</div>
        </div>

        <div style={s.group}>
          <div style={s.groupLabel}>
            EmailJS 設定　
            <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" style={s.link}>
              アカウント作成 →
            </a>
          </div>
          <input style={s.input} placeholder="Service ID (例: service_xxxxxx)"
                 value={cfg.serviceId} onChange={e => set('serviceId', e.target.value)} />
          <input style={s.input} placeholder="Template ID (例: template_xxxxxx)"
                 value={cfg.templateId} onChange={e => set('templateId', e.target.value)} />
          <input style={s.input} placeholder="Public Key"
                 value={cfg.publicKey} onChange={e => set('publicKey', e.target.value)} />
          <div style={s.hint}>
            テンプレートで使える変数：<br />
            <code style={s.code}>
              {'{{keyword}}'} {'{{today_count}}'} {'{{avg_count}}'} {'{{increase_percent}}'} {'{{to_email}}'}
            </code>
          </div>
        </div>

        <div style={s.btnRow}>
          <button style={s.saveBtn} onClick={handleSave}>保存</button>
          <button style={s.testBtn} onClick={handleTest}
                  disabled={testing || !cfg.serviceId || !cfg.templateId || !cfg.publicKey}>
            {testing ? '送信中…' : 'テスト送信'}
          </button>
        </div>

        {testMsg && (
          <div style={{ ...s.result, color: testMsg.ok ? '#4ade80' : '#f7826a' }}>
            {testMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', justifyContent: 'flex-end', zIndex: 200,
  },
  panel: {
    width: 340, maxWidth: '100vw', height: '100vh', background: '#13152a',
    borderLeft: '1px solid #1e2035', overflowY: 'auto',
    padding: 22, display: 'flex', flexDirection: 'column', gap: 22,
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: 700, color: '#e2e4f0' },
  closeBtn: { background: 'none', border: 'none', color: '#5a5d78', fontSize: 22, cursor: 'pointer', padding: 0 },
  toggle: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#e2e4f0', cursor: 'pointer' },
  group: { display: 'flex', flexDirection: 'column', gap: 8 },
  groupLabel: { fontSize: 11, fontWeight: 600, color: '#5a5d78', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input: {
    background: '#1a1d2e', border: '1px solid #2a2d42', borderRadius: 8,
    color: '#e2e4f0', fontSize: 13, padding: '8px 12px', outline: 'none', width: '100%',
  },
  row: { display: 'flex', alignItems: 'center', gap: 10 },
  unit: { fontSize: 13, color: '#8b8ea8', whiteSpace: 'nowrap' },
  hint: { fontSize: 12, color: '#5a5d78', lineHeight: 1.6 },
  link: { color: '#7c6af7', fontSize: 11 },
  code: { fontSize: 11, color: '#8b8ea8', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.8 },
  btnRow: { display: 'flex', gap: 8 },
  saveBtn: {
    flex: 1, background: '#7c6af7', border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px', cursor: 'pointer',
  },
  testBtn: {
    background: '#1a1d2e', border: '1px solid #2a2d42', borderRadius: 8,
    color: '#8b8ea8', fontSize: 13, padding: '10px 14px', cursor: 'pointer',
  },
  result: { fontSize: 13, padding: '10px 12px', borderRadius: 8, background: '#1a1d2e', lineHeight: 1.5 },
};
