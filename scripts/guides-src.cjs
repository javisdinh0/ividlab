// Nội dung các bài hướng dẫn AutoCAD (song ngữ vi/en). Sinh HTML bằng: node scripts/build-guides.cjs
// Mỗi khối: [loại, vi, en]. Loại: p, h2, h3, ul (vi/en là mảng <li>), tip (vi/en = [tiêu đề, nội dung]).
const p = (vi, en) => ['p', vi, en];
const h2 = (vi, en) => ['h2', vi, en];
const h3 = (vi, en) => ['h3', vi, en];
const ul = (vi, en) => ['ul', vi, en];
const tip = (vi, en) => ['tip', vi, en];

module.exports = [
  {
    slug: 'lisp-khong-chay-unknown-command-autocad',
    title: 'Lisp Không Chạy, Báo "Unknown Command" Trong AutoCAD: Nguyên Nhân & Cách Sửa',
    titleEn: 'AutoCAD Lisp Not Running or "Unknown Command": Causes & Fixes',
    badge: 'Sửa Lỗi', badgeEn: 'Troubleshooting',
    desc: 'Nạp file .lsp bằng APPLOAD xong nhưng gõ lệnh vẫn báo Unknown command? Danh sách nguyên nhân thường gặp và cách kiểm tra từng bước, từ tên lệnh c: đến cảnh báo bảo mật.',
    descEn: 'Loaded a .lsp file with APPLOAD but the command still says Unknown command? Common causes and a step-by-step checklist.',
    related: ['huong-dan-appload-lisp-autocad', 'tuy-chinh-lenh-autolisp', 'phan-biet-appload-va-netload-trong-autocad'],
    body: [
      p('Bạn tải một file Lisp về, nạp vào AutoCAD, gõ lệnh thì nhận được <code>Unknown command</code>. Đây là lỗi gặp nhiều nhất khi mới dùng Lisp, và gần như luôn rơi vào một trong các nguyên nhân dưới đây. Hãy kiểm tra theo thứ tự.',
        'You download a Lisp file, load it into AutoCAD, type the command and get <code>Unknown command</code>. This is the most common beginner problem and it almost always comes down to one of the causes below. Check them in order.'),

      h2('1. File chưa được nạp thành công', '1. The file was not actually loaded'),
      p('Sau khi chọn file trong hộp thoại <code>APPLOAD</code>, bạn phải bấm <strong>Load</strong> rồi xem dòng thông báo ở cuối hộp thoại và trong Command line. Nếu có chữ <code>loaded successfully</code> hoặc tương tự là file đã nạp. Chỉ chọn file mà chưa bấm Load thì lệnh chưa tồn tại.',
        'After choosing the file in the <code>APPLOAD</code> dialog you must click <strong>Load</strong> and read the message at the bottom of the dialog and in the Command line. Selecting the file without clicking Load does nothing.'),
      p('Xem thêm cách làm đúng tại <a href="/autocad/chiase/huong-dan-appload-lisp-autocad.html">Hướng dẫn APPLOAD &amp; Startup Suite</a>.',
        'See the proper workflow in the <a href="/autocad/chiase/huong-dan-appload-lisp-autocad.html">APPLOAD &amp; Startup Suite guide</a>.'),

      h2('2. Gõ sai tên lệnh', '2. You typed the wrong command name'),
      p('Tên file không phải là tên lệnh. Lệnh được định nghĩa bên trong file, dạng <code>(defun c:TENLENH ()</code>. Mở file <code>.lsp</code> bằng Notepad, tìm các dòng <code>defun c:</code>: phần sau <code>c:</code> chính là lệnh bạn phải gõ. Ví dụ <code>(defun c:MH ()</code> thì gõ <code>MH</code>.',
        'The file name is not the command name. The command is defined inside the file as <code>(defun c:COMMANDNAME ()</code>. Open the <code>.lsp</code> file in Notepad and search for <code>defun c:</code>; the text after <code>c:</code> is what you type. For example <code>(defun c:MH ()</code> means you type <code>MH</code>.'),
      p('Nếu hàm được khai báo <strong>không có</strong> tiền tố <code>c:</code> thì nó chỉ gọi được dưới dạng hàm Lisp có ngoặc, ví dụ <code>(tenham)</code>, chứ không gõ như một lệnh thường.',
        'If the function is declared <strong>without</strong> the <code>c:</code> prefix it can only be called as a Lisp function in parentheses, such as <code>(functionname)</code>, not typed like a normal command.'),
      p('Muốn đổi tên lệnh cho dễ nhớ, xem <a href="/autocad/chiase/tuy-chinh-lenh-autolisp.html">Hướng dẫn tùy chỉnh &amp; đổi tên lệnh AutoLISP</a>.',
        'To rename a command, see <a href="/autocad/chiase/tuy-chinh-lenh-autolisp.html">How to customize AutoLISP command names</a>.'),

      h2('3. File bị chặn bởi cảnh báo bảo mật', '3. The file is blocked by the security setting'),
      p('Các bản AutoCAD mới có cơ chế an toàn cho việc nạp mã. Nếu thư mục chứa file không nằm trong danh sách tin cậy, AutoCAD có thể hiện cảnh báo hoặc từ chối nạp. Cách xử lý chi tiết ở bài <a href="/autocad/chiase/trusted-paths-secureload-autocad.html">TRUSTEDPATHS &amp; SECURELOAD</a>.',
        'Recent AutoCAD versions restrict code loading. If the folder is not in the trusted list, AutoCAD may warn or refuse to load the file. See the <a href="/autocad/chiase/trusted-paths-secureload-autocad.html">TRUSTEDPATHS &amp; SECURELOAD</a> guide for the fix.'),

      h2('4. File bị lỗi cú pháp hoặc lưu sai định dạng', '4. Syntax error or wrong file encoding'),
      ul(['Thiếu hoặc thừa dấu ngoặc: Command line thường hiện dòng báo lỗi bắt đầu bằng <code>; error:</code> ngay khi nạp.',
          'Lưu file bằng Word hoặc trình soạn thảo thêm định dạng: file <code>.lsp</code> phải là văn bản thuần (plain text), nên dùng Notepad.',
          'Đuôi file bị thành <code>.lsp.txt</code> khi tải về: bật hiển thị phần mở rộng trong Windows để kiểm tra và đổi lại tên.'],
         ['Missing or extra parentheses: the Command line usually prints an error starting with <code>; error:</code> as soon as you load.',
          'Saving with Word or a rich editor: a <code>.lsp</code> file must be plain text, so use Notepad.',
          'The extension became <code>.lsp.txt</code> after download: show file extensions in Windows and rename it.']),

      h2('5. Lisp phụ thuộc file khác', '5. The Lisp depends on another file'),
      p('Một số bộ Lisp gọi thêm file khác (hàm dùng chung, file dữ liệu, hộp thoại <code>.dcl</code>). Nếu bạn chỉ copy riêng một file ra khỏi bộ thì lệnh có thể nạp được nhưng chạy báo lỗi. Hãy giữ nguyên cả thư mục như bản gốc và thêm thư mục đó vào đường dẫn tìm kiếm của AutoCAD.',
        'Some Lisp packages call other files (shared functions, data files, <code>.dcl</code> dialogs). If you copy a single file out of the set, the command may load but fail when it runs. Keep the whole folder together and add it to AutoCAD\'s search path.'),

      h2('6. Lisp mất sau khi đóng AutoCAD', '6. The Lisp disappears when AutoCAD restarts'),
      p('Lisp nạp bằng APPLOAD chỉ tồn tại trong phiên làm việc hiện tại. Để tự nạp mỗi lần mở AutoCAD, thêm file vào <strong>Startup Suite</strong> (nút Contents trong hộp thoại APPLOAD).',
        'Lisp loaded with APPLOAD only lasts for the current session. To load it every time AutoCAD starts, add the file to the <strong>Startup Suite</strong> (the Contents button in the APPLOAD dialog).'),

      tip(['Danh sách kiểm tra nhanh', 'Quick checklist'],
          ['Đã bấm Load và thấy thông báo thành công? Đã mở file kiểm tra đúng tên <code>defun c:</code>? Thư mục đã nằm trong vùng tin cậy? Không có dòng <code>; error:</code> khi nạp? Nếu cả bốn đều ổn mà vẫn lỗi, thử mở bản vẽ mới và nạp lại để loại trừ lỗi riêng của bản vẽ.',
           'Did you click Load and see success? Did you check the exact <code>defun c:</code> name? Is the folder trusted? No <code>; error:</code> line on load? If all four are fine and it still fails, try a new drawing and load again to rule out a drawing-specific problem.']),
    ],
  },

  {
    slug: 'trusted-paths-secureload-autocad',
    title: 'Cảnh Báo Bảo Mật Khi Nạp Lisp/DLL Trong AutoCAD: TRUSTEDPATHS & SECURELOAD',
    titleEn: 'Security Warning When Loading Lisp/DLL in AutoCAD: TRUSTEDPATHS & SECURELOAD',
    badge: 'Cài Đặt', badgeEn: 'Settings',
    desc: 'Giải thích biến SECURELOAD và TRUSTEDPATHS, cách thêm thư mục vào vùng tin cậy (Trusted Locations) để nạp Lisp, DLL không bị cảnh báo hoặc chặn.',
    descEn: 'What the SECURELOAD and TRUSTEDPATHS variables do and how to add a folder to Trusted Locations so Lisp and DLL files load without warnings.',
    related: ['huong-dan-appload-lisp-autocad', 'huong-dan-netload-dll-autocad', 'lisp-khong-chay-unknown-command-autocad'],
    body: [
      p('Khi nạp Lisp hoặc DLL từ một thư mục lạ, AutoCAD có thể hiện hộp thoại cảnh báo bảo mật hoặc từ chối nạp. Đó là cơ chế bảo vệ do hai biến hệ thống <code>SECURELOAD</code> và <code>TRUSTEDPATHS</code> điều khiển. Bài này giải thích chúng và cách thiết lập để công cụ của bạn chạy mượt mà mà vẫn an toàn.',
        'When you load Lisp or DLL files from an unfamiliar folder, AutoCAD may show a security warning or refuse to load. This protection is controlled by two system variables, <code>SECURELOAD</code> and <code>TRUSTEDPATHS</code>. This guide explains them and how to configure them safely.'),

      h2('SECURELOAD là gì?', 'What is SECURELOAD?'),
      p('<code>SECURELOAD</code> quyết định AutoCAD xử lý thế nào với file thực thi (Lisp, ARX, DLL...) nằm ngoài vùng tin cậy:',
        '<code>SECURELOAD</code> decides how AutoCAD treats executable files (Lisp, ARX, DLL...) located outside trusted folders:'),
      ul(['<code>0</code>: nạp từ mọi nơi và không cảnh báo (kém an toàn nhất).',
          '<code>1</code>: nạp thẳng từ vùng tin cậy, còn ngoài vùng tin cậy thì hỏi bạn có cho phép không.',
          '<code>2</code>: chỉ nạp từ vùng tin cậy, các nơi khác bị từ chối.'],
         ['<code>0</code>: load from anywhere with no warning (least safe).',
          '<code>1</code>: load directly from trusted folders and prompt you for anything outside them.',
          '<code>2</code>: load only from trusted folders; everything else is refused.']),
      p('Giá trị mặc định có thể khác nhau tùy phiên bản AutoCAD. Gõ <code>SECURELOAD</code> trong Command line để xem giá trị hiện tại trên máy bạn.',
        'The default value can vary by AutoCAD version. Type <code>SECURELOAD</code> in the Command line to see the current value on your machine.'),

      h2('Cách thêm thư mục vào vùng tin cậy', 'How to add a folder to the trusted list'),
      h3('Cách 1: qua hộp thoại Options', 'Method 1: via the Options dialog'),
      ul(['Gõ <code>OP</code> và nhấn Enter để mở Options.',
          'Chọn tab <strong>Files</strong>, mở mục <strong>Trusted Locations</strong>.',
          'Chọn <strong>Add</strong> rồi <strong>Browse</strong> tới thư mục chứa Lisp/DLL của bạn.',
          'Bấm OK. Từ lần nạp sau, file trong thư mục này sẽ không bị cảnh báo.'],
         ['Type <code>OP</code> and press Enter to open Options.',
          'Go to the <strong>Files</strong> tab and expand <strong>Trusted Locations</strong>.',
          'Choose <strong>Add</strong>, then <strong>Browse</strong> to the folder containing your Lisp/DLL files.',
          'Click OK. Files in this folder will no longer trigger a warning.']),
      h3('Cách 2: qua biến TRUSTEDPATHS', 'Method 2: via the TRUSTEDPATHS variable'),
      p('Gõ <code>TRUSTEDPATHS</code> rồi nhập danh sách thư mục, ngăn cách bằng dấu chấm phẩy. Thêm <code>...</code> ở cuối đường dẫn để bao gồm cả thư mục con:',
        'Type <code>TRUSTEDPATHS</code> and enter the folder list, separated by semicolons. Add <code>...</code> at the end of a path to include its subfolders:'),
      p('<code>C:\\Lisp;D:\\CAD Tools\\...</code>', '<code>C:\\Lisp;D:\\CAD Tools\\...</code>'),
      p('Lưu ý: khi nhập biến, nhớ giữ lại các đường dẫn đã có sẵn, nếu không bạn sẽ ghi đè mất chúng.',
        'Note: when you set the variable, keep the paths that are already there, otherwise you will overwrite them.'),

      h2('Nên đặt thư mục nào làm tin cậy?', 'Which folders should be trusted?'),
      ul(['Chỉ thêm thư mục chứa công cụ bạn biết rõ nguồn gốc, ví dụ thư mục cài đặt Lisp/plugin của riêng bạn.',
          'Không thêm cả ổ đĩa (<code>C:\\</code>) hoặc thư mục <code>Downloads</code>, vì file tải về bất kỳ cũng sẽ được tin cậy.',
          'Đừng hạ <code>SECURELOAD</code> xuống 0 chỉ để hết cảnh báo; thêm đúng thư mục vào vùng tin cậy sẽ an toàn hơn.'],
         ['Only add folders holding tools whose source you know, such as your own Lisp or plugin folder.',
          'Do not add a whole drive (<code>C:\\</code>) or your <code>Downloads</code> folder, because any downloaded file would then be trusted.',
          'Do not set <code>SECURELOAD</code> to 0 just to silence the warning; trusting the right folder is safer.']),

      tip(['Với file DLL tải từ Internet', 'For DLL files downloaded from the Internet'],
          ['Ngoài vùng tin cậy, Windows còn có thể đánh dấu file tải về là bị chặn. Hãy bấm chuột phải vào file, chọn Properties và tích <strong>Unblock</strong> trước khi dùng <code>NETLOAD</code>. Chi tiết tại <a href="/autocad/chiase/huong-dan-netload-dll-autocad.html">Hướng dẫn NETLOAD</a>.',
           'Besides trusted folders, Windows may also mark downloaded files as blocked. Right-click the file, open Properties and tick <strong>Unblock</strong> before using <code>NETLOAD</code>. Details in the <a href="/autocad/chiase/huong-dan-netload-dll-autocad.html">NETLOAD guide</a>.']),
    ],
  },

  {
    slug: 'giam-dung-luong-file-dwg-autocad',
    title: 'Cách Giảm Dung Lượng File DWG Nặng Và Làm AutoCAD Chạy Nhanh Hơn',
    titleEn: 'How to Reduce a Heavy DWG File Size and Speed Up AutoCAD',
    badge: 'Mẹo Hiệu Suất', badgeEn: 'Performance Tips',
    desc: 'Các bước dọn file DWG nặng, chậm: PURGE, AUDIT, OVERKILL, WBLOCK sang file mới, xử lý Xref, ảnh và block thừa. Làm đúng thứ tự để giảm dung lượng an toàn.',
    descEn: 'Steps to clean up a heavy, slow DWG: PURGE, AUDIT, OVERKILL, WBLOCK to a new file, handling Xrefs, images and unused blocks.',
    related: ['huong-dan-lenh-layiso-autocad', 'huong-dan-appload-lisp-autocad', 'tuy-chinh-lenh-autolisp'],
    body: [
      p('File DWG nặng làm AutoCAD mở lâu, zoom giật và dễ treo. Nguyên nhân thường không phải do bản vẽ "to" mà do dữ liệu thừa tích lũy qua thời gian: block, layer, style không dùng, đối tượng trùng lặp, dữ liệu lỗi. Dưới đây là quy trình dọn theo thứ tự nên làm.',
        'A heavy DWG makes AutoCAD slow to open, laggy when zooming and prone to crashing. The cause is usually not the drawing size itself but leftover data that builds up over time: unused blocks, layers and styles, duplicate objects, corrupted data. Here is a cleanup routine in a sensible order.'),
      tip(['Làm trước khi dọn', 'Before you clean'],
          ['Luôn lưu một bản sao của file gốc trước khi dọn. Một số bước (đặc biệt là PURGE tất cả và OVERKILL) xóa dữ liệu mà bạn không thể hoàn tác sau khi đã lưu.',
           'Always save a copy of the original file first. Some steps (especially purging everything and OVERKILL) remove data that cannot be undone after you save.']),

      h2('Bước 1: PURGE các đối tượng không dùng', 'Step 1: PURGE unused objects'),
      p('Gõ <code>PURGE</code> (hoặc <code>PU</code>), chọn các nhóm cần dọn như block, layer, linetype, text style, dimension style rồi bấm Purge All. Lệnh này xóa các định nghĩa không còn được sử dụng. Có thể cần chạy lặp lại 2 đến 3 lần vì xóa xong nhóm này lại làm lộ ra nhóm khác chưa dùng.',
        'Type <code>PURGE</code> (or <code>PU</code>), select the groups to clean, such as blocks, layers, linetypes, text styles and dimension styles, then click Purge All. It removes definitions that are no longer used. You may need to run it two or three times because removing one group exposes others that are now unused.'),

      h2('Bước 2: AUDIT để sửa lỗi dữ liệu', 'Step 2: AUDIT to fix data errors'),
      p('Gõ <code>AUDIT</code> và chọn <strong>Yes</strong> để sửa lỗi phát hiện được. Dữ liệu lỗi có thể làm file phình to hoặc chạy chậm bất thường. Nếu file không mở được, thử lệnh <code>RECOVER</code> thay cho mở thông thường.',
        'Type <code>AUDIT</code> and choose <strong>Yes</strong> to fix any errors found. Corrupted data can bloat a file or slow it down. If the file will not open, try <code>RECOVER</code> instead of a normal open.'),

      h2('Bước 3: OVERKILL xóa đối tượng trùng', 'Step 3: OVERKILL to remove duplicates'),
      p('Gõ <code>OVERKILL</code>, chọn toàn bộ bản vẽ. Lệnh sẽ xóa các đối tượng trùng nhau hoặc chồng lên nhau (đường line, arc, polyline vẽ đè cùng vị trí). Bản vẽ nhập từ nhiều nguồn hoặc copy nhiều lần thường có rất nhiều đối tượng loại này. Nên xem lại hộp thoại tùy chọn trước khi chạy để không gộp những thứ bạn muốn giữ.',
        'Type <code>OVERKILL</code> and select the whole drawing. It deletes duplicate or overlapping objects (lines, arcs and polylines drawn on top of each other). Drawings merged from several sources or copied many times often contain plenty of these. Review the options dialog first so you do not merge things you want to keep.'),

      h2('Bước 4: Kiểm tra Xref, ảnh và đối tượng tham chiếu', 'Step 4: Check Xrefs, images and references'),
      ul(['Mở <code>XREF</code> (Xref Manager) để gỡ bỏ Xref không dùng, tránh Xref bị mất đường dẫn.',
          'Với ảnh nền (raster) lớn, cân nhắc giảm kích thước ảnh hoặc dùng đường dẫn tương đối.',
          'Hạn chế chèn bản vẽ khác bằng <code>INSERT</code> nguyên cả file vì kéo theo toàn bộ dữ liệu của file đó; dùng <code>WBLOCK</code> để chỉ xuất phần cần thiết.'],
         ['Open <code>XREF</code> (Xref Manager) and detach unused Xrefs, and avoid Xrefs with broken paths.',
          'For large raster images, consider shrinking them or using relative paths.',
          'Avoid inserting whole drawings with <code>INSERT</code>, since all of that file\'s data comes along; use <code>WBLOCK</code> to export only what you need.']),

      h2('Bước 5: WBLOCK sang file mới', 'Step 5: WBLOCK into a fresh file'),
      p('Đây là cách hiệu quả khi các bước trên chưa đủ. Gõ <code>WBLOCK</code>, chọn <strong>Objects</strong> hoặc toàn bộ đối tượng cần giữ, đặt tên file mới và lưu. File mới chỉ chứa phần bạn chọn nên thường nhẹ hơn rõ rệt so với bản gốc đã tích lũy dữ liệu thừa. Kiểm tra lại layer, style và layout trong file mới trước khi thay thế file cũ.',
        'This helps when the steps above are not enough. Type <code>WBLOCK</code>, select <strong>Objects</strong> (or everything you want to keep), name the new file and save. The new file contains only what you selected, so it is often noticeably lighter than the original that accumulated leftover data. Check layers, styles and layouts in the new file before replacing the old one.'),

      h2('Mẹo giữ file nhẹ về lâu dài', 'Habits that keep files light'),
      ul(['Dọn PURGE định kỳ, không chờ đến lúc file nặng mới làm.',
          'Tránh copy bản vẽ từ các file cũ chứa nhiều rác sang bản vẽ mới bằng Ctrl+C; hãy dọn nguồn trước.',
          'Dùng layer hợp lý, không tạo hàng trăm layer thừa từ bản vẽ nhập về.',
          'Nên dùng <a href="/autocad/chiase/huong-dan-lenh-layiso-autocad.html">LAYISO</a> để cô lập layer khi thao tác, giúp làm việc trên bản vẽ lớn dễ hơn.'],
         ['Run PURGE regularly instead of waiting until the file is heavy.',
          'Avoid copying from old, cluttered drawings into new ones with Ctrl+C; clean the source first.',
          'Use layers sensibly and do not import hundreds of unused layers.',
          'Use <a href="/autocad/chiase/huong-dan-lenh-layiso-autocad.html">LAYISO</a> to isolate layers while working, which makes large drawings easier to handle.']),
    ],
  },
];
