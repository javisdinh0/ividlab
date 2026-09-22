#!/usr/bin/env node
'use strict';
/**
 * Cập nhật mục Tải về của chuyên mục PEB Member khi plugin có bản mới:
 *   1. Tìm bộ gói .tsep của một phiên bản trong thư mục Publish của plugin
 *      (mặc định: phiên bản cao nhất có ĐỦ các gói).
 *   2. Chép vào public/fordownload/peb-member/ và xoá các gói phiên bản cũ ở đó.
 *   3. Ghi version / released / file / size vào public/tekla/peb-member/downloads.json.
 *
 * Bảng "phiên bản Tekla -> gói" (mảng tekla) và ghi chú phát hành (notes) trong JSON
 * vẫn sửa tay — script nhắc lại việc đó ở cuối.
 *
 * Dùng: node scripts/update-peb-member-downloads.cjs "<thư mục Publish>" [phiên bản]
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(REPO_ROOT, 'public', 'fordownload', 'peb-member');
const MANIFEST = path.join(REPO_ROOT, 'public', 'tekla', 'peb-member', 'downloads.json');

const fileName = (pkg, version) => `PEBToolsVN_${pkg}_v${version}.tsep`;

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function main() {
  const [publishDir, wantedVersion] = process.argv.slice(2);
  if (!publishDir || !fs.existsSync(publishDir)) {
    console.error('✗ Thiếu hoặc sai thư mục Publish.\n  Dùng: node scripts/update-peb-member-downloads.cjs "<thư mục Publish>" [phiên bản]');
    process.exitCode = 1;
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const packageIds = Object.keys(manifest.packages);

  // Chỉ nhận phiên bản có đủ gói cho MỌI mục trong manifest — tránh phát hành nửa vời
  // (vd. đang build dở, mới ra gói 2016).
  const names = fs.readdirSync(publishDir);
  const complete = [...new Set(names.map((n) => (n.match(/^PEBToolsVN_.+_v(\d+(?:\.\d+)*)\.tsep$/) || [])[1]).filter(Boolean))]
    .filter((v) => packageIds.every((id) => names.includes(fileName(id, v))))
    .sort(compareVersions);

  const version = wantedVersion || complete[complete.length - 1];
  if (!version || !complete.includes(version)) {
    console.error(`✗ Không tìm thấy đủ ${packageIds.length} gói (${packageIds.join(', ')}) cho phiên bản ${version || '(mới nhất)'} trong:\n  ${publishDir}`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });
  const keep = new Set(packageIds.map((id) => fileName(id, version)));
  for (const old of fs.readdirSync(DEST_DIR)) {
    if (old.endsWith('.tsep') && !keep.has(old)) {
      fs.rmSync(path.join(DEST_DIR, old));
      console.log(`  - xoá ${old}`);
    }
  }

  for (const id of packageIds) {
    const name = fileName(id, version);
    fs.copyFileSync(path.join(publishDir, name), path.join(DEST_DIR, name));
    const bytes = fs.statSync(path.join(DEST_DIR, name)).size;
    manifest.packages[id].file = name;
    manifest.packages[id].size = formatSize(bytes);
    // Dashboard /admin (public/admin/admin.js) nhân số byte này với số lượt tải để ước tính dung lượng.
    manifest.packages[id].bytes = bytes;
    console.log(`  + ${name} (${manifest.packages[id].size})`);
  }

  const previous = manifest.version;
  manifest.version = version;
  // Chạy lại cho cùng một phiên bản (vd. chép lại gói) thì giữ nguyên ngày phát hành.
  if (previous !== version) manifest.released = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`✔ downloads.json -> v${version} (ngày ${manifest.released}).`);
  if (previous !== version) {
    console.log('⚠ Nhớ viết lại "notes" (Có gì mới) trong downloads.json cho bản này, và cập nhật mảng "tekla" nếu phạm vi phiên bản Tekla hỗ trợ thay đổi.');
  }
}

main();
