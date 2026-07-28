# TÀI LIỆU QUY TRÌNH HÀNH ĐỘNG CHUẨN (SOP) CỦA AGENT: `LispPub`

Tài liệu này quy định tiêu chuẩn vận hành và quy trình thao tác chuẩn (SOP - Standard Operating Procedure) cho Trợ lý lập trình tự động hóa chuyên sâu **LispPub** (AutoLISP Publishing Specialist) của đội ngũ kỹ sư **iViDLab**.

---

## 🎯 Mục Tiêu Nghiệp Vụ
Tối ưu hóa và tự động hóa chuỗi cung ứng sản phẩm công cụ AutoLISP từ máy tính kỹ sư lên web:
1. Tiếp nhận file `.lsp` & Phân tích chuyên môn.
2. Tương tác xin ảnh minh họa theo vị trí kịch bản rõ ràng.
3. Xuất xưởng trang bài viết HTML thế hệ mới hỗ trợ đồng bộ Sáng / Tối (Light/Dark Mode).
4. Chuẩn hóa liên kết kỹ thuật và tải xuống trực tiếp từ hệ thống CDN của web.
5. Cập nhật trang chủ và Đóng gói phát hành web.

---

## 📋 CÁC BƯỚC THỰC THI CHI TIẾT CỦA AGENT

### 🟢 Bước 1: Tiếp nhận, Nghiên cứu & Dịch chuyển Tài nguyên Lisp
- **Phân tích cú pháp:** Đọc hiểu code AutoLISP để nắm được:
  - Hàm lệnh gõ trong AutoCAD (Tìm biến thể của cú pháp `(defun c:TENLENH)`).
  - Tác dụng, đối tượng thiết kế tác động (Xà gồ, Thép, PEB, Dầm, Block, Dim...).
  - Cách vận hành của lệnh và trải nghiệm thao tác phác đồ của người dùng.
- **Kiểm tra mã Lisp & Chuẩn hóa thông báo thương hiệu:**
  - **Dịch sang Tiếng Anh toàn bộ chỉ dẫn Tiếng Việt:** Kiểm tra chi tiết nội dung file Lisp, nếu xuất hiện bất kỳ chú giả hay dòng nhắc chỉ dẫn nào bằng **Tiếng Việt (có dấu hoặc không dấu)** thì bắt buộc phải **dịch toàn bộ sang Tiếng Anh** để tránh xung đột bảng mã encoding trong AutoCAD.
  - **Tích hợp thông báo tại màn hình Command AutoCAD (Bắt buộc bằng Tiếng Anh):** Ngay trước khi kết thúc lệnh (trước thẻ đóng của `defun c:...`), bắt buộc in chuỗi thông báo bản quyền sưu tầm phi lợi nhuận bằng Tiếng Anh để chống tuyệt đối lỗi phông CAD:  
    `(princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")`
  - **⚠️ LƯU Ý VÀNG VỀ NỘI DUNG BÀI VIÊT WEB:** Thao tác dịch sang Tiếng Anh và cài chuỗi bản quyền là việc của lập trình viên trong tệp `.lsp` (chạy trên CAD). **Tuyệt đối KHÔNG đưa các giải thích mang tính kỹ thuật hậu trường này (như "tối ưu phông chữ", "chống lỗi encoding") vào bài viết giới thiệu/hướng dẫn trên Website**. Bài viết chỉ tập trung giới thiệu tính năng và hướng dẫn thao tác lệnh nhanh, gọn, trong sáng!
- **Lưu trữ tài nguyên:** 
  - Lưu file thẳng vào máy chủ web ở thư mục tải xuống tĩnh:  
    `public\fordownload\<TenFile>.lsp`

### 🟡 Bước 2: Dừng & Xin Cung Cấp Hình Ảnh Minh Họa Theo Kịch Bản
Ngay sau Bước 1, Agent không đoán mò ảnh mà phải tạm dừng thực thi, chủ động đặt một câu hỏi ngắn gọn tới Kỹ Sư / Người Dùng để xin file hình ảnh.

**Kịch bản liệt kê yêu cầu ảnh như sau:**
1. **Ảnh 01 (Ảnh Thumb / Đầu bài):** Hình minh họa kết quả thiết kế thành công của Lisp (Ảnh chất lượng, khổ vuông hoặc chữ nhật ngang).
2. **Ảnh 02 (Ảnh minh họa thao tác lệnh):** Ảnh chụp màn hình dòng lệnh (Command prompts) hoặc thao tác lựa chọn tham số.
3. **Ảnh 03 (Tùy chọn):** Ảnh chụp bản vẽ thi công hoàn chỉnh hoặc kết quả sau xuất mảng.
👉 *Người dùng chỉ cần thả đường dẫn ổ cứng chứa ảnh, Agent sẽ tự thọc tay hút ảnh về đúng kho chuyên mục!*

### 🟠 Bước 3: Tạo Bài Viết HTML Hướng Dẫn Chuẩn Mực
- **Hút và Tự động đổi tên ảnh vào kho chuyên mục:**  
  - Lưu vào: `public\autocad\autolisp\Pic\`
  - **Quy tắc chống trùng & Chuẩn hóa tên file:** Tuyệt đối không để nguyên các tên ảnh chung chung (như `ảnh 1.png`, `image.jpg`). Agent bắt buộc **tự động đặt tên lại cho file ảnh dựa theo tên bài viết/công cụ Lisp** đang triển khai kèm số thứ tự (ví dụ: `TenLisp_01.png`, `TenLisp_02.jpg`). Nếu tên vừa đặt vẫn bị trùng với một file đã có từ trước trong thư mục `Pic`, tự động hậu tố số phiên bản (`_v2`, `_rev1`) để ngăn cản việc ghi đè sai lệch dữ liệu!
- Thiết lập một file bài viết HTML độc lập mới tại:  
  `public\autocad\autolisp\<ten-bai-viet-lisp>.html`
- **Quy tắc Giao diện Trang bài viết:**
  - Sử dụng chung bộ CSS Custom Variables **Ocean Navy & Ice Blue** từ trang mẹ (`#A2BFC7` cho Sáng, `#182B37` cho Tối).
  - Thanh Navigation phía đỉnh có gắn Nút chuyển chế độ **☀️ LIGHT / 🌙 DARK Toggle**, đọc trích xuất từ biến lưu đệm `localStorage.getItem('ividlab-theme')`.
- **2 Vị Trí Gắn Liên Kết Chéo (Cross-Linking) Không Thể Bỏ Xót:**
  1. Tại mô tả tên lệnh Lisp, gắn liên kết Hướng Dẫn Tùy Chỉnh Lệnh:
     - Text Link: *Hướng dẫn tuỳ chỉnh đổi tên lệnh trong AutoLISP*
     - Hướng tới: `/autocad/chiase/tuy-chinh-lenh-autolisp.html`
  2. Tại mô tả bước Load file vào AutoCAD, gắn liên kết Hướng Dẫn Nạp Lisp:
     - Text Link: *Hướng dẫn APPLOAD và Startup Suite tải Lisp tự động vào CAD*
     - Hướng tới: `/autocad/chiase/huong-dan-appload-lisp-autocad.html`
- **Hộp thông tin Tải về:**
  - Nằm giáp cuối trang bài viết, có khung viền bao quanh sang trọng và một nút bám `⬇ Tải Về <TenFile>.lsp` trỏ thẳng tới thư mục gốc `/fordownload/<TenFile>.lsp`.

### 🔵 Bước 4: Nạp Cập Nhật Ra Trang Chủ & Xuất Bản Website (Deployment)
- Mở danh mục cơ sở dữ liệu `src\data\tools.js`.
- Khai báo 1 Card mới mô tả công cụ vừa chế tạo vào **ngay đỉnh danh sách `toolsData` (Vị trí số 0)** với thông số:
  - Chuyên mục: `AutoCAD Lisp`
  - Trạng thái: `Release`
  - Link liên kết: `<đường dẫn HTML vừa làm>`
- Automated Deploy (Thông qua Terminal):
  ```bat
  git add .
  git commit -m "Feat (LispPub): Release new tool [TenLisp]"
  git push
  cmd /c "npm run deploy"
  ```
- Hoàn thành quy trình và báo cho người dùng đường link truy cập trực tuyến trên trang chủ `https://ividlab.com/`.

---
*Tài liệu thuộc sở hữu trí tuệ của đội ngũ iViDLab. Lưu file này trong gốc thư mục dự án để duy trì chuẩn mực đồng bộ trong suốt chu kỳ phát triển.*
