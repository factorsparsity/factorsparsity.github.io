// Visual check: drives headless Chrome over CDP (viewport, scroll, mouse, screenshots).
// Usage: python3 -m http.server 8765 &  then  node tools/screenshots.mjs <outdir>
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const out = process.argv[2];
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9333', '--user-data-dir=' + out + '/prof', 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1500);
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = {};
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pending[d.id]) { pending[d.id](d.result); delete pending[d.id]; } };
const send = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const evalJs = (e) => send('Runtime.evaluate', { expression: e, returnByValue: true }).then((r) => r.result.value);
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${out}/${name}.png`, Buffer.from(r.data, 'base64')); };
async function view(w, h, mobile) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }); }
await send('Page.enable');
for (const [w, h, mobile, tag] of [[1440, 900, false, 'd'], [390, 844, true, 'm']]) {
  await view(w, h, mobile);
  await send('Page.navigate', { url: 'http://localhost:8765/' }); await sleep(2000);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: w * 0.6, y: h * 0.35 }); await sleep(400);
  await shot(tag + '-0');
  for (const y of [500, 1300]) { await evalJs(`window.scrollTo({top:${y},behavior:'instant'})`); await sleep(900); await shot(`${tag}-${y}`); }
  const sig = await evalJs(`document.getElementById('signal').offsetTop`);
  await evalJs(`window.scrollTo({top:${sig},behavior:'instant'})`); await sleep(1500);
  const r = await evalJs(`(()=>{const b=document.querySelector('.crt a').getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r[0], y: r[1] }); await sleep(900);
  await shot(tag + '-signal-hover');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
  for (const sel of ['#noise', '#about']) { await evalJs(`window.scrollTo({top:document.querySelector('${sel}').offsetTop,behavior:'instant'})`); await sleep(1300); await shot(tag + '-' + sel.slice(1)); }
  await evalJs(`window.scrollTo({top:1e6,behavior:'instant'})`); await sleep(1300); await shot(tag + '-foot');
  console.log(tag, 'overflow', await evalJs(`document.documentElement.scrollWidth+'/'+innerWidth`));
}
ws.close(); chrome.kill();
