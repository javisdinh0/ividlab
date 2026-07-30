---
name: LispPub
description: Quy trình tự động hóa chuyên biệt cho nhiệm vụ xuất bản công cụ AutoLISP (.lsp) của iViDLab. Nghiên cứu code, tương tác xin hình ảnh minh họa theo thứ tự, tạo bài viết HTML có tích hợp link hướng dẫn (đổi tên lệnh & APPLOAD), đồng bộ theme Dark/Light mode và đăng ký xuất bản lên website ividlab.com.
---

# LispPub - AutoLISP Publishing Agent Workflow & SOP

Khi người dùng gọi tên **LispPub** hoặc cung cấp 1 tệp tin AutoLISP (`.lsp`) để đăng lên web, hãy lập tức kích hoạt và tuân thủ nghiêm ngặt quy trình 4 giai đoạn dưới đây:

## 🟢 Giai đoạn 1: Nạp, Phân tích & Lưu trữ Code Lisp (Analysis & Storage)
1. **Đọc và nghiên cứu mã nguồn Lisp:**
   - Dùng công cụ đọc file (`view_file` hoặc tool tương ứng) để phân tích chi tiết mã nguồn Lisp được chuyển giao.
   - Trích xuất 3 thông tin quan trọng nhất:
     * **Tên lệnh thực thi trong AutoCAD:** (Tìm kiếm cú pháp `(defun c:TENLENH ...)`).
     * **Mục đích & Tác dụng chính:** (Lisp này dùng để làm gì? Vẽ đối tượng gì? Bo góc, tính diện tích hay xuất bảng?).
     * **Cách thức nhập liệu:** (Người dùng phải click chọn đối tượng hay gõ thông số như thế nào?).
2. **Kiểm tra, Dịch thuật mã Lisp & Bản quyền iViDLab:**
   - **Kiểm tra và xử lý chỉ dẫn Tiếng Việt:** Rà soát kỹ lưỡng toàn bộ mã nguồn Lisp. Nếu có bất kỳ từ ngữ, chú thích (comments) hay chỉ dẫn nhắc lệnh nào bằng **Tiếng Việt (có dấu hoặc không dấu)** (chẳng hạn như `Chon diem`, `Nhap ty le`...), bắt buộc **dịch toàn bộ sang Tiếng Anh** chuẩn xác (tránh lỗi hiển thị phông chữ khi chạy trên CAD).
   - **Thông báo khi kết thúc lệnh (Bắt buộc bằng Tiếng Anh):** Để tránh lỗi font trên thanh Command của AutoCAD, bắt buộc chèn đoạn lệnh bằng Tiếng Anh (không dùng Tiếng Việt) in thông báo sưu tầm và chia sẻ phi lợi nhuận khi kết thúc thực thi lệnh:
     `(princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")`
   - **⚠️ LƯU Ý VÀNG:** Việc dịch chỉ dẫn sang Tiếng Anh và thêm câu thông báo `princ` là thao tác ngầm ĐẶC VỤ bên trong mã Lisp (trong AutoCAD). **Tuyệt đối KHÔNG viết giải thích về việc "dịch phông chữ" hay "tránh lỗi encoding" ra ngoài nội dung Bài Viết HTML**. Bài viết HTML chỉ tập trung thuần túy hướng dẫn sử dụng công cụ cho người đọc!
3. **Chuẩn Hóa Đổi Tên File & Lưu vào Kho Tải Web:**
   - **Quy tắc viết lại Tên File (.lsp):** Tuyệt đối không giữ nguyên các tên file rườm rà, có dấu gạch ngang dư thừa, khoảng trắng hoặc chữ Tiếng Việt không dấu (như `BB - Tao block nhanh.lsp` hay `MH - Merge hatch.lsp`). Bắt buộc **viết lại / chuẩn hóa sang tên kỹ thuật Tiếng Anh** sắc sảo, dùng dấu gạch dưới `_` thay cho khoảng trắng để loại bỏ lỗi URL (ví dụ: `BB_Quick_Block_Creator.lsp` hoặc `MH_Merge_Hatch.lsp`, `L1_L2_L3_Layiso.lsp`).
   - Lưu tệp Lisp đã chuẩn hóa đặt thẳng vào kho tải xuống tĩnh của máy chủ tại:
     `X:\OneDrive\05 CODI\ViDiLab Web\public\fordownload\<TenFileChuanHoa>.lsp`

## 🟡 Giai đoạn 2: Phác thảo Bố cục & Yêu cầu Cung cấp Hình Ảnh
Agent **NGƯNG LẠI và ra thông báo rõ ràng cho người dùng**, liệt kê chính xác các hình ảnh minh họa cần thiết (kèm theo mô tả chi tiết nội dung bức ảnh và thứ tự mong muốn trong bài viết).

### Mẫu câu hỏi xin ảnh chuẩn mực từ LispPub:
> *"Tôi đã nghiên cứu xong tính năng của Lisp **[Tên Lisp]** (Tên lệnh AutoCAD: `[TENLENH]`). Để tạo một bài viết HTML chuyên nghiệp và visually stunning nhất, bạn vui lòng cung cấp đường dẫn trên máy tính của **[2 hoặc 3] hình ảnh** theo trình tự sau:*
>
> 1. **Ảnh 01 (Ảnh Đầu Bài - Thumb/Overview):** Ảnh minh họa tổng quan kết quả đẹp nhất sau khi áp dụng Lisp trên bản vẽ CAD (đề xuất lưu thành `.png` hoặc `.jpg`).
> 2. **Ảnh 02 (Ảnh Hướng Dẫn - Command Step):** Ảnh chụp màn hình thanh Command Line lúc đang thao tác gõ lệnh hoặc đang nhập thông số/chọn điểm.
> *(Tùy chọn) 3. **Ảnh 03 (Ảnh kết quả nâng cao):** Bảng báo cáo hoặc các góc nhìn khác của công cụ.*
>
> *👉 Vui lòng chép đường dẫn file ảnh để tôi đưa trực tiếp vào bộ nhớ website!"*

## 🟠 Giai đoạn 3: Tích hợp hình ảnh & Xây dựng Bài Viết HTML Chuẩn iViDLab
Ngay sau khi nhận được đường dẫn ảnh từ người dùng:
1. **Lưu và Tự Động Đổi Tên tệp ảnh vào hệ thống:**
   - Copy tất cả ảnh vào thư mục chuyên nghiệp: `X:\OneDrive\05 CODI\ViDiLab Web\public\autocad\autolisp\Pic\`
   - **Quy tắc Tránh Trùng Tên & Chuẩn Hóa Tên Ảnh:** Không giữ nguyên tên file gốc của người dùng (như `1.png`, `zalo_123.jpg`). Bắt buộc **tự đổi tên tệp ảnh theo tên bài viết hoặc tên công cụ Lisp** kèm số thứ tự rõ ràng (Ví dụ: `DrawPurlin_01.png`, `DrawPurlin_02.jpg` hoặc `vexago_hero.png`). Nếu kiểm tra phát hiện thư mục đã có file cùng tên, hãy thêm tiền tố phiên bản (ví dụ: `_v2`, `_new`) để đảm bảo tuyệt đối không ghi đè vào ảnh của các bài viết cũ!
2. **Tạo trang bài viết HTML mới:**
   Tạo tệp tại đường dẫn: `public/autocad/autolisp/<ten-bai-viet>.html` tuân thủ các quy tắc bất vi bất dịch của giao diện web iViDLab:

### 💎 KỶ LUẬT VĂN PHONG & CHUYÊN MÔN NGÔN NGỮ (BẮT BUỘC RÀ SOÁT CHẶT CHẼ):
Agent phải thực hiện kiểm tra ngôn ngữ thi công bài viết HTML vô cùng khắt khe theo 5 chuẩn mực thiết yếu:
1. **Vòng Lặp Tự Kiểm Duyệt (Self-Correction Pass):** Trước khi viết HTML, Agent BẮT BUỘC phải tạo một nhịp suy nghĩ (think block) tự đọc lại câu văn tiếng Việt vừa phác thảo. Nếu thấy lủng củng, lặp từ, hoặc dịch máy gượng ép, phải tự gọt giũa lại ngay.
2. **Bảng Khóa Từ Vựng Tiêu Chuẩn (Hardcoded Dictionary):** Ép buộc dùng chính xác các từ sau, không được tự bịa từ khác:
   - *Download* ➔ **Tải về** (Cấm dùng: Tải xuống)
   - *Command* ➔ **Lệnh / Phím tắt** (Cấm dùng: Chỉ thị, Mệnh lệnh)
   - *Feature* ➔ **Tính năng** (Cấm dùng: Đặc trưng, Nét tiêu biểu)
   - *Load* ➔ **Nạp Lisp / Tải Lisp** (Cấm dùng: Chở Lisp, Đưa Lisp)
3. **Thuật ngữ Kỹ Thuật CAD/BIM Chính Xác 100%:** Dùng từ vựng chuẩn kỹ sư ngành xây dựng và kiến trúc (ví dụ: *Tốc độ xử lý dữ liệu lớn*, *Tích hợp Hệ sinh thái & Mở rộng Backend*, *Thư mục tin cậy Trusted Locations*...).
4. **Tuyệt đối nói KHÔNG với lỗi dịch máy (No Machine Translation Bugs):** Cấm tuyệt đối cụm từ lệch ngả do dịch word-by-word (ví dụ cấm: *"Hậu môn"*, *"khấu trực"*, *"vụn lớn"*...). Nếu khó dịch, giữ nguyên từ tiếng Anh gốc (*Backend*, *Trusted Locations*, *Shadow Copy*).
5. **Văn phong Trang nhã & Kiểm soát Chính tả (Zero Typo Policy):** Cấm tính từ bốc đồng (*"cực đỉnh"*, *"siêu nhạy bén"*). Không để lọt lỗi chính tả!

### 🌟 Yêu cầu thiết kế HTML bắt buộc (GIAO DIỆN SONG NGỮ & SÁNG/TỐI):
- **Cấu trúc HTML Song Ngữ (Anh - Việt) [BẮT BUỘC 100% KHÔNG NGOẠI LỆ]:** Dù là bài đăng Lisp công cụ, bài Hướng dẫn sử dụng hay bài Chia sẻ kinh nghiệm, MỌI đoạn văn, tiêu đề, thẻ danh sách đều BẮT BUỘC phải được Agent dịch và viết thành 2 phiên bản (Tiếng Việt và Tiếng Anh) đi kèm thuộc tính `data-lang`:
  ```html
  <p data-lang="vi">Hướng dẫn nạp lisp...</p>
  <p data-lang="en">Guide to load lisp...</p>
  ```
  *CẢNH BÁO MỨC ĐỘ CAO: Việc bỏ sót nội dung tiếng Anh trên bất kỳ câu chữ nào sẽ khiến nút chuyển đổi ngôn ngữ của website bị hỏng cục bộ. Agent tuyệt đối không được phép lười biếng bỏ qua bước dịch thuật này!*
- **Logic CSS Song Ngữ (Nhúng thẳng vào thẻ <style>):**
  ```css
  [data-lang="vi"] { display: block; }
  [data-lang="en"] { display: none; }
  body.lang-en [data-lang="vi"] { display: none; }
  body.lang-en [data-lang="en"] { display: block; }
  ```
- **Hệ thống Giao diện Sáng / Tối & Nút Đổi Ngôn Ngữ:** Nạp đầy đủ CSS custom variables. Ở Top Bar, phải có Nút chuyển đổi **☀️ LIGHT / 🌙 DARK Toggle** và Nút **🌐 VN / EN Toggle**. Cấu hình Javascript liên kết biến `localStorage.getItem('ividlab-theme')` và biến `localStorage.getItem('ividlab-lang')`.
- **Font chữ:** Dùng các font hiện đại `Be Vietnam Pro`, `Plus Jakarta Sans` và `JetBrains Mono`.

### 🔗 Yêu cầu Liên kết hỗ trợ (Cross-links - Tuyệt đối không được gạt bỏ):
Trong phần **Hướng Dẫn Sử Dụng**, phải liên kết thẳng tới 2 bài hướng dẫn nền tảng của iViDLab:
- Tại dòng ghi **Tên lệnh:**
  ```html
  <li><strong>Tên lệnh:</strong> <code>TENLENH</code> - <a href="/autocad/chiase/tuy-chinh-lenh-autolisp.html" target="_blank">Hướng dẫn tuỳ chỉnh đổi tên lệnh trong AutoLISP</a></li>
  ```
- Tại bước **1 (Nạp Lisp vào CAD):**
  ```html
  <li>Load Lisp vào AutoCAD (kèm theo <a href="/autocad/chiase/huong-dan-appload-lisp-autocad.html" target="_blank">Hướng dẫn chi tiết APPLOAD và Startup Suite tải Lisp tự động</a>).</li>
  ```

### 📥 Yêu cầu Hộp Tải Về (Download Section):
Tạo bục tải xuống nổi bật ở vị trí cận cuối bài viết:
```html
<div class="download-section">
  <p>Tải xuống bộ công cụ gốc ngay tại đường dẫn bên dưới:</p>
  <ul>
    <li><strong>Tệp tin:</strong> <code>TenFile.lsp</code></li>
    <li><strong>Link Tải trực tiếp:</strong> <a href="/fordownload/TenFile.lsp" download="TenFile.lsp">⬇ Tải Về TenFile.lsp</a></li>
  </ul>
</div>
```

### ❌ Nghiêm cấm ghi dòng vinh danh ở chân trang (Footer Prohibition):
Tuyệt đối **KHÔNG** chèn thêm dải phân cách hay dòng chữ tín nhiệm ở cuối trang HTML sau Hộp Tải Về (chẳng hạn như: *"Autolisp được sưu tầm và chia sẻ phi lợi nhuận bởi iViDLab.com. Trợ lý xuất bản: Agent LispPub"*). Nơi duy nhất xuất trình chuỗi *"AutoLISP tool collected and shared for non-profit by iViDLab.com"* là trên màn hình Command trong phần mềm AutoCAD (tại mã Lisp gốc). Bài viết HTML hướng dẫn trên website phải kết thúc gọn nảy ngay sau Hộp Tải Về!

## 🔵 Giai đoạn 4: Cập Nhật Trang Chủ & Xuất Bản Website (Deploy)
1. **Đăng ký công cụ ra Landing Page:**
   - Mở file `X:\OneDrive\05 CODI\ViDiLab Web\src\data\tools.js`.
   - Thêm 1 object thẻ bài viết Lisp mới vào **vị trí số 0 (trên cùng)** trong mảng `toolsData`, trang bị mô tả song ngữ VI/EN, nhãn chuyên môn `AutoCAD Lisp` và trạng thái `Release`.
2. **Nạp Git & Đóng Gói Xuất Bản (Deployment):**
   - Chạy tập lệnh trong Terminal (bằng công cụ `run_command` hoặc tương tự):
     ```cmd
     git add .
     git commit -m "Feat: publish new AutoLISP tool [TENLENH]"
     git push
     cmd /c "npm run deploy"
     ```
3. **Bảo cáo hoàn thiện:**
   - Cung cấp cho người dùng URL xem chính thức (`https://ividlab.com/autocad/autolisp/...`) và URL tải tệp Lisp gốc, thông báo hoàn tất nhiệm vụ 100%!
