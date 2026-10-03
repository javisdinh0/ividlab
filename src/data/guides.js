export const guidesData = [
  {
    id: 'tuy-chinh-lenh-autolisp',
    title: 'Hướng Dẫn Tùy Chỉnh & Đổi Tên Lệnh AutoLISP (.lsp)',
    category: 'AutoLISP Tutorial',
    tag: 'Thủ Thuật CAD',
    description: {
      vi: 'Hướng dẫn chi tiết từng bước cách tự mở, chỉnh sửa mã file Lisp bằng Notepad để đổi tên lệnh custom siêu ngắn và an toàn theo thói quen cá nhân.',
      en: 'Comprehensive step-by-step tutorial on how to edit AutoLISP (.lsp) command names safely using text editors to customize your AutoCAD shortcuts.'
    },
    date: 'July 2026',
    link: '/autocad/chiase/tuy-chinh-lenh-autolisp.html'
  },
  {
    id: 'huong-dan-appload',
    title: 'Hướng Dẫn APPLOAD & Startup Suite Nạp Lisp Tự Động Vào CAD',
    category: 'AutoLISP Tutorial',
    tag: 'Tải Lisp',
    description: {
      vi: 'Cách dùng lệnh AP (Appload) để tải các file .lsp, .fas, .vlx vào AutoCAD và thiết lập Startup Suite (Contents) để tự động nạp Lisp vĩnh viễn mỗi khi mở phần mềm.',
      en: 'Guide to loading .lsp, .fas, .vlx files using the APPLOAD command and configuring Startup Suite for permanent automated startup loads.'
    },
    date: 'July 2026',
    link: '/autocad/chiase/huong-dan-appload-lisp-autocad.html'
  },
  {
    id: 'huong-dan-netload',
    title: 'Hướng Dẫn NETLOAD Nạp Plugin DLL (.NET API) Trong AutoCAD',
    category: 'Plugin .NET',
    tag: 'Nâng Cao',
    description: {
      vi: 'Quy trình chuẩn nạp Plugin .DLL biên dịch từ C#/VB.NET vào AutoCAD bằng lệnh NETLOAD, các thao tác Unblock bảo mật và lưu ý về hiện tượng khóa file.',
      en: 'Standard workflow for loading custom C#/VB.NET DLL assemblies using NETLOAD, unblocking downloaded assemblies, and handling lock file states.'
    },
    date: 'July 2026',
    link: '/autocad/chiase/huong-dan-netload-dll-autocad.html'
  },
  {
    id: 'phan-biet-appload-netload',
    title: 'Phân Biệt & Khi Nào Dùng APPLOAD vs NETLOAD Trong AutoCAD?',
    category: 'Kiến Thức CAD',
    tag: 'So Sánh',
    description: {
      vi: 'Bảng đối chiếu toàn diện bản chất kỹ thuật, ưu nhược điểm và ứng dụng thực tế để bạn phân biệt rõ ràng khi nào sử dụng APPLOAD (Lisp/ARX) hay NETLOAD (DLL).',
      en: 'Comprehensive comparison table clarifying the technical differences, pros/cons, and ideal scenarios for choosing between APPLOAD and NETLOAD.'
    },
    date: 'July 2026',
    link: '/autocad/chiase/phan-biet-appload-va-netload-trong-autocad.html'
  },
  {
    id: 'lisp-khong-chay-unknown-command-autocad',
    title: 'Lisp Không Chạy, Báo "Unknown Command" Trong AutoCAD: Nguyên Nhân & Cách Sửa',
    category: 'AutoLISP Tutorial',
    tag: 'Sửa Lỗi',
    description: {
      vi: 'Nạp file .lsp bằng APPLOAD xong nhưng gõ lệnh vẫn báo Unknown command? Danh sách nguyên nhân thường gặp và cách kiểm tra từng bước, từ tên lệnh c: đến cảnh báo bảo mật.',
      en: 'Loaded a .lsp file with APPLOAD but the command still says Unknown command? Common causes and a step-by-step checklist.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/lisp-khong-chay-unknown-command-autocad.html'
  },
  {
    id: 'trusted-paths-secureload-autocad',
    title: 'Cảnh Báo Bảo Mật Khi Nạp Lisp/DLL Trong AutoCAD: TRUSTEDPATHS & SECURELOAD',
    category: 'Kiến Thức CAD',
    tag: 'Cài Đặt',
    description: {
      vi: 'Giải thích biến SECURELOAD và TRUSTEDPATHS, cách thêm thư mục vào vùng tin cậy (Trusted Locations) để nạp Lisp, DLL không bị cảnh báo hoặc chặn.',
      en: 'What the SECURELOAD and TRUSTEDPATHS variables do and how to add a folder to Trusted Locations so Lisp and DLL files load without warnings.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/trusted-paths-secureload-autocad.html'
  },
  {
    id: 'giam-dung-luong-file-dwg-autocad',
    title: 'Cách Giảm Dung Lượng File DWG Nặng Và Làm AutoCAD Chạy Nhanh Hơn',
    category: 'Kiến Thức CAD',
    tag: 'Mẹo Hiệu Suất',
    description: {
      vi: 'Các bước dọn file DWG nặng, chậm: PURGE, AUDIT, OVERKILL, WBLOCK sang file mới, xử lý Xref, ảnh và block thừa. Làm đúng thứ tự để giảm dung lượng an toàn.',
      en: 'Steps to clean up a heavy, slow DWG: PURGE, AUDIT, OVERKILL, WBLOCK to a new file, handling Xrefs, images and unused blocks.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/giam-dung-luong-file-dwg-autocad.html'
  }
];
