# Tài khoản đăng nhập dùng chung — Portal dinhtieuthuong (SSO)

Toàn bộ trang trong `dinhtieuthuong/` (cổng, admin khảo sát, công cụ thống kê điểm)
xác thực theo **một bảng tính duy nhất**: **"User Admin"**. Đăng nhập một lần dùng
được mọi trang (Single Sign-On), vì các trang chia sẻ chung phiên đăng nhập.

## 1. Bảng "User Admin"
Sheet đầu tiên có hàng tiêu đề (đúng tên, không phân biệt hoa/thường):

| Admin account | Admin Password | User account | User password |
|---|---|---|---|
| `admin@lop.edu.vn` | `matkhau_admin` | `gv@lop.edu.vn` | `matkhau_user` |

- **Admin account / Admin Password**: tài khoản quyền quản trị (vai trò `admin`).
- **User account / User password**: tài khoản phụ, vai trò `user` (tuỳ chọn — để trống nếu chỉ dùng 1 admin).
- Đăng nhập bằng **email = account** + **mật khẩu** tương ứng. Email không phân biệt hoa/thường.
- Có thể thêm nhiều dòng nếu muốn nhiều cặp tài khoản (mỗi dòng đọc cả cặp admin + user).

> **Mật khẩu để dạng chữ thường (plaintext) trong bảng này.** Trình duyệt chỉ gửi
> SHA-256 của mật khẩu qua mạng; máy chủ tự băm mật khẩu trong bảng để so khớp
> (không lưu/không truyền mật khẩu gốc ra ngoài). Vì vậy **giữ bảng này ở chế độ
> riêng tư** — chỉ chia sẻ cho tài khoản Google của bạn, không đặt "Anyone".

## 2. ID của bảng "User Admin" — ĐÃ GẮN SẴN
ID bảng đã được ghi sẵn trong code (biến `USERS_SHEET_ID_DEFAULT`):
```
1txdkgSiqsctvI3HAXgRyPZjKJIQLIUJr08fVzbb3ypo
```
Cả hai backend ([admin/Code.gs](./admin/Code.gs) và
[congcuthongkediem/Code.gs](./congcuthongkediem/Code.gs)) mặc định dùng ID này, nên
**không bắt buộc** thêm Script property. Nếu sau này đổi sang bảng khác, chỉ cần sửa
biến `USERS_SHEET_ID_DEFAULT` trong code, hoặc thêm Script property để ghi đè:

| Property | Value |
|---|---|
| `USERS_SHEET_ID` | ID bảng khác (ghi đè giá trị mặc định) |
| `USERS_SHEET_NAME` | *(tuỳ chọn)* tên sheet chứa tài khoản; bỏ trống = sheet đầu tiên |

> Khi có `USERS_SHEET_ID` (mặc định hoặc từ property), hệ thống **bỏ qua**
> `ADMIN_PASSWORD` cũ và chỉ dùng bảng "User Admin".

## 4. Cấp quyền & deploy lại (QUAN TRỌNG)
Vì backend giờ đọc **một bảng tính khác** qua `openById`, Apps Script cần quyền rộng hơn:
1. Đảm bảo tài khoản Google **đang deploy** (mục *Execute as: Me*) có quyền xem bảng "User Admin".
2. Trong mỗi dự án: **Deploy → Manage deployments → (chọn) → Edit → Version: New version → Deploy**.
3. Lần đầu sẽ hiện **Authorize access** — cấp quyền cho phạm vi bảng tính. URL `/exec` **không đổi**.

## 5. Kiểm tra
- Vào `dinhtieuthuong/` → đăng nhập bằng **Admin account + Admin Password**.
- Bấm sang **Bảng điều khiển Admin** và **Công cụ thống kê điểm** → **không phải đăng nhập lại** (SSO).
- Thử tài khoản sai mật khẩu → bị từ chối.

## Đổi mật khẩu / thêm–bớt người
Chỉ cần sửa trực tiếp trong bảng **"User Admin"** — có hiệu lực ngay cho tất cả các trang,
không phải sửa code hay deploy lại. (Người đang đăng nhập sẽ bị đăng xuất khi phiên hết hạn
hoặc khi họ tải lại trang.)

## Ghi chú vai trò
Hiện `admin` và `user` đều đăng nhập & xem được như nhau; vai trò được máy chủ trả về
(`role`) và lưu trong phiên, sẵn sàng để giới hạn quyền của `user` sau này nếu cần
(ví dụ: chỉ xem, không sửa/không xoá). Báo nếu bạn muốn bật giới hạn đó.
