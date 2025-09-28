**📌 Mô tả dự án: Website Quản lý Account & Mật khẩu Bảo mật Cao**

**🎯 Mục tiêu**

Xây dựng một hệ thống **quản lý tài khoản/mật khẩu** cho người dùng (tương tự “password manager”) với trọng tâm là **an toàn bảo mật**, dùng để học tập và làm bài tập môn *An toàn bảo mật thông tin*.

Người dùng có thể:

- Đăng ký, đăng nhập tài khoản cá nhân.
- Lưu trữ thông tin tài khoản (username, password, ghi chú).
- Sinh mật khẩu mạnh, copy tạm thời, auto-clear clipboard.
- Tìm kiếm, phân loại, quản lý các tài khoản đã lưu.
-----
**🏗️ Kiến trúc hệ thống**

**1. Frontend (FE)**

- **Công nghệ:** Vue 3, PrimeVue (UI components), Tailwind CSS.
- **Nhiệm vụ:**
  - Cung cấp giao diện quản lý tài khoản.
  - Thực hiện **mã hóa client-side** (WebCrypto/libsodium) trước khi gửi dữ liệu lên server (zero-knowledge).
  - Giao tiếp với API từ Backend qua HTTPS.

**2. Backend (BE)**

- **Công nghệ:** Laravel (PHP).
- **Nhiệm vụ:**
  - Xác thực người dùng (Argon2id, JWT/Sanctum, 2FA).
  - Lưu trữ dữ liệu đã **mã hóa** (không giữ plaintext mật khẩu người dùng).
  - Cung cấp API RESTful cho FE.
  - Thực hiện rate-limiting, logs, security headers.

**3. Database**

- **PostgreSQL** (chạy qua DDEV local hoặc PostgreSQL cloud).
- **Schema chính:**
  - users: id, email, hashed password, 2FA secret.
  - accounts: id, user\_id, service\_name, username, encrypted\_password, note.
-----
**🔐 Tính năng bảo mật**

- Hash mật khẩu người dùng bằng **Argon2id**.
- Tích hợp **2FA (TOTP)**.
- Mã hóa dữ liệu account bằng **AES-GCM** hoặc **XChaCha20** (FE thực hiện, BE chỉ lưu ciphertext).
- Tự động **xoá clipboard** sau khi copy mật khẩu.
- **Rate limiting + lockout** khi login sai nhiều lần.
- Triển khai **CSP, HSTS, XSS/CSRF protection**.
- Demo **tấn công và phòng thủ**: brute-force, SQLi/XSS, session hijack.
-----
**🚀 Triển khai (Deploy Options)**

- **Local (học tập):** DDEV (Docker-based) chạy FE + BE + PostgreSQL.
- **Công khai (demo):**
  - *Ngrok* để expose local → có link HTTPS cho giảng viên.
  - *Hoặc:* FE deploy lên **Vercel**, BE deploy lên **Render/Railway (free)**.
-----
**📂 Cấu trúc dự án (rút gọn)**

project/

├── frontend/ (Vue3 + PrimeVue + Tailwind)

│   ├── src/pages/Vault/VaultList.vue

│   ├── src/utils/crypto.js

│   └── ...

├── backend/ (Laravel API)

│   ├── app/Http/Controllers/AccountController.php

│   ├── app/Models/Account.php

│   └── ...

└── deploy/

`    `├── docker-compose.yml

`    `├── nginx.conf

`    `└── ...

-----
**🧪 Demo Attack & Defense**

- **Attack demo:**
  - Brute force login → bị rate limit.
  - XSS thử chèn <script> → bị CSP chặn.
  - SQL Injection thử query → bị Laravel Query Builder ngăn chặn.
- **Defense demo:**
  - Log hiển thị tấn công.
  - 2FA ngăn đăng nhập trái phép.
  - Dữ liệu account luôn mã hóa (server không thể đọc).
-----


