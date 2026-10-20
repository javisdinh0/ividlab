#!/usr/bin/env node
'use strict';
/**
 * Tối ưu ảnh/GIF của các bài viết tĩnh — chạy tay sau khi thêm bài/ảnh mới:
 *   npm run optimize-media            (ghi thay đổi)
 *   npm run optimize-media -- --dry   (chỉ liệt kê)
 *
 * Quét public/autocad/**, public/tekla/** (*.html) và các posts.json:
 * - <img src="….png|jpg|jpeg"> (file cục bộ): tạo bản .webp cạnh file gốc; nếu nhẹ hơn ≥10% thì
 *   đổi src sang .webp. File gốc giữ lại (og:image, nguồn để sửa ảnh).
 * - <img src="….gif"> trong <figure class="media">: tạo .mp4 (H.264, không tiếng) + ảnh poster
 *   -poster.webp (khung đầu), thay thẻ img bằng <video data-autoplay …>. article.js chỉ phát khi
 *   video lọt vào màn hình (bản ngôn ngữ đang ẩn không tải) và bấm vào thì phóng to như ảnh.
 *   Cần ffmpeg trong PATH; thiếu thì bỏ qua GIF.
 * - "cover" trong posts.json: png/jpg -> .webp như trên (GIF giữ nguyên vì dùng trong <img>).
 * Chạy lại an toàn: src đã là .webp/.mp4 thì không đụng nữa.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const DRY = process.argv.includes('--dry');
const MIN_SAVING = 0.9; // webp phải ≤ 90% dung lượng gốc mới đổi

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const resolveSrc = (src, fileDir) =>
  src.startsWith('/') ? path.join(PUB, src) : path.join(fileDir, src);
const isNewer = (a, b) => !fs.existsSync(b) || fs.statSync(a).mtimeMs > fs.statSync(b).mtimeMs;
const swapExt = (p, ext) => p.replace(/\.[a-z0-9]+$/i, ext);
const kb = (n) => `${Math.round(n / 1024)} KB`;

let hasFfmpeg = true;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { hasFfmpeg = false; }

const log = [];
let savedBytes = 0;

// Ảnh tĩnh -> webp. Trả về src mới (hoặc null nếu giữ nguyên).
async function toWebp(src, fileDir) {
  const file = resolveSrc(src, fileDir);
  if (!fs.existsSync(file)) return null;
  const out = swapExt(file, '.webp');
  if (isNewer(file, out) && !DRY) {
    await sharp(file).webp({ quality: 82, effort: 6 }).toFile(out);
  }
  const before = fs.statSync(file).size;
  const after = fs.existsSync(out) ? fs.statSync(out).size : before * 0.6; // dry run: ước lượng
  if (after > before * MIN_SAVING) return null;
  savedBytes += before - after;
  return swapExt(src, '.webp');
}

// GIF -> mp4 + poster. Trả về { mp4, poster } (src tương đối như src gốc) hoặc null.
async function gifToVideo(src, fileDir) {
  const file = resolveSrc(src, fileDir);
  if (!hasFfmpeg || !fs.existsSync(file)) return null;
  const mp4 = swapExt(file, '.mp4');
  const poster = swapExt(file, '-poster.webp');
  if (!DRY) {
    if (isNewer(file, mp4)) {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file,
        '-movflags', '+faststart', '-pix_fmt', 'yuv420p', '-an',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-tune', 'animation', mp4]); // crf 28: chữ giao diện vẫn rõ như GIF, nhẹ ~80%
    }
    if (isNewer(file, poster)) await sharp(file).webp({ quality: 82 }).toFile(poster);
    savedBytes += fs.statSync(file).size - fs.statSync(mp4).size - fs.statSync(poster).size;
  }
  return { mp4: swapExt(src, '.mp4'), poster: swapExt(src, '-poster.webp') };
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};

async function processHtml(file) {
  let html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  let changed = 0;
  const tags = html.match(/<img\b[^>]*>/g) || [];
  for (const tag of new Set(tags)) {
    const src = attr(tag, 'src');
    if (!src || /^(https?:|data:)/.test(src)) continue;
    let replacement = null;
    if (/\.(png|jpe?g)$/i.test(src)) {
      const webp = await toWebp(src, dir);
      if (webp) replacement = tag.replace(`src="${src}"`, `src="${webp}"`);
    } else if (/\.gif$/i.test(src)) {
      const v = await gifToVideo(src, dir);
      if (v) {
        const w = attr(tag, 'width');
        const h = attr(tag, 'height');
        const alt = attr(tag, 'alt') || '';
        replacement = `<video src="${v.mp4}" poster="${v.poster}"${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''}` +
          ` muted loop playsinline preload="none" data-autoplay aria-label="${alt}" title="${alt}"></video>`;
      }
    }
    if (replacement) {
      html = html.split(tag).join(replacement);
      changed++;
    }
  }
  if (changed) {
    log.push(`${path.relative(PUB, file)}: ${changed} thẻ`);
    if (!DRY) fs.writeFileSync(file, html);
  }
}

async function processPosts(file) {
  const text = fs.readFileSync(file, 'utf8');
  let out = text;
  const covers = [...text.matchAll(/"cover":\s*"([^"]+\.(?:png|jpe?g))"/gi)].map((m) => m[1]);
  for (const src of new Set(covers)) {
    const webp = await toWebp(src, path.dirname(file));
    if (webp) out = out.split(`"${src}"`).join(`"${webp}"`);
  }
  if (out !== text) {
    log.push(`${path.relative(PUB, file)}: cover -> webp`);
    if (!DRY) fs.writeFileSync(file, out);
  }
}

(async () => {
  const files = ['autocad', 'tekla'].flatMap((d) => walk(path.join(PUB, d)));
  for (const f of files.filter((f) => f.endsWith('.html'))) await processHtml(f);
  for (const f of files.filter((f) => path.basename(f) === 'posts.json')) await processPosts(f);
  if (!hasFfmpeg) console.warn('! Không thấy ffmpeg trong PATH — bỏ qua GIF.');
  console.log(log.join('\n') || 'Không có gì cần tối ưu.');
  console.log(`${DRY ? '[dry] ' : ''}Tiết kiệm khoảng ${kb(savedBytes)} cho các ảnh được đổi.`);
})().catch((e) => { console.error(e); process.exitCode = 1; });
