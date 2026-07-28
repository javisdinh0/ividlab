/**
 * ViDiLab — Khảo sát 10T0 : Google Apps Script (BACKEND)
 * ------------------------------------------------------------------
 * File này là "máy chủ" thật của hệ thống. Nó làm 2 việc:
 *   1) Nhận bài khảo sát từ trang phụ huynh (doPost, không cần mật khẩu).
 *   2) Trả dữ liệu cho trang admin CHỈ KHI mật khẩu đúng (xác thực phía server).
 *
 * ĐIỂM KHÁC BIỆT BẢO MẬT so với bản cũ:
 *   - Bản cũ: GET /exec -> trả TOÀN BỘ dữ liệu, không cần mật khẩu (ai cũng lấy được).
 *   - Bản này: muốn lấy dữ liệu phải POST kèm mật khẩu đúng; sai -> 401, không trả gì.
 *
 * CÀI ĐẶT (làm 1 lần) — xem chi tiết trong DEPLOY_BAO_MAT.md:
 *   1. Mở Google Sheet chứa dữ liệu -> Extensions -> Apps Script.
 *   2. Dán toàn bộ file này vào (thay cho code cũ).
 *   3. Project Settings -> Script properties -> thêm:
 *        ADMIN_PASSWORD = <mật khẩu admin bạn muốn>
 *        (tuỳ chọn) SHEET_NAME = <tên sheet chứa dữ liệu; bỏ trống = sheet đầu tiên>
 *   4. Deploy -> New deployment -> Web app:
 *        Execute as: Me
 *        Who has access: Anyone
 *      Copy URL /exec dán vào admin/index.html (biến SCRIPT_URL).
 */

// Các cột cố định luôn đứng đầu bảng
var FIXED_COLS = ['Thời gian', 'Họ Tên Con', 'Email Phụ Huynh'];

/** Lấy sheet dữ liệu (theo Script property SHEET_NAME, mặc định sheet đầu tiên). */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');
  if (name) {
    var s = ss.getSheetByName(name);
    if (s) return s;
  }
  return ss.getSheets()[0];
}

/** SHA-256 -> chuỗi hex (khớp với crypto.subtle.digest ở phía trình duyệt). */
function sha256Hex_(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/** Trả JSON (có thể đọc cross-origin từ trang admin). */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET: không trả dữ liệu nhạy cảm. Chỉ báo endpoint còn sống.
 * (Đây chính là chỗ bản cũ bị lộ toàn bộ dữ liệu — nay đã đóng lại.)
 */
function doGet() {
  return json_({ ok: true, service: 'ividlab-khaosat-10t0', message: 'Endpoint hoạt động. Dữ liệu chỉ truy cập qua POST + mật khẩu.' });
}

/**
 * POST:
 *   - action === 'login'  -> xác thực rồi trả dữ liệu.
 *   - còn lại (có studentName/dataJSON) -> ghi bài khảo sát mới.
 */
function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'BAD_JSON' });
  }

  if (body.action === 'login') {
    return handleLogin_(body);
  }
  return handleSubmit_(body);
}

/** Xác thực admin phía server rồi trả dữ liệu bảng. */
function handleLogin_(body) {
  var props = PropertiesService.getScriptProperties();
  var stored = props.getProperty('ADMIN_PASSWORD');
  if (!stored) {
    return json_({ ok: false, error: 'SERVER_NOT_CONFIGURED' });
  }
  // Nếu có đặt ADMIN_EMAIL thì bắt buộc email phải khớp (không phân biệt hoa/thường).
  var storedEmail = props.getProperty('ADMIN_EMAIL');
  if (storedEmail) {
    var incomingEmail = (body.email || '').toString().trim().toLowerCase();
    if (incomingEmail !== storedEmail.trim().toLowerCase()) {
      return json_({ ok: false, error: 'INVALID_CREDENTIALS' });
    }
  }
  // Client gửi SHA-256(mật khẩu) — mật khẩu gốc không bao giờ đi qua mạng.
  var expected = sha256Hex_(stored);
  var incoming = (body.passHash || '').toLowerCase();
  if (incoming !== expected) {
    return json_({ ok: false, error: 'INVALID_CREDENTIALS' });
  }

  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  // Chuẩn hoá thành chuỗi để JSON gọn và trang admin xử lý như cũ.
  var data = values.map(function (row) {
    return row.map(function (c) {
      if (c instanceof Date) return c.toISOString();
      return c === null || c === undefined ? '' : c;
    });
  });
  return json_({ ok: true, data: data });
}

/** Ghi một bài khảo sát mới; tự tạo cột theo key nếu chưa có. */
function handleSubmit_(body) {
  var name = (body.studentName || '').toString();
  var email = (body.studentEmail || '').toString();
  var survey = {};
  try {
    survey = JSON.parse(body.dataJSON || '{}');
  } catch (err) {
    survey = {};
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // tránh 2 người gửi cùng lúc ghi đè nhau
  try {
    var sheet = getSheet_();

    // Đảm bảo có hàng tiêu đề
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    if (headers.length === 0 || headers.join('') === '') {
      headers = FIXED_COLS.slice();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Bản đồ tiêu đề -> chỉ số cột (1-based)
    var colIndex = {};
    headers.forEach(function (h, i) { colIndex[h] = i + 1; });

    function ensureCol(headerName) {
      if (colIndex[headerName]) return colIndex[headerName];
      var idx = headers.length + 1;
      sheet.getRange(1, idx).setValue(headerName);
      headers.push(headerName);
      colIndex[headerName] = idx;
      return idx;
    }

    // Gom giá trị cho từng cột
    var rowObj = {};
    rowObj['Thời gian'] = new Date();
    rowObj['Họ Tên Con'] = name;
    rowObj['Email Phụ Huynh'] = email;

    Object.keys(survey).forEach(function (key) {
      var entry = survey[key] || {};
      var parts = [].concat(entry.checked || [], entry.text || [])
        .map(function (s) { return (s || '').toString().trim(); })
        .filter(function (s) { return s; });
      rowObj[key] = parts.join(', ');
    });

    // Chốt vị trí cột (tạo mới nếu cần) rồi ghi 1 hàng
    Object.keys(rowObj).forEach(ensureCol);
    var width = headers.length;
    var newRow = new Array(width).fill('');
    Object.keys(rowObj).forEach(function (k) {
      newRow[colIndex[k] - 1] = rowObj[k];
    });
    sheet.appendRow(newRow);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
