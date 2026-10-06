const baseGuides = [
  {
    id: 'tuy-chinh-lenh-autolisp',
    title: 'Hướng Dẫn Tùy Chỉnh & Đổi Tên Lệnh AutoLISP (.lsp)',
    category: 'AutoLISP Tutorial',
    tag: { vi: 'Thủ Thuật CAD', en: 'CAD Tips' },
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
    tag: { vi: 'Tải Lisp', en: 'Load Lisp' },
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
    tag: { vi: 'Nâng Cao', en: 'Advanced' },
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
    category: { vi: 'Kiến Thức CAD', en: 'CAD Knowledge' },
    tag: { vi: 'So Sánh', en: 'Comparison' },
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
  },
  {
    id: 'loi-netload-autocad-khong-nap-duoc-dll',
    title: 'Các Lỗi NETLOAD Thường Gặp Trong AutoCAD: Không Nạp Được File DLL',
    category: 'Plugin .NET',
    tag: 'Sửa Lỗi',
    description: {
      vi: 'Tổng hợp các lỗi khi NETLOAD plugin .DLL: FileLoadException 0x80131515, BadImageFormatException, thiếu DLL phụ thuộc, sai phiên bản .NET và file bị khóa. Cách nhận biết và sửa từng lỗi.',
      en: 'The usual errors when running NETLOAD on a .DLL plugin: FileLoadException 0x80131515, BadImageFormatException, missing dependencies, .NET version mismatch and locked files.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/loi-netload-autocad-khong-nap-duoc-dll.html'
  },
  {
    id: 'phan-biet-layiso-layoff-layfrz-laylck-autocad',
    title: 'Phân Biệt LAYISO, LAYOFF, LAYFRZ, LAYLCK, LAYWALK Trong AutoCAD: Khi Nào Dùng Lệnh Nào?',
    category: 'Kiến Thức CAD',
    tag: 'So Sánh',
    description: {
      vi: 'Bảng so sánh các lệnh quản lý layer theo đối tượng: LAYISO, LAYOFF, LAYFRZ, LAYLCK, LAYWALK. Khác nhau giữa tắt, đóng băng và khóa layer, cách khôi phục và mẹo chọn lệnh nhanh.',
      en: 'Comparison of the object-based layer commands LAYISO, LAYOFF, LAYFRZ, LAYLCK and LAYWALK: off vs freeze vs lock, how to restore, and how to choose.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/phan-biet-layiso-layoff-layfrz-laylck-autocad.html'
  },
  {
    id: 'huong-dan-lenh-laywalk-autocad',
    title: 'Hướng Dẫn Lệnh LAYWALK Trong AutoCAD: Duyệt Từng Layer Để Kiểm Tra Bản Vẽ',
    category: 'Kiến Thức CAD',
    tag: 'Hướng Dẫn Lệnh',
    description: {
      vi: 'Cách dùng lệnh LAYWALK để xem từng layer riêng lẻ, tìm đối tượng lạ, kiểm tra bản vẽ nhận từ người khác và dọn layer thừa. Có mẹo khôi phục khi layer bị tắt nhầm.',
      en: 'How to use LAYWALK to view layers one at a time, find stray objects, audit a drawing from someone else and clean up unused layers, with tips for recovering layers left off by mistake.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/huong-dan-lenh-laywalk-autocad.html'
  },
  {
    id: 'huong-dan-lenh-laymrg-gop-layer-autocad',
    title: 'Hướng Dẫn Lệnh LAYMRG Trong AutoCAD: Gộp Nhiều Layer Thành Một',
    category: 'Kiến Thức CAD',
    tag: 'Hướng Dẫn Lệnh',
    description: {
      vi: 'Cách dùng lệnh LAYMRG để gộp nhiều layer trùng lặp hoặc thừa vào một layer đích, chuẩn hóa bản vẽ nhận từ nơi khác. Các bước, lưu ý về màu/linetype ByLayer và cách hoàn tác.',
      en: 'How to use LAYMRG to merge duplicate or unwanted layers into a target layer and standardize drawings from other sources, with notes on ByLayer properties and undo.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/huong-dan-lenh-laymrg-gop-layer-autocad.html'
  },
  {
    id: 'huong-dan-lenh-laydel-xoa-layer-autocad',
    title: 'Hướng Dẫn Lệnh LAYDEL Trong AutoCAD: Xóa Layer Kèm Toàn Bộ Đối Tượng An Toàn',
    category: 'Kiến Thức CAD',
    tag: 'Hướng Dẫn Lệnh',
    description: {
      vi: 'Cách dùng lệnh LAYDEL để xóa hẳn một layer cùng mọi đối tượng trên đó, vì sao nút xóa trong bảng Layer báo layer đang dùng, và quy trình kiểm tra, sao lưu trước khi xóa để không mất dữ liệu.',
      en: 'How to use LAYDEL to remove a layer together with every object on it, why the delete button in the Layer palette refuses, and a check-and-backup routine so you do not lose data.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/huong-dan-lenh-laydel-xoa-layer-autocad.html'
  },
  {
    id: 'huong-dan-lenh-laymcur-autocad',
    title: 'Hướng Dẫn Lệnh LAYMCUR Trong AutoCAD: Chọn Đối Tượng Để Đặt Layer Hiện Hành',
    category: 'Kiến Thức CAD',
    tag: 'Hướng Dẫn Lệnh',
    description: {
      vi: 'Cách dùng lệnh LAYMCUR để đặt layer hiện hành bằng cách chọn một đối tượng, không cần tìm tên trong danh sách. Kèm LAYCUR, LAYMCH và LAYERP để vẽ đúng layer nhanh hơn.',
      en: 'How to use LAYMCUR to make a layer current by picking an object, with no hunting through the list. Includes LAYCUR, LAYMCH and LAYERP for drawing on the right layer faster.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/huong-dan-lenh-laymcur-autocad.html'
  },
  {
    id: 'huong-dan-lenh-laycur-autocad',
    title: 'Hướng Dẫn Lệnh LAYCUR Trong AutoCAD: Chuyển Đối Tượng Sang Layer Hiện Hành',
    category: 'Kiến Thức CAD',
    tag: 'Hướng Dẫn Lệnh',
    description: {
      vi: 'Cách dùng lệnh LAYCUR để chuyển nhanh các đối tượng vẽ nhầm sang layer hiện hành. Kết hợp với LAYMCUR, SELECTSIMILAR để sửa layer hàng loạt, cùng các lưu ý về ByLayer và Block.',
      en: 'How to use LAYCUR to quickly move objects drawn on the wrong layer to the current layer. Combine it with LAYMCUR and SELECTSIMILAR for bulk fixes, plus notes on ByLayer and Blocks.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/huong-dan-lenh-laycur-autocad.html'
  },
  {
    id: 'huong-dan-lenh-laymch-autocad',
    title: 'Hướng Dẫn Lệnh LAYMCH Trong AutoCAD: Đổi Layer Cho Đối Tượng Theo Một Đối Tượng Mẫu',
    category: 'Kiến Thức CAD',
    tag: 'Hướng Dẫn Lệnh',
    description: {
      vi: 'Cách dùng lệnh LAYMCH (Layer Match) để chuyển đối tượng sang layer của một đối tượng mẫu mà không đổi layer hiện hành. So sánh với LAYCUR, MATCHPROP và các ví dụ chuẩn hóa layer thực tế.',
      en: 'How to use LAYMCH (Layer Match) to move objects to the layer of a sample object without changing the current layer. Compared with LAYCUR and MATCHPROP, with practical layer-standardizing examples.'
    },
    date: 'October 2026',
    link: '/autocad/chiase/huong-dan-lenh-laymch-autocad.html'
  },
  {
    id: 'phim-tat-ctrl-shift-c-tekla-structures',
    title: 'Phím Tắt Ctrl+Shift+C Trong Tekla Structures: Mở Bảng Keyboard Shortcuts Và Tự Gán Phím Tắt',
    category: 'Kiến Thức CAD',
    tag: { vi: 'Hướng Dẫn Tekla', en: 'Tekla Guide' },
    description: {
      vi: 'Ctrl+Shift+C mở hộp thoại Keyboard shortcuts của Tekla Structures. Cách xem danh sách phím tắt, gán phím cho lệnh, macro, component, kiểm tra trùng phím, xuất/nhập để chia sẻ cho cả nhóm.',
      en: 'Ctrl+Shift+C opens the Keyboard shortcuts dialog in Tekla Structures. How to browse shortcuts, assign keys to commands, macros and components, check conflicts, and export/import them for your team.'
    },
    date: 'October 2026',
    link: '/tekla/chiase/phim-tat-ctrl-shift-c-tekla-structures.html'
  }
];

// Nhóm (cad / tekla) và hashtag của từng bài, dùng cho thanh lọc ở tab Hướng dẫn.
// Thêm bài mới: khai báo id ở trên rồi thêm một dòng ở đây. Tag viết thường, không dấu, nối bằng '-'.
const guideMeta = {
  'tuy-chinh-lenh-autolisp': { group: 'cad', tags: ['cad', 'autolisp', 'lisp'] },
  'huong-dan-appload': { group: 'cad', tags: ['cad', 'autolisp', 'lisp', 'appload'] },
  'huong-dan-netload': { group: 'cad', tags: ['cad', 'dotnet', 'plugin', 'netload'] },
  'phan-biet-appload-netload': { group: 'cad', tags: ['cad', 'lisp', 'dotnet', 'appload', 'netload'] },
  'lisp-khong-chay-unknown-command-autocad': { group: 'cad', tags: ['cad', 'autolisp', 'lisp', 'sua-loi'] },
  'trusted-paths-secureload-autocad': { group: 'cad', tags: ['cad', 'bao-mat', 'netload'] },
  'giam-dung-luong-file-dwg-autocad': { group: 'cad', tags: ['cad', 'dwg', 'toi-uu'] },
  'loi-netload-autocad-khong-nap-duoc-dll': { group: 'cad', tags: ['cad', 'dotnet', 'netload', 'sua-loi'] },
  'phan-biet-layiso-layoff-layfrz-laylck-autocad': { group: 'cad', tags: ['cad', 'layer'] },
  'huong-dan-lenh-laywalk-autocad': { group: 'cad', tags: ['cad', 'layer'] },
  'huong-dan-lenh-laymrg-gop-layer-autocad': { group: 'cad', tags: ['cad', 'layer'] },
  'huong-dan-lenh-laydel-xoa-layer-autocad': { group: 'cad', tags: ['cad', 'layer'] },
  'huong-dan-lenh-laymcur-autocad': { group: 'cad', tags: ['cad', 'layer'] },
  'huong-dan-lenh-laycur-autocad': { group: 'cad', tags: ['cad', 'layer'] },
  'huong-dan-lenh-laymch-autocad': { group: 'cad', tags: ['cad', 'layer'] },
  'phim-tat-ctrl-shift-c-tekla-structures': { group: 'tekla', tags: ['tekla', 'phim-tat'] },
};

export const guidesData = baseGuides.map((g) => ({ group: 'cad', tags: [], ...guideMeta[g.id], ...g }));
