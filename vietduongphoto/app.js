document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // CẤU HÌNH MẶC ĐỊNH TẠI ĐÂY (Để người khác vào không cần tự nhập)
    // Thay thế đoạn chữ bên trong dấu ngoặc kép bằng thông tin thật của bạn
    // =========================================================================
    const DEFAULT_CLIENT_ID = "110344757733-bnomi4d63vsrb144pt5qpss8246supmd.apps.googleusercontent.com";
    const DEFAULT_FOLDER_ID = "1MurjCwIStG_1KkT8Au492FT9_2-rPSP6";
    const DEFAULT_API_KEY   = ""; // Không bắt buộc nếu đã dùng OAuth
    // =========================================================================

    // DOM Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettingsBtn = document.getElementById('saveSettings');
    
    const clientIdInput = document.getElementById('clientId');
    const apiKeyInput = document.getElementById('apiKey');
    const folderIdInput = document.getElementById('folderId');
    
    const gallery = document.getElementById('gallery');
    const timeline = document.getElementById('timeline');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('emptyState');
    const errorMessage = document.getElementById('errorMessage');
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightbox = document.getElementById('closeLightbox');
    const downloadBtn = document.getElementById('downloadBtn');
    
    const loginScreen = document.getElementById('loginScreen');
    const loginScreenBtn = document.getElementById('loginScreenBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const errorText = document.getElementById('errorText');
    const requestAccessBtn = document.getElementById('requestAccessBtn');

    // Load settings from localStorage hoặc lấy từ Cấu hình mặc định
    let clientId = localStorage.getItem('vd_photo_client_id') || (DEFAULT_CLIENT_ID.includes('ĐIỀN') ? '' : DEFAULT_CLIENT_ID);
    let folderId = localStorage.getItem('vd_photo_folder_id') || (DEFAULT_FOLDER_ID.includes('ĐIỀN') ? '' : DEFAULT_FOLDER_ID);
    let apiKey = localStorage.getItem('vd_photo_api_key') || DEFAULT_API_KEY;

    // Initialize inputs
    clientIdInput.value = clientId;
    apiKeyInput.value = apiKey;
    folderIdInput.value = folderId;

    let accessToken = null;
    let tokenClient = null;

    // Khởi tạo Google Identity Services
    function initGoogleClient() {
        if (!clientId) return;
        
        // Ẩn nút cài đặt cho đến khi xác minh được là admin
        settingsBtn.classList.add('hidden');
        
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.readonly email',
            callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    accessToken = tokenResponse.access_token;
                    
                    // Lưu token vào localStorage (hết hạn sau 1 tiếng)
                    const expiry = Date.now() + (tokenResponse.expires_in * 1000) - 60000; // Trừ hao 1 phút
                    localStorage.setItem('vd_photo_access_token', accessToken);
                    localStorage.setItem('vd_photo_token_expiry', expiry.toString());

                    handleSuccessfulLogin();
                }
            },
        });
    }
    
    async function handleSuccessfulLogin() {
        loginScreen.classList.add('hidden');
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        gallery.classList.remove('hidden');
        
        // Kiểm tra email xem có phải Admin không
        try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (userInfoRes.ok) {
                const userInfo = await userInfoRes.json();
                if (userInfo.email === 'dinhvietdung.vn@gmail.com') {
                    settingsBtn.classList.remove('hidden');
                }
            }
        } catch (e) {
            console.error('Không lấy được thông tin user');
        }

        fetchImages();
    }

    // Đợi thư viện Google load xong
    window.onload = () => {
        if (clientId) {
            initGoogleClient();
            
            // Kiểm tra xem token cũ còn hạn không
            const storedToken = localStorage.getItem('vd_photo_access_token');
            const storedExpiry = localStorage.getItem('vd_photo_token_expiry');
            
            if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry, 10)) {
                accessToken = storedToken;
                handleSuccessfulLogin();
            } else {
                // Token hết hạn hoặc chưa đăng nhập
                localStorage.removeItem('vd_photo_access_token');
                localStorage.removeItem('vd_photo_token_expiry');
            }
        } else {
            loginScreen.classList.add('hidden');
            emptyState.classList.remove('hidden');
            // Nếu chưa cấu hình, luôn hiện nút cài đặt để Admin thiết lập
            settingsBtn.classList.remove('hidden');
        }
    };

    function requestLogin() {
        if (!tokenClient) {
            alert('Vui lòng vào Cài đặt để nhập OAuth Client ID trước.');
            return;
        }
        tokenClient.requestAccessToken();
    }

    loginScreenBtn.addEventListener('click', requestLogin);
    loginBtn.addEventListener('click', requestLogin);
    
    logoutBtn.addEventListener('click', () => {
        if (accessToken) {
            google.accounts.oauth2.revoke(accessToken, () => {
                console.log('Revoked token');
            });
            accessToken = null;
        }
        localStorage.removeItem('vd_photo_access_token');
        localStorage.removeItem('vd_photo_token_expiry');
        
        logoutBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        gallery.classList.add('hidden');
        gallery.innerHTML = '';
        timeline.innerHTML = '';
        timeline.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    });

    // Modal Events
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
        if (e.target === lightbox) {
            lightbox.classList.add('hidden');
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        clientId = clientIdInput.value.trim();
        apiKey = apiKeyInput.value.trim();
        folderId = folderIdInput.value.trim();
        
        if (folderId.includes('drive.google.com')) {
            const match = folderId.match(/folders\/([a-zA-Z0-9-_]+)/);
            if (match && match[1]) {
                folderId = match[1];
                folderIdInput.value = folderId;
            }
        }

        localStorage.setItem('vd_photo_client_id', clientId);
        localStorage.setItem('vd_photo_api_key', apiKey);
        localStorage.setItem('vd_photo_folder_id', folderId);
        
        settingsModal.classList.add('hidden');
        
        if (clientId) {
            initGoogleClient();
            emptyState.classList.add('hidden');
            loginScreen.classList.remove('hidden');
        } else {
            loginScreen.classList.add('hidden');
            emptyState.classList.remove('hidden');
        }
    });

    // Lightbox Events
    closeLightbox.addEventListener('click', () => {
        lightbox.classList.add('hidden');
    });

    // Fetch Images from Google Drive
    async function fetchImages() {
        gallery.innerHTML = '';
        emptyState.classList.add('hidden');
        errorMessage.classList.add('hidden');
        requestAccessBtn.style.display = 'none';
        loader.classList.remove('hidden');

        try {
            const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed=false`);
            let allFiles = [];
            let pageToken = '';

            do {
                let url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=nextPageToken,files(id,name,thumbnailLink,webContentLink,mimeType,createdTime)&pageSize=1000`;
                if (apiKey) url += `&key=${apiKey}`;
                if (pageToken) url += `&pageToken=${pageToken}`;

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 403 || response.status === 404) {
                        throw new Error('PERMISSION_DENIED');
                    }
                    const errData = await response.json();
                    throw new Error(errData.error?.message || 'Lỗi không xác định.');
                }

                const data = await response.json();
                if (data.files && data.files.length > 0) {
                    allFiles = allFiles.concat(data.files);
                }
                pageToken = data.nextPageToken;
            } while (pageToken);

            if (allFiles.length > 0) {
                // Phân nhóm file theo tên gốc (bỏ đuôi) để tìm file RAW tương ứng
                const fileMap = new Map();
                allFiles.forEach(file => {
                    const match = file.name.match(/^(.*)\.([a-zA-Z0-9]+)$/);
                    if (match) {
                        let baseName = match[1];
                        const ext = match[2].toLowerCase();
                        
                        // Nếu đã có file trùng tên CHÍNH XÁC (ví dụ 2 file IMG_01.JPG), đổi tên nhóm để không bị ghi đè
                        if (fileMap.has(baseName)) {
                            const existing = fileMap.get(baseName);
                            // Nếu đã có file standard trùng extension, nghĩa là đây là 1 file độc lập khác (trùng tên hoàn toàn)
                            if (existing.standard && existing.ext.toLowerCase() === ext) {
                                baseName = baseName + '_' + file.id; // Tạo key mới cho file bị trùng tên
                            }
                        }

                        if (!fileMap.has(baseName)) {
                            fileMap.set(baseName, { standard: null, raw: null });
                        }
                        
                        const isRaw = ['arw', 'cr2', 'cr3', 'nef', 'dng', 'raf', 'orf', 'rw2'].includes(ext);
                        const isStandard = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif', 'bmp'].includes(ext);
                        
                        if (isRaw) {
                            fileMap.get(baseName).raw = file;
                        } else if (isStandard) {
                            fileMap.get(baseName).standard = file;
                            fileMap.get(baseName).ext = ext.toUpperCase();
                        } else {
                            // Nếu đuôi lạ nhưng bản chất là ảnh, cứ cho vào standard
                            fileMap.get(baseName).standard = file;
                            fileMap.get(baseName).ext = ext.toUpperCase();
                        }
                    } else {
                        // File không có đuôi, kiểm tra mimeType
                        if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
                            if (!fileMap.has(file.name)) fileMap.set(file.name, { standard: file, raw: null, ext: file.mimeType === 'image/png' ? 'PNG' : 'JPG' });
                        }
                    }
                });

                const renderList = [];
                fileMap.forEach((val) => {
                    if (val.standard) {
                        // Gắn thông tin file RAW vào file standard nếu có
                        if (val.raw) {
                            val.standard.rawFile = val.raw;
                        }
                        val.standard.displayExt = val.ext || 'JPG';
                        renderList.push(val.standard);
                    } else if (val.raw) {
                        // Nếu chỉ có file RAW, lấy file RAW để hiển thị
                        const rawExt = val.raw.name.split('.').pop().toUpperCase();
                        val.raw.displayExt = rawExt;
                        val.raw.isOnlyRaw = true;
                        renderList.push(val.raw);
                    }
                });
                
                // Sắp xếp lại theo ngày tạo (Mới nhất lên trên)
                renderList.sort((a, b) => {
                    const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
                    const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
                    return timeB - timeA;
                });

                if (renderList.length > 0) {
                    renderGallery(renderList);
                } else {
                    emptyState.classList.remove('hidden');
                    emptyState.innerHTML = '<i class="fas fa-images"></i><p>Thư mục trống hoặc không có ảnh nào.</p>';
                }
            } else {
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = '<i class="fas fa-images"></i><p>Thư mục trống hoặc không có ảnh nào.</p>';
            }
        } catch (error) {
            errorMessage.classList.remove('hidden');
            if (error.message === 'PERMISSION_DENIED') {
                errorText.textContent = 'Bạn chưa có quyền truy cập vào thư mục ảnh này.';
                requestAccessBtn.style.display = 'inline-flex';
                // Lấy email người gửi nếu có thể (nhưng Google Identity không trả về email trong tokenResponse mặc định trừ khi dùng OpenID, ta cứ để trống cho họ tự gửi)
                requestAccessBtn.href = 'mailto:dinhvietdung.vn@gmail.com?subject=Yêu cầu truy cập VietDuong Photo&body=Chào Dũng,%0D%0A%0D%0AVui lòng cấp quyền truy cập thư viện ảnh cho email Google của tôi là: [Điền email của bạn vào đây]%0D%0A%0D%0ACảm ơn bạn!';
            } else {
                errorText.textContent = error.message;
            }
        } finally {
            loader.classList.add('hidden');
        }
    }

    // Render Gallery
    function renderGallery(files) {
        gallery.innerHTML = '';
        timeline.innerHTML = '';
        timeline.classList.remove('hidden');
        gallery.classList.remove('hidden');

        let currentGroup = '';

        files.forEach(file => {
            // Phân nhóm theo Tháng/Năm
            const dateObj = file.createdTime ? new Date(file.createdTime) : new Date();
            const month = dateObj.getMonth() + 1;
            const year = dateObj.getFullYear();
            const groupName = `Tháng ${month}, ${year}`;
            const groupId = `group-${year}-${month}`;

            if (groupName !== currentGroup) {
                currentGroup = groupName;

                // Render Header
                const header = document.createElement('h2');
                header.className = 'date-header';
                header.id = groupId;
                header.textContent = groupName;
                gallery.appendChild(header);

                // Render Timeline Item
                const tlItem = document.createElement('a');
                tlItem.href = `#${groupId}`;
                tlItem.textContent = `${month}/${year}`;
                tlItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    timeline.querySelectorAll('a').forEach(a => a.classList.remove('active'));
                    tlItem.classList.add('active');
                    document.getElementById(groupId).scrollIntoView({ behavior: 'smooth' });
                });
                timeline.appendChild(tlItem);
            }

            // Sử dụng thumbnailLink an toàn nhất
            let thumbUrl = file.thumbnailLink || `https://drive.google.com/uc?id=${file.id}`;
            let highResUrl = file.thumbnailLink || `https://drive.google.com/uc?id=${file.id}`;
            
            // Xóa tham số =s... đi để lấy ảnh gốc/hoặc đổi size nếu có
            if (thumbUrl && thumbUrl.includes('=s')) {
                highResUrl = thumbUrl.replace(/=s\d+.*/, '=s2000');
                thumbUrl = thumbUrl.replace(/=s\d+.*/, '=s600'); 
            }

            // Link tải trực tiếp
            const downloadUrl = file.webContentLink;

            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = thumbUrl;
            img.alt = file.name;
            img.loading = 'lazy'; // Tối ưu tải ảnh
            
            // Nếu ảnh thumbnailLink bị lỗi (Google chặn referer hoặc hết hạn)
            // Fallback sang link direct download (uc?id=)
            img.onerror = () => {
                const directLink = `https://drive.google.com/uc?id=${file.id}`;
                if (img.src !== directLink) {
                    img.src = directLink;
                }
            };

            const overlay = document.createElement('div');
            overlay.className = 'gallery-item-overlay';
            
            const title = document.createElement('div');
            title.className = 'gallery-item-title';
            title.textContent = file.name;
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-search-plus';

            overlay.appendChild(title);
            overlay.appendChild(icon);
            
            item.appendChild(img);
            item.appendChild(overlay);

            item.addEventListener('click', () => {
                const rawUrl = file.rawFile ? file.rawFile.webContentLink : null;
                const rawName = file.rawFile ? file.rawFile.name : null;
                openLightbox(highResUrl, downloadUrl, file.name, rawUrl, rawName, file.displayExt);
            });

            gallery.appendChild(item);
        });

        // Set active for the first timeline item
        if (timeline.firstElementChild) {
            timeline.firstElementChild.classList.add('active');
        }
    }

    // Open Lightbox
    const downloadRawBtn = document.getElementById('downloadRawBtn');
    
    function openLightbox(imgSrc, downloadUrl, fileName, rawUrl, rawName, displayExt = 'JPG') {
        lightboxImg.src = ''; // reset
        lightboxImg.src = imgSrc;
        
        // Đặt thuộc tính cho nút download JPG/PNG
        downloadBtn.innerHTML = `<i class="fas fa-download"></i> Tải ảnh (${displayExt === 'JPEG' ? 'JPG' : displayExt})`;
        if (downloadUrl) {
            downloadBtn.href = downloadUrl;
            downloadBtn.download = fileName;
            downloadBtn.style.display = 'inline-flex';
        } else {
            downloadBtn.href = imgSrc;
            downloadBtn.download = fileName;
        }
        
        // Nút tải RAW
        if (rawUrl) {
            downloadRawBtn.href = rawUrl;
            downloadRawBtn.download = rawName || '';
            downloadRawBtn.classList.remove('hidden');
        } else {
            downloadRawBtn.classList.add('hidden');
        }

        lightbox.classList.remove('hidden');
    }
});
