# 🛡️ Security Headers Implementation

## Tổng quan

Đã implement **SecurityHeadersMiddleware** để bảo vệ ứng dụng khỏi các attack vectors phổ biến theo khuyến nghị của OWASP ZAP.

---

## 🔐 Headers đã implement

### 1. **Content-Security-Policy (CSP)**
**Mục đích**: Ngăn chặn XSS (Cross-Site Scripting) attacks

```http
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self'; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self'
```

**Chi tiết các directive**:
- `default-src 'self'` - Mặc định chỉ load resources từ same origin
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Cho phép scripts từ same origin và inline scripts (cần cho Vue.js)
- `style-src 'self' 'unsafe-inline'` - Cho phép styles từ same origin và inline styles
- `img-src 'self' data: https:` - Cho phép images từ same origin, data URIs và HTTPS
- `font-src 'self' data:` - Cho phép fonts từ same origin và data URIs
- `connect-src 'self'` - Chỉ cho phép AJAX/WebSocket tới same origin
- `frame-ancestors 'none'` - Không cho phép embed trong iframe (chống clickjacking)
- `base-uri 'self'` - Chỉ cho phép `<base>` tag từ same origin
- `form-action 'self'` - Chỉ cho phép submit form tới same origin

**Bảo vệ khỏi**:
- ✅ XSS (Cross-Site Scripting)
- ✅ Malicious script injection
- ✅ Data exfiltration
- ✅ Clickjacking (via `frame-ancestors`)

---

### 2. **X-Frame-Options**
**Mục đích**: Ngăn chặn Clickjacking attacks

```http
X-Frame-Options: DENY
```

**Chi tiết**:
- `DENY` - Không cho phép trang web được embed trong `<frame>`, `<iframe>`, hoặc `<object>` từ BẤT KỲ domain nào

**Bảo vệ khỏi**:
- ✅ Clickjacking attacks
- ✅ UI redress attacks
- ✅ Malicious iframe embedding

**Lưu ý**: Header này được CSP `frame-ancestors` bổ sung, nhưng giữ lại để tương thích với browsers cũ.

---

### 3. **X-Content-Type-Options**
**Mục đích**: Ngăn chặn MIME type sniffing

```http
X-Content-Type-Options: nosniff
```

**Chi tiết**:
- `nosniff` - Browser phải tuân theo `Content-Type` header, không được tự động detect MIME type

**Bảo vệ khỏi**:
- ✅ MIME confusion attacks
- ✅ Execution of malicious files disguised as safe types
- ✅ Drive-by downloads

**Ví dụ attack được chặn**:
- Attacker upload file `.jpg` nhưng thực chất là JavaScript
- Không có `nosniff` → Browser detect và execute JavaScript
- Có `nosniff` → Browser coi như image, không execute

---

### 4. **Referrer-Policy**
**Mục đích**: Kiểm soát thông tin referrer được gửi đi

```http
Referrer-Policy: strict-origin-when-cross-origin
```

**Chi tiết**:
- Same-origin requests → Gửi full URL
- Cross-origin HTTPS → HTTPS → Chỉ gửi origin
- HTTPS → HTTP → Không gửi gì (downgrade protection)

**Bảo vệ khỏi**:
- ✅ Information leakage qua referrer
- ✅ Privacy violations
- ✅ Exposure of sensitive URLs

---

### 5. **Permissions-Policy**
**Mục đích**: Vô hiệu hóa các browser features không cần thiết

```http
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

**Chi tiết**:
- `geolocation=()` - Disable geolocation API
- `microphone=()` - Disable microphone access
- `camera=()` - Disable camera access
- `payment=()` - Disable payment APIs

**Bảo vệ khỏi**:
- ✅ Unauthorized access to device sensors
- ✅ Privacy violations
- ✅ Malicious feature exploitation

**Lý do**: Password manager app không cần các features này

---

### 6. **Strict-Transport-Security (HSTS)** 🆕
**Mục đích**: Force browser luôn sử dụng HTTPS, ngăn chặn downgrade attacks

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Chi tiết**:
- `max-age=31536000` - Browser nhớ trong 1 năm (365 days)
- `includeSubDomains` - Áp dụng cho tất cả subdomains
- `preload` - Cho phép đưa vào HSTS preload list của browsers

**Bảo vệ khỏi**:
- ✅ SSL Stripping attacks (downgrade HTTPS → HTTP)
- ✅ Man-in-the-Middle (MITM) attacks
- ✅ Session hijacking qua unsecure connection
- ✅ Cookie theft trên HTTP connection

**Cách hoạt động**:
1. Lần đầu user visit site qua HTTPS → Browser nhận HSTS header
2. Từ giờ, browser TỰ ĐỘNG chuyển mọi HTTP request → HTTPS
3. Kể cả khi user gõ `http://` hoặc click HTTP link
4. Không thể bypass (không có "proceed anyway" button)

**HSTS Preload List**:
- Submit domain lên [hstspreload.org](https://hstspreload.org/)
- Browsers (Chrome, Firefox, Safari...) built-in HSTS cho domain này
- Ngay cả lần đầu visit, browser đã enforce HTTPS

**⚠️ Lưu ý quan trọng**:
- Chỉ enable khi site **ĐÃ CÓ HTTPS** hoàn toàn
- Nếu HTTPS bị lỗi → Users không thể access site trong `max-age` period
- Nên test với `max-age` ngắn trước (ví dụ: 300 = 5 phút)
- Production nên dùng 1-2 năm: `max-age=63072000` (2 years)

---

## 📁 Implementation

### File: `backend/app/Http/Middleware/SecurityHeadersMiddleware.php`

```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);

    // Add all security headers
    $response->headers->set('Content-Security-Policy', '...');
    $response->headers->set('X-Frame-Options', 'DENY');
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->headers->set('Permissions-Policy', '...');
    $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return $response;
}
```

### File: `backend/bootstrap/app.php`

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->api(prepend: [
        \App\Http\Middleware\SecurityHeadersMiddleware::class, // ← Thêm đầu tiên
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ]);
})
```

**Lưu ý**: Middleware được `prepend` (thêm vào đầu) để chạy TRƯỚC tất cả middleware khác, đảm bảo mọi response đều có security headers.

---

## ✅ OWASP ZAP Scan Results

### Trước khi fix:
- ❌ **Content Security Policy (CSP) Header Not Set** - 3 instances (Medium)
- ❌ **Missing Anti-clickjacking Header** - 3 instances (Medium)
- ❌ **X-Content-Type-Options Header Missing** - 68 instances (Low)

### Sau khi fix:
- ✅ **Content Security Policy (CSP)** - FIXED
- ✅ **X-Frame-Options** - FIXED
- ✅ **X-Content-Type-Options** - FIXED
- ✅ **Referrer-Policy** - BONUS (best practice)
- ✅ **Permissions-Policy** - BONUS (best practice)
- ✅ **Strict-Transport-Security (HSTS)** - FIXED (Level 2)

---

## 🔧 Testing

### 1. Test bằng curl:
```bash
curl -I http://localhost:8000/api/accounts
```

**Expected output**:
```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 2. Test bằng browser DevTools:
1. Mở Chrome DevTools (F12)
2. Network tab → Chọn bất kỳ API request
3. Headers → Response Headers
4. Verify các headers trên có mặt

### 3. Re-scan với OWASP ZAP:
```bash
# Chạy lại ZAP scan để verify
zap-cli quick-scan http://localhost:8000
```

---

## 📚 References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [MDN X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
- [OWASP ZAP](https://www.zaproxy.org/)

---

## 🚨 Lưu ý quan trọng

### CSP và inline scripts/styles:
Hiện tại CSP cho phép `'unsafe-inline'` và `'unsafe-eval'` để tương thích với Vue.js. 

**Trong production, nên**:
1. Sử dụng nonces hoặc hashes thay vì `'unsafe-inline'`
2. Build Vue.js với CSP-compatible mode
3. Tránh `eval()` và `new Function()`

### Testing:
Sau khi deploy, nên:
1. ✅ Test toàn bộ chức năng app để đảm bảo CSP không block resources hợp lệ
2. ✅ Check browser console có CSP violations không
3. ✅ Re-scan với OWASP ZAP hoặc security tools khác

---

## 📈 Next Steps (Optional)

Để tăng cường security hơn nữa:

1. ✅ **Strict-Transport-Security (HSTS)** - COMPLETED (Level 2)
2. **HSTS Preload Submission** - Submit domain lên hstspreload.org
3. **Certificate Transparency** - Require CT logs
4. **Subresource Integrity (SRI)** - Verify CDN resources
5. **Upgrade-Insecure-Requests** - Auto upgrade HTTP to HTTPS

---

## 🚀 HSTS Preload Configuration

Để submit domain lên HSTS preload list:

### Yêu cầu:
1. ✅ Serve valid certificate
2. ✅ Redirect HTTP → HTTPS (same host)
3. ✅ Serve HSTS header trên base domain với:
   - `max-age` >= 31536000 (1 year)
   - `includeSubDomains` directive
   - `preload` directive
4. ✅ Serve HSTS header trên tất cả subdomains

### Cách submit:
1. Test site: https://hstspreload.org/?domain=yourdomain.com
2. Fix mọi issues nếu có
3. Submit domain
4. Đợi browsers update preload list (vài tháng)

### ⚠️ Lưu ý:
- **KHÔNG THỂ UNDO dễ dàng!** Removal khỏi preload list mất rất lâu
- Chỉ submit khi **CHẮC CHẮN** site sẽ dùng HTTPS mãi mãi
- Test kỹ trước khi submit

---

*Last updated: 2025-10-23*
*Security Audit: OWASP ZAP*
*Level 2 (HSTS): COMPLETED ✅*

