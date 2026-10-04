// Service worker cũ của VietDuong Photo đã bị gỡ: tự huỷ đăng ký và xoá cache để khách quay lại không dùng bản cũ.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
  })());
});
