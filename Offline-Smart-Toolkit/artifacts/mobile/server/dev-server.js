/**
 * Development info server for CSC Smart Toolkit (React Native CLI).
 *
 * Serves a landing page on PORT (default 5000) showing:
 *  - Metro bundler status and connection instructions
 *  - Available build commands
 *  - App information
 *
 * Metro bundler itself runs on port 8081 (standard RN CLI port).
 */

const http  = require('http');
const path  = require('path');

const PORT = parseInt(process.env.PORT || '5000', 10);

// ── Read app metadata ────────────────────────────────────────────────────────
let appName = 'CSC Smart Toolkit';
let appVersion = '1.0.0';
let packageName = 'com.cscsmarttoolkit.app';
try {
  const pkg = require('../package.json');
  appName    = pkg.name || appName;
  appVersion = pkg.version || appVersion;
} catch (_) {}
try {
  const appJson = require('../app.json');
  appName     = appJson.name || appName;
  packageName = appJson.android?.package || packageName;
} catch (_) {}

// ── Landing page HTML ────────────────────────────────────────────────────────
function buildHtml(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host  = req.headers['x-forwarded-host']  || req.headers['host'] || `localhost:${PORT}`;
  const baseUrl = `${proto}://${host}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName} — Dev Server</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #0ea5e9;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 20px;
    }
    .dot { width: 8px; height: 8px; background: #fff; border-radius: 50%; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    h1 { font-size: 28px; font-weight: 700; color: #f8fafc; margin-bottom: 6px; }
    .sub { font-size: 14px; color: #94a3b8; margin-bottom: 32px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase;
                  letter-spacing: 0.08em; margin-bottom: 12px; }
    .cmd-block {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 14px 16px;
      font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
      color: #7dd3fc;
      margin-bottom: 8px;
    }
    .cmd-block .comment { color: #475569; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 14px;
    }
    .info-item .label { font-size: 11px; color: #64748b; text-transform: uppercase;
                        letter-spacing: 0.06em; margin-bottom: 4px; }
    .info-item .value { font-size: 14px; color: #e2e8f0; font-weight: 500; }
    .steps { list-style: none; counter-reset: steps; }
    .steps li { counter-increment: steps; display: flex; align-items: flex-start;
                gap: 12px; padding: 10px 0; border-bottom: 1px solid #1e293b; }
    .steps li::before {
      content: counter(steps);
      background: #0ea5e9;
      color: #fff;
      width: 22px; height: 22px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
      flex-shrink: 0;
    }
    .steps li .step-text { font-size: 13px; color: #cbd5e1; line-height: 1.5; }
    .steps li .step-code { font-family: monospace; font-size: 12px;
                           background: #0f172a; padding: 2px 6px; border-radius: 4px;
                           color: #7dd3fc; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155;
              font-size: 12px; color: #475569; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> React Native CLI</div>
    <h1>${appName}</h1>
    <p class="sub">v${appVersion} &nbsp;·&nbsp; ${packageName} &nbsp;·&nbsp; Android</p>

    <div class="section">
      <h2>App Info</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Framework</div>
          <div class="value">React Native CLI</div>
        </div>
        <div class="info-item">
          <div class="label">Package</div>
          <div class="value">${packageName}</div>
        </div>
        <div class="info-item">
          <div class="label">Min SDK</div>
          <div class="value">Android 7.0+ (API 24)</div>
        </div>
        <div class="info-item">
          <div class="label">Target SDK</div>
          <div class="value">Android 15 (API 35)</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Start Metro Bundler</h2>
      <div class="cmd-block"><span class="comment"># In the mobile/ directory:</span>
npx react-native start</div>
      <div class="cmd-block"><span class="comment"># Metro will run on port 8081 by default</span>
<span class="comment"># Connect your Android device or emulator, then:</span>
npx react-native run-android</div>
    </div>

    <div class="section">
      <h2>Build APK</h2>
      <div class="cmd-block"><span class="comment"># Debug APK (for testing):</span>
cd android &amp;&amp; ./gradlew assembleDebug</div>
      <div class="cmd-block"><span class="comment"># Release APK:</span>
cd android &amp;&amp; ./gradlew assembleRelease</div>
    </div>

    <div class="section">
      <h2>Connect Physical Device</h2>
      <ol class="steps">
        <li><div class="step-text">Enable <strong>Developer Options</strong> &amp; <strong>USB Debugging</strong> on your Android phone</div></li>
        <li><div class="step-text">Connect via USB, run <span class="step-code">adb devices</span> to confirm it's detected</div></li>
        <li><div class="step-text">Start Metro: <span class="step-code">npx react-native start</span></div></li>
        <li><div class="step-text">Install &amp; launch: <span class="step-code">npx react-native run-android</span></div></li>
      </ol>
    </div>

    <div class="footer">
      CSC Smart Toolkit — Expo → React Native CLI Migration &nbsp;·&nbsp; Phase 1
    </div>
  </div>
</body>
</html>`;
}

// ── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const html = buildHtml(req);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ╔══════════════════════════════════════════════╗`);
  console.log(`  ║   CSC Smart Toolkit — React Native CLI       ║`);
  console.log(`  ║   Dev info page: http://localhost:${PORT}       ║`);
  console.log(`  ╚══════════════════════════════════════════════╝`);
  console.log(`\n  Metro bundler: npx react-native start`);
  console.log(`  Android build: cd android && ./gradlew assembleDebug\n`);
});
