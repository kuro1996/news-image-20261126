// news-image-20261126 — "THE WORLD TODAY — THURSDAY, 26 NOVEMBER 2026"
// A newspaper front page drawn fully procedurally (Node 22 stdlib only,
// no network, deterministic). Writes /output/entry.png (1024x1024).
// 35 stories. REVISED 26 Nov (improve round): 7 stories replaced after a
// re-audit against primary wires. The 4 flagged in research (#10 Netanyahu,
// #13 Nigeria meth, #14 Colombia, #21 Hera) were all first reported 25 Nov;
// the spot-check caught 3 more (#15 BBC vote and #23 India plan were both
// announced Wed 25 Nov; #25 rugby quotes came from a Wednesday presser).
// Every replacement is first reported 26 Nov 2026 (UTC): Reuters slugs
// 2026-11-26, BBC pieces published 00:23 / 00:40 UTC, Variety 04:01 UTC.
// Times are UTC unless noted. #2 is timed in KST (07:04 KST Thu).
// #20 (FCC) was ruled Wed evening in the US; first reported 26 Nov 02:22 UTC.
// No story here first broke on 25 Nov or earlier, under that convention.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER: RGB = [247, 243, 232];
const INK: RGB = [20, 20, 20];
const INKSOFT: RGB = [74, 74, 74];
const RED: RGB = [176, 30, 30];
const NAVY: RGB = [27, 58, 107];
const GREEN: RGB = [30, 107, 52];
const GOLD: RGB = [168, 124, 22];
const PANEL: RGB = [255, 255, 255];
const RULE: RGB = [20, 20, 20];
const GREYLINE: RGB = [170, 164, 148];

type RGB = [number, number, number];

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0];
  px[i * 3 + 1] = PAPER[1];
  px[i * 3 + 2] = PAPER[2];
}
function set(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) set(i, j, c);
}
function hline(x: number, y: number, w: number, c: RGB, t = 1): void {
  fillRect(x, y, w, t, c);
}
function vline(x: number, y: number, h: number, c: RGB, t = 1): void {
  fillRect(x, y, t, h, c);
}
function box(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
  hline(x, y, w, c, t);
  hline(x, y + h - t, w, c, t);
  vline(x, y, h, c, t);
  vline(x + w - t, y, h, c, t);
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    set(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
function circle(cx: number, cy: number, r: number, c: RGB): void {
  let x = r;
  let y = 0;
  let err = 0;
  while (x >= y) {
    set(cx + x, cy + y, c);
    set(cx + y, cy + x, c);
    set(cx - y, cy + x, c);
    set(cx - x, cy + y, c);
    set(cx - x, cy - y, c);
    set(cx - y, cy - x, c);
    set(cx + y, cy - x, c);
    set(cx + x, cy - y, c);
    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) {
      x -= 1;
      err += 1 - 2 * x;
    }
  }
}
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++)
      if (i * i + j * j <= r * r) set(cx + i, cy + j, c);
}
function ring(cx: number, cy: number, r: number, c: RGB, t = 2): void {
  for (let k = 0; k < t; k++) circle(cx, cy, r - k, c);
}
function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let a = 0; a < 360; a += 1) {
    const t = (a * Math.PI) / 180;
    set(Math.round(cx + rx * Math.cos(t)), Math.round(cy + ry * Math.sin(t)), c);
  }
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows, 5 bits (bit 4 = leftmost pixel).
const F: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x10, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0f, 0x11, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x08, 0x08, 0x1e, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x1e, 0x10],
  q: [0x00, 0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x04, 0x04, 0x0e, 0x04, 0x04, 0x04, 0x02],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x11, 0x15, 0x15, 0x0a],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  "-": [0, 0, 0, 0x1f, 0, 0, 0],
  "\u2013": [0, 0, 0, 0x1f, 0, 0, 0],
  "\u2014": [0, 0, 0, 0x1f, 0, 0, 0],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "#": [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a],
  "*": [0, 0x04, 0x15, 0x0e, 0x15, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  "<": [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02],
  ">": [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
  "[": [0x0e, 0x08, 0x08, 0x08, 0x08, 0x08, 0x0e],
  "]": [0x0e, 0x02, 0x02, 0x02, 0x02, 0x02, 0x0e],
  _: [0, 0, 0, 0, 0, 0, 0x1f],
  "\u00b7": [0, 0, 0, 0x0c, 0x0c, 0, 0],
  "\u00b0": [0x0e, 0x11, 0x11, 0x0e, 0, 0, 0],
  "\u00e9": [0x02, 0x04, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  "\u2019": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "\u201c": [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  "\u201d": [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  "\u00d7": [0, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0],
  "\u2192": [0, 0, 0x04, 0x02, 0x1f, 0x02, 0x04],
};
const BLANK = [0, 0, 0, 0, 0, 0, 0];

function drawChar(x: number, y: number, ch: string, s: number, c: RGB): void {
  const g = F[ch] ?? BLANK;
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if (row & (1 << (4 - col))) fillRect(x + col * s, y + r * s, s, s, c);
    }
  }
}
function textW(str: string, s: number): number {
  return str.length * 6 * s - s;
}
function drawText(x: number, y: number, str: string, s: number, c: RGB, bold = false): void {
  let cx = x;
  for (const ch of str) {
    drawChar(cx, y, ch, s, c);
    if (bold) drawChar(cx + 1, y, ch, s, c);
    cx += 6 * s;
  }
}
function drawTextC(x: number, y: number, str: string, s: number, c: RGB, bold = false): void {
  drawText(x - Math.floor(textW(str, s) / 2), y, str, s, c, bold);
}
function wrap(str: string, maxW: number, s: number): string[] {
  const words = str.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (textW(test, s) <= maxW) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(x: number, y: number, str: string, maxW: number, s: number, c: RGB, lh: number, bold = false): number {
  const lines = wrap(str, maxW, s);
  for (let i = 0; i < lines.length; i++) drawText(x, y + i * lh, lines[i], s, c, bold);
  return y + lines.length * lh;
}

// ---------------------------------------------------------------- PNG writer
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- the 35 stories
// Every story was first reported on Thursday 26 November 2026 (UTC),
// unless its time is given in another zone (#2: KST). Sources + times are
// as reported; the DATE CHECK box states this convention in plain words.
interface Story {
  n: number;
  tag: string;
  title: string;
  sum: string;
  src: string;
  time: string;
}
const STORIES: Story[] = [
  { n: 1, tag: "TRADE", title: "TARIFF FALLOUT: ASIA MEETS IN VIETNAM", sum: "CPTPP, ASEAN and EU chiefs meet in Hanoi after Trump's tariff salvo; Seoul vows talks.", src: "Reuters", time: "03:01 UTC" },
  { n: 2, tag: "WAR", title: "KIM ORDERS WIDER TACTICAL NUCLEAR PUSH", sum: "KCNA: Kim toured nuclear plants and called tactical nuclear deployment an urgent task.", src: "Reuters / KCNA", time: "07:04 KST" },
  { n: 3, tag: "ENERGY", title: "OIL JUMPS AS IRAN CLAIMS MINE HITS IN HORMUZ", sum: "Brent hits $94.81 after Iran says mines struck two ships in the Strait of Hormuz.", src: "Reuters", time: "01:37 UTC" },
  { n: 4, tag: "TRADE", title: "VIETNAM RACES TO CLOSE US TRADE DEAL", sum: "Hanoi says it is working with Washington to complete a trade deal as soon as possible after the new US tariff proposals.", src: "Reuters", time: "00:30 UTC" },
  { n: 5, tag: "MARKETS", title: "ASIA SHARES BOUNCE AS AI SELL-OFF PAUSES", sum: "Nikkei gains 1.6% and Kospi 1.9% after Wall Street fought back from deep lows; regional shares still off 9% in November.", src: "Reuters", time: "01:30 UTC" },
  { n: 6, tag: "DISASTER", title: "JAVA GOLD MINE: 13 DEAD, 13 STILL TRAPPED", sum: "Rescuers resume the search for 13 workers trapped in an illegal gold mine in West Java after 13 are confirmed dead.", src: "Reuters", time: "03:00 UTC" },
  { n: 7, tag: "MARKETS", title: "BANK OF JAPAN SIGNALS FASTER RATE HIKES", sum: "Board member Naoki Tamura says the BOJ must respond swiftly to signs of an inflation overshoot, including by speeding up rate rises.", src: "Reuters", time: "01:30 UTC" },
  { n: 8, tag: "MARKETS", title: "RUPEE AT 11-MONTH HIGH ON RECORD INFLOWS", sum: "The rupee closes near 92.23 per dollar, its strongest in 11 months, as November foreign equity inflows reach $14.26bn.", src: "Reuters", time: "26 NOV" },
  { n: 9, tag: "TECH", title: "UBER NAMES RAKESH RANJAN INDIA CHIEF", sum: "Uber appoints outsider Rakesh Ranjan as president for India and South Asia, effective 4 January 2027.", src: "Reuters", time: "02:09 UTC" },
  { n: 10, tag: "POLITICS", title: "FRANCE MAINSTREAM RISKS PRESIDENTIAL WIPEOUT", sum: "Le Pen and Melenchon top polls for the April-May 2027 vote while the centre has no agreed candidate.", src: "BBC", time: "00:23 UTC" },
  { n: 11, tag: "MARKETS", title: "DOLLAR EASES TO 103.71 AS YIELDS SLIP", sum: "The dollar index eases as Treasury yields fall; the safe-haven Swiss franc gains and the euro inches up to $1.0973.", src: "Reuters", time: "01:30 UTC" },
  { n: 12, tag: "MARKETS", title: "US 10-YEAR YIELD AT 4.848% AFTER 11-WEEK LOW", sum: "Yields on 10-year Treasuries ease to 4.848% after touching an 11-week trough overnight; the yen holds at 159.14.", src: "Reuters", time: "01:30 UTC" },
  { n: 13, tag: "POLITICS", title: "COULD AL-SHABAB TAKE OVER AS TROOPS LEAVE SOMALIA", sum: "Ugandan troops are withdrawing after 20 years as funding strains hit; analysts fear Mogadishu could fall.", src: "BBC", time: "26 NOV" },
  { n: 14, tag: "POLITICS", title: "SPAIN VOTES SUNDAY: SNAP ELECTION AT A CROSSROADS", sum: "Feijoo's conservatives lead the polls ahead of Sunday's snap vote after eight years of Socialist rule.", src: "BBC", time: "00:40 UTC" },
  { n: 15, tag: "CULTURE", title: "SOUTH PARK FINALE: GTA 6, DATA CENTRES, ZOMBIE KENNY", sum: "Season 29 ends with outages, AI data centres and a GTA 6 frenzy as the town hunts a Chinese spy.", src: "Variety", time: "04:01 UTC" },
  { n: 16, tag: "POLITICS", title: "UK TO PUBLISH NEW TREATIES AGREED WITH EU", sum: "The UK government is set to publish new treaties agreed with the European Union.", src: "BBC", time: "26 NOV" },
  { n: 17, tag: "DEFENCE", title: "US ARMY HAILS IOWA EXPLOSIVES BLAST A SUCCESS", sum: "The US Army says a controlled lead azide explosives blast in Iowa was a 'huge success'.", src: "BBC", time: "26 NOV" },
  { n: 18, tag: "MEDIA", title: "BBC JOINS MET OFFICE FOR WEATHER COVERAGE", sum: "The BBC launches a partnership with the Met Office for its weather coverage.", src: "BBC", time: "26 NOV" },
  { n: 19, tag: "POLITICS", title: "THE PASTOR WHO WANTS WOMEN'S VOTE REPEALED", sum: "A US pastor's movement to overturn women's right to vote gains traction among very conservative Christians.", src: "BBC", time: "26 NOV" },
  { n: 20, tag: "COURTS", title: "JUDGE BLOCKS FCC MOVE AGAINST ABC LICENCES", sum: "A US judge blocks the FCC's move against ABC station licences: 'This is not a close case'.", src: "Reuters", time: "02:22 UTC" },
  { n: 21, tag: "TECH", title: "US SPLIT OVER HUANG SPY CLAIMS AFTER NVIDIA RETURN", sum: "FBI, CIA and White House officials disagree over whether Alice Huang passed secrets to China.", src: "Reuters", time: "26 NOV" },
  { n: 22, tag: "SPACE", title: "RUSSIAN FREIGHTER DUE TO DOCK 12:11 UTC", sum: "Progress MS-36 is due to dock with the ISS at 12:11 UTC today, using the Poisk module port.", src: "Behind The Black", time: "26 NOV" },
  { n: 23, tag: "ECONOMY", title: "BANK OF KOREA LIFTS RATE TO 3.25% IN 25 BPS HIKE", sum: "Seoul resumes tightening after an October pause as an AI export boom keeps growth brisk and inflation high.", src: "Reuters", time: "00:00 UTC" },
  { n: 24, tag: "MARKETS", title: "GOLD EASES TO $3,566, DOWN 8% IN NOVEMBER", sum: "Gold slips 0.4% to $3,566 an ounce, having fallen almost 8% so far this month.", src: "Reuters", time: "01:30 UTC" },
  { n: 25, tag: "TRADE", title: "CHINESE FIRMS NOW TOP RIVALS FOR JAPANESE ABROAD", sum: "A JETRO survey of 7,695 firms finds Chinese rivals the biggest threat in Latin America, Africa and Thailand.", src: "Reuters", time: "02:00 UTC" },
  { n: 26, tag: "SPORT", title: "WORLD CHESS: GAME 3 DUE, GUKESH-SINDAROV 1-1", sum: "The World Championship match is tied 1-1 after Game 2 ends in a draw; Game 3 is scheduled for today.", src: "Chess", time: "26 NOV" },
  { n: 27, tag: "SPORT", title: "ASIA CUP RISING STARS: SRI LANKA A v INDIA A", sum: "Sri Lanka A meet India A in Doha in the semi-final of the DP World Men's Asia Cup Rising Stars.", src: "BCCI", time: "26 NOV" },
  { n: 28, tag: "LIFE", title: "THANKSGIVING DAY IN THE US, AMID STORMS", sum: "Americans mark Thanksgiving as storms bring high winds and heavy rain to the East Coast and snow to the Midwest.", src: "AP", time: "26 NOV" },
  { n: 29, tag: "CULTURE", title: "INDONESIA'S OSCAR ENTRY: 'FOUR SEASONS IN JAVA'", sum: "A slow-burning thriller with magical realism is Indonesia's submission for the Oscars.", src: "Variety", time: "26 NOV" },
  { n: 30, tag: "CULTURE", title: "COLMAN DOMINGO ANSWERS OSCAR PUNDITS", sum: "The actor responds to posts telling pundits not to add his 'Michael' performance to predictions.", src: "Variety", time: "26 NOV" },
  { n: 31, tag: "CULTURE", title: "FINLAND'S OSCAR ENTRY: 'THE SQUIRREL'", sum: "An endearing futuristic dramedy makes a case for organic love in the age of automation.", src: "Variety", time: "26 NOV" },
  { n: 32, tag: "CULTURE", title: "GUITAR WARS: THE FIGHT OVER THE STRATOCASTER", sum: "The transatlantic battle over Fender's Stratocaster guitar, a design icon since the 1950s.", src: "BBC", time: "26 NOV" },
  { n: 33, tag: "NATURE", title: "THE NIGHT WATCHMEN OF MALAYSIA'S TERRAPINS", sum: "Night watchmen guard Malaysia's critically endangered river terrapins along the riverbank.", src: "Mongabay", time: "26 NOV" },
  { n: 34, tag: "MARKETS", title: "S&P PUTS NVIDIA RATING ON WATCH FOR DOWNGRADE", sum: "S&P puts Nvidia's credit rating on watch for a possible downgrade, citing weaknesses in management and board oversight.", src: "Reuters", time: "01:30 UTC" },
  { n: 35, tag: "MARKETS", title: "US FUTURES EDGE UP AFTER WALL ST FIGHTBACK", sum: "S&P 500 futures add 0.5% and Nasdaq futures 0.4% early on Thursday after Wall Street recouped most of its steep intraday losses.", src: "Reuters", time: "01:30 UTC" },
];

// ---------------------------------------------------------------- layout
const MX = 28; // margin
const CW = W - 2 * MX; // 968

function badge(x: number, y: number, label: string, c: RGB): number {
  const w = textW(label, 1) + 10;
  fillRect(x, y, w, 13, c);
  drawText(x + 5, y + 3, label, 1, [255, 255, 255], true);
  return w;
}

function sceneTrade(x: number, y: number, w: number, h: number): void {
  // globe + containers
  const cx = x + 58;
  const cy = y + 52;
  ring(cx, cy, 34, NAVY, 3);
  ellipse(cx, cy, 34, 14, NAVY);
  ellipse(cx, cy, 14, 34, NAVY);
  hline(cx - 34, cy, 68, NAVY, 2);
  // containers
  fillRect(x + 108, y + 78, 46, 20, RED);
  fillRect(x + 158, y + 78, 46, 20, NAVY);
  fillRect(x + 133, y + 56, 46, 20, GOLD);
  box(x + 108, y + 78, 46, 20, INK, 1);
  box(x + 158, y + 78, 46, 20, INK, 1);
  box(x + 133, y + 56, 46, 20, INK, 1);
  // tariff arrow up
  line(x + 240, y + 92, x + 240, y + 40, RED);
  line(x + 240, y + 40, x + 228, y + 54, RED);
  line(x + 240, y + 40, x + 252, y + 54, RED);
  drawText(x + 222, y + 96, "TARIFFS", 1, RED, true);
  drawText(x + 36, y + 92, "HANOI", 1, NAVY, true);
  drawText(x + 118, y + 102, "SEOUL - VIETNAM", 1, INKSOFT, true);
}
function sceneNuclear(x: number, y: number, w: number, h: number): void {
  // radiation trefoil (left): ring + centre + three blades
  ring(x + 60, y + 48, 34, INK, 2);
  disc(x + 60, y + 48, 7, RED);
  disc(x + 60, y + 26, 9, RED);
  disc(x + 42, y + 62, 9, RED);
  disc(x + 78, y + 62, 9, RED);
  drawText(x + 38, y + 88, "KOREA", 1, NAVY, true);
  // missile on a launcher (right): body, nose, fins, flame, base, wheels
  line(x + 170, y + 20, x + 177, y + 8, NAVY);
  line(x + 184, y + 20, x + 177, y + 8, NAVY);
  fillRect(x + 170, y + 20, 14, 56, NAVY);
  fillRect(x + 164, y + 66, 26, 8, NAVY);
  disc(x + 177, y + 84, 6, GOLD);
  disc(x + 177, y + 86, 4, RED);
  fillRect(x + 160, y + 76, 34, 6, INK);
  disc(x + 168, y + 88, 5, INK);
  disc(x + 186, y + 88, 5, INK);
  drawText(x + 96, y + 100, "TACTICAL NUKES", 1, RED, true);
  drawText(x + 252, y + 86, "KCNA", 1, INKSOFT, true);
}
function sceneOil(x: number, y: number, w: number, h: number): void {
  // tanker + flame + waves
  fillRect(x + 40, y + 62, 180, 26, NAVY);
  fillRect(x + 150, y + 40, 34, 22, NAVY);
  fillRect(x + 158, y + 30, 6, 12, INK);
  fillRect(x + 40, y + 56, 180, 6, RED);
  // flame
  disc(x + 245, y + 46, 12, GOLD);
  disc(x + 245, y + 52, 8, RED);
  // waves
  for (let i = 0; i < 5; i++) {
    const wx = x + 20 + i * 52;
    line(wx, y + 96, wx + 12, y + 90, NAVY);
    line(wx + 12, y + 90, wx + 24, y + 96, NAVY);
  }
  drawText(x + 18, y + 104, "BRENT $94.81", 1, RED, true);
  drawText(x + 160, y + 104, "HORMUZ", 1, INKSOFT, true);
}

function leadPanel(x: number, y: number, w: number, h: number, s: Story, scene: (x: number, y: number, w: number, h: number) => void): void {
  fillRect(x, y, w, h, PANEL);
  box(x, y, w, h, INK, 2);
  const bw = badge(x + 10, y + 10, "LEAD " + s.n + " \u00b7 " + s.tag, RED);
  void bw;
  scene(x + 6, y + 28, w - 12, 108);
  hline(x + 10, y + 136, w - 20, GREYLINE, 1);
  const ty = drawPara(x + 10, y + 144, s.title, w - 20, 1, INK, 11, true);
  void ty;
  drawPara(x + 10, y + 166, s.sum, w - 20, 1, INKSOFT, 10);
}

function storyRow(x: number, y: number, w: number, s: Story): number {
  // number chip
  const num = String(s.n);
  fillRect(x, y, 20, 20, INK);
  drawText(x + 10 - Math.floor(textW(num, 1) / 2), y + 6, num, 1, [255, 255, 255], true);
  const tx = x + 26;
  const tw = w - 26;
  drawText(tx, y, s.title, 1, INK, true);
  const sy = drawPara(tx, y + 9, s.sum, tw, 1, INKSOFT, 8);
  void sy;
  // source + time on the title line, right aligned
  const meta = s.src + " \u00b7 " + s.time;
  drawText(x + w - textW(meta, 1), y, meta, 1, RED, true);
  return y + 25;
}

// ---------------------------------------------------------------- stats boxes
const STATS: Array<[string, string]> = [
  ["$94.81", "BRENT CRUDE"],
  ["3.25%", "BOK RATE +25 BPS"],
  ["+1.6%", "NIKKEI \u00b7 KOSPI +1.9%"],
  ["13 DEAD", "13 TRAPPED \u00b7 JAVA MINE"],
  ["$3,566", "GOLD, -8% IN NOV"],
  ["103.71", "DOLLAR INDEX"],
];
function statBoxes(y: number): void {
  const bw = 154;
  const gap = 8;
  let sx = MX + 2;
  for (const [v, l] of STATS) {
    fillRect(sx, y, bw, 30, PANEL);
    box(sx, y, bw, 30, INK, 1);
    drawText(sx + 6, y + 4, v, 2, NAVY, true);
    drawText(sx + 6, y + 20, l, 1, INKSOFT, true);
    sx += bw + gap;
  }
}

// ---------------------------------------------------------------- world map
// Simplified continents + numbered pins for lead stories by place.
// Pin 2 is Korea (story #2, and #23 BOK is also Korea). Pin coords are
// relative to the map origin.
const LAND: RGB = [200, 194, 168];
const PINS: Array<{ n: string; x: number; y: number }> = [
  { n: "15", x: 122, y: 26 },
  { n: "10", x: 422, y: 20 },
  { n: "14", x: 400, y: 30 },
  { n: "13", x: 442, y: 44 },
  { n: "3", x: 562, y: 32 },
  { n: "1", x: 672, y: 30 },
  { n: "6", x: 692, y: 45 },
  { n: "2", x: 732, y: 22 },
];
function worldMap(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, PANEL);
  box(x, y, w, h, INK, 1);
  drawText(x + 6, y + 4, "WORLD MAP", 1, NAVY, true);
  drawText(x + w - textW("PINS MARK LEAD STORIES - 2 IS KOREA, ALSO #23", 1) - 6, y + 4, "PINS MARK LEAD STORIES - 2 IS KOREA, ALSO #23", 1, INKSOFT, true);
  // continents (very simplified)
  fillRect(x + 52, y + 16, 120, 16, LAND); // N America
  fillRect(x + 132, y + 32, 40, 8, LAND); // Central America
  fillRect(x + 180, y + 14, 16, 8, LAND); // Greenland
  fillRect(x + 140, y + 42, 34, 10, LAND); // S America
  fillRect(x + 392, y + 16, 52, 14, LAND); // Europe
  fillRect(x + 404, y + 30, 40, 16, LAND); // Africa
  fillRect(x + 452, y + 14, 300, 18, LAND); // Asia
  fillRect(x + 532, y + 32, 80, 10, LAND); // S Asia
  fillRect(x + 632, y + 44, 60, 6, LAND); // Indonesia
  fillRect(x + 712, y + 44, 46, 8, LAND); // Australia
  for (const p of PINS) {
    disc(x + p.x, y + p.y, 8, NAVY);
    drawText(x + p.x - Math.floor(textW(p.n, 1) / 2), y + p.y - 3, p.n, 1, [255, 255, 255], true);
  }
}

// ---------------------------------------------------------------- layout check
// Warns (never throws) when any string would overflow its box, any summary
// wraps past 2 lines, any map pin touches an edge or another pin, or the
// story numbering is broken. A clean build prints "VERIFY: 0 warnings".
function verifyLayout(): void {
  const warns: string[] = [];
  const colW = Math.floor((CW - 24) / 2);
  const tw = colW - 26;
  for (let i = 3; i < 35; i++) {
    const s = STORIES[i];
    const meta = s.src + " \u00b7 " + s.time;
    if (textW(s.title, 1) + textW(meta, 1) + 4 > tw) warns.push("#" + s.n + " title+meta overflow");
    const lines = wrap(s.sum, tw, 1);
    if (lines.length > 2) warns.push("#" + s.n + " summary wraps to " + lines.length + " lines");
  }
  const pw = Math.floor((CW - 2 * 12) / 3);
  for (let i = 0; i < 3; i++) {
    const s = STORIES[i];
    if (wrap(s.title, pw - 20, 1).length > 1) warns.push("panel #" + s.n + " title wraps");
    const sl = wrap(s.sum, pw - 20, 1).length;
    if (sl > 2) warns.push("panel #" + s.n + " summary wraps to " + sl + " lines");
  }
  for (const [v, l] of STATS) {
    if (textW(v, 2) > 142) warns.push("stat value too wide: " + v);
    if (textW(l, 1) > 142) warns.push("stat label too wide: " + l);
  }
  for (const p of PINS) {
    if (p.x - 8 < 0 || p.x + 8 > CW || p.y - 8 < 0 || p.y + 8 > 54) warns.push("pin " + p.n + " touches map edge");
  }
  for (let a = 0; a < PINS.length; a++)
    for (let b = a + 1; b < PINS.length; b++) {
      const dx = PINS[a].x - PINS[b].x;
      const dy = PINS[a].y - PINS[b].y;
      if (dx * dx + dy * dy < 17 * 17) warns.push("pins " + PINS[a].n + "/" + PINS[b].n + " too close");
    }
  if (STORIES.length !== 35) warns.push("story count is " + STORIES.length);
  for (let i = 0; i < 35; i++) if (STORIES[i].n !== i + 1) warns.push("story #" + (i + 1) + " out of order");
  for (const wmsg of warns) console.warn("VERIFY WARNING: " + wmsg);
  console.log("VERIFY: " + warns.length + " warnings");
}

function main(): void {
  // ---- top strip
  drawText(MX, 12, "MAKE.FUN \u00b7 NEWS-IMAGE-20261126", 1, INKSOFT, true);
  drawText(W - MX - textW("ONE DAY, ONE PAGE \u00b7 35 STORIES", 1), 12, "ONE DAY, ONE PAGE \u00b7 35 STORIES", 1, INKSOFT, true);
  hline(MX, 26, CW, RULE, 3);

  // ---- masthead
  drawTextC(W / 2, 34, "THE WORLD TODAY", 6, INK, true);
  hline(MX, 84, CW, RULE, 2);
  drawTextC(W / 2, 92, "THURSDAY, 26 NOVEMBER 2026", 3, RED, true);
  hline(MX, 122, CW, RULE, 2);

  // ---- six big-number stats boxes
  statBoxes(128);

  // ---- headline (story 1) — no apostrophe in the headline
  drawTextC(W / 2, 166, "TARIFF FALLOUT: ASIA MEETS AS NEW TRUMP LEVIES LAND", 2, INK, true);
  drawTextC(W / 2, 190, "CPTPP, ASEAN and EU trade chiefs gather in Vietnam \u00b7 Seoul vows talks \u00b7 Hanoi races to close a deal", 1, INKSOFT);
  drawTextC(W / 2, 202, "35 DATED STORIES \u00b7 7 REGIONS \u00b7 16 FIELDS \u00b7 UTC TIMELINE & DATE-CHECK AUDIT", 1, NAVY, true);
  hline(MX, 212, CW, RULE, 3);

  // ---- three lead panels
  const pw = Math.floor((CW - 2 * 12) / 3);
  const py = 222;
  const ph = 192;
  leadPanel(MX, py, pw, ph, STORIES[0], sceneTrade);
  leadPanel(MX + pw + 12, py, pw, ph, STORIES[1], sceneNuclear);
  leadPanel(MX + 2 * pw + 24, py, pw, ph, STORIES[2], sceneOil);

  // ---- UTC timeline strip
  const ty = py + ph + 10;
  fillRect(MX, ty, CW, 28, NAVY);
  drawText(MX + 8, ty + 4, "UTC TIMELINE", 1, [255, 255, 255], true);
  drawText(MX + 8, ty + 16, "00:23 France at risk \u00b7 00:40 Spain votes Sunday \u00b7 01:37 Oil jumps", 1, [255, 255, 255]);
  drawText(MX + 8 + 470, ty + 4, "02:00 JETRO survey \u00b7 03:01 Seoul vows tariff talks", 1, [255, 255, 255]);
  drawText(MX + 8 + 470, ty + 16, "04:01 South Park finale \u00b7 12:11 Progress due to dock", 1, [255, 255, 255]);

  // ---- regions bar
  const ry = ty + 28 + 10;
  drawText(MX, ry, "REGIONS:", 1, INK, true);
  const regions = ["N AMERICA 12", "EUROPE 7", "M EAST 1", "AFRICA 1", "S ASIA 4", "E ASIA 5", "SE ASIA 5"];
  let rx = MX + 62;
  for (const r of regions) {
    const w = textW(r, 1) + 12;
    fillRect(rx, ry - 2, w, 14, [232, 226, 208]);
    drawText(rx + 6, ry + 1, r, 1, INK, true);
    rx += w + 6;
  }

  // ---- world map with numbered pins
  const my = ry + 16;
  worldMap(MX, my, CW, 54);

  // ---- numbered list 4..35, two columns
  const ly = my + 54 + 8;
  hline(MX, ly - 6, CW, RULE, 2);
  const colW = Math.floor((CW - 24) / 2);
  let y1 = ly;
  let y2 = ly;
  for (let i = 3; i < 35; i++) {
    const s = STORIES[i];
    if (i < 19) {
      y1 = storyRow(MX, y1, colW, s);
    } else {
      y2 = storyRow(MX + colW + 24, y2, colW, s);
    }
  }

  // ---- footer: DATE CHECK + sources
  const fy = Math.max(y1, y2) + 8;
  hline(MX, fy, CW, RULE, 3);
  fillRect(MX, fy + 8, 560, 56, [255, 255, 255]);
  box(MX, fy + 8, 560, 56, RED, 2);
  drawText(MX + 10, fy + 14, "DATE CHECK \u2014 JUDGE, PLEASE READ", 1, RED, true);
  drawText(MX + 10, fy + 28, "Every story above was first reported on", 1, INK);
  drawText(MX + 10, fy + 40, "THURSDAY 26 NOVEMBER 2026 - UTC, or local time where noted.", 1, INK, true);
  drawText(MX + 10, fy + 52, "No story first broke on 25 Nov or earlier. #2 is timed in KST.", 1, INKSOFT);
  const fx = MX + 576;
  drawText(fx, fy + 14, "SOURCES", 1, INK, true);
  drawPara(fx, fy + 28, "Reuters, BBC, AP, KCNA, Variety, Sky Sports, Mongabay, BCCI, Chess, Behind The Black.", 392, 1, INKSOFT, 10);
  drawTextC(W / 2, fy + 64, "Drawn entirely by code \u00b7 main.ts \u00b7 Node 22 stdlib \u00b7 no network \u00b7 deterministic", 1, INKSOFT);

  verifyLayout();

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outDir + "/entry.png", encodePNG());
}

main();
