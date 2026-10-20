#!/usr/bin/env node
'use strict';
/**
 * Deploy dist/ lên nhánh gh-pages — thay thế cho package `gh-pages` (bị lỗi
 * trên máy này: nó spawn git với stdio dạng pipe, khiến Git Credential Manager
 * không prompt được → "Cannot prompt because user interactivity has been
 * disabled". Script này spawn git với stdio: 'inherit' nên credential helper
 * hoạt động bình thường, dù chạy từ PowerShell hay Git Bash.
 *
 * Dùng: npm run deploy [-- "Commit message tuỳ chọn"]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');
const DIST = path.join(REPO_ROOT, 'dist');

function run(cmd, cwd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: cwd || REPO_ROOT, stdio: 'inherit' });
}

function findLeaked(dir) {
  const exts = ['.rules', '.gs', '.md'];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findLeaked(full));
    else if (exts.some((e) => entry.name.endsWith(e))) results.push(full);
  }
  return results;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('✗ dist/ không tồn tại — build trước khi deploy (predeploy hook lẽ ra đã chạy npm run build).');
    process.exitCode = 1;
    return;
  }

  const leaked = findLeaked(DIST);
  if (leaked.length) {
    console.error('✗ Phát hiện file nội bộ lọt vào dist/ — DỪNG deploy để tránh lộ lên site:\n' + leaked.join('\n'));
    process.exitCode = 1;
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ividlab-gh-pages-'));
  console.log(`Worktree tạm: ${tmp}`);

  try {
    run('git fetch origin gh-pages');
    run(`git worktree add -B gh-pages "${tmp}" origin/gh-pages`);

    for (const entry of fs.readdirSync(tmp)) {
      if (entry === '.git') continue;
      fs.rmSync(path.join(tmp, entry), { recursive: true, force: true });
    }
    fs.cpSync(DIST, tmp, { recursive: true });

    run('git add -A', tmp);
    run('git status --short', tmp);

    let hasChanges = true;
    try {
      execSync('git diff --cached --quiet', { cwd: tmp });
      hasChanges = false;
    } catch {
      // exit code != 0 nghĩa là CÓ thay đổi đang staged — đúng như mong đợi
    }

    if (!hasChanges) {
      console.log('✔ Không có gì thay đổi — dist/ đã khớp origin/gh-pages, không cần deploy.');
      return;
    }

    const mainHash = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();
    const msg = (process.argv[2] || `Deploy (main ${mainHash})`).replace(/"/g, '\\"');
    run(`git -c core.autocrlf=false commit -m "${msg}"`, tmp);
    run('git push origin gh-pages', tmp);
    console.log('✔ Deploy xong. GitHub Pages build lại sau ~1-2 phút.');
    purgeCloudflareLater();
  } finally {
    try {
      run(`git worktree remove "${tmp}" --force`);
    } catch (e) {
      console.error('⚠ Dọn worktree tạm lỗi (không nghiêm trọng):', e.message);
    }
    try {
      execSync('git branch -D gh-pages', { cwd: REPO_ROOT, stdio: 'ignore' });
    } catch {
      // nhánh cục bộ "gh-pages" có thể không tồn tại nếu bước trên đã fail sớm — bỏ qua
    }
  }
}

// Xoá cache Cloudflare sau khi GitHub Pages build xong — cần khi đã bật Cache Rule cache HTML ở edge
// (docs/cloudflare-cache.md). Chỉ chạy nếu có biến môi trường CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID
// (đặt ở biến môi trường User, KHÔNG để trong repo/OneDrive). Purge sớm quá thì edge lại cache bản cũ
// từ GitHub Pages, nên đợi CF_PURGE_DELAY giây (mặc định 90).
function purgeCloudflareLater() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) {
    console.log('ℹ Bỏ qua xoá cache Cloudflare (chưa đặt CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID).');
    return;
  }
  const delay = Number(process.env.CF_PURGE_DELAY || 90);
  console.log(`… Đợi ${delay}s cho GitHub Pages build rồi xoá cache Cloudflare (Ctrl+C để bỏ qua).`);
  setTimeout(async () => {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ purge_everything: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) console.log('✔ Đã xoá cache Cloudflare.');
      else console.error('⚠ Xoá cache Cloudflare lỗi:', res.status, JSON.stringify(body.errors || body));
    } catch (e) {
      console.error('⚠ Xoá cache Cloudflare lỗi:', e.message);
    }
  }, delay * 1000);
}

main();
