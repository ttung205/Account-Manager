# 🔐 Account Manager - Secure Password Manager

A secure password management system built with Vue 3 + Laravel, focusing on high security and educational purposes for Information Security course.

## 🏗️ Architecture

- **Frontend**: Vue 3 + PrimeVue + Tailwind CSS
- **Backend**: Laravel API with JWT/Sanctum
- **Database**: MySQL
- **Security**: Client-side encryption, 2FA, Rate limiting

## 🚀 Quick Start

### Development with DDEV
```bash
# Start development environment
ddev start

# Install dependencies
ddev composer install
ddev npm install

# Run migrations
ddev artisan migrate

# Start frontend dev server
ddev npm run dev
```

### Manual Setup
```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Frontend
cd frontend
npm install
npm run dev
```

## 🔐 Security Features

- ✅ **Client-side encryption** (AES-GCM/XChaCha20)
- ✅ **Zero-knowledge architecture** (server never sees plaintext)
- ✅ **Argon2id password hashing** (OWASP recommended)
- ✅ **2FA (TOTP) support** with backup codes
- ✅ **Rate limiting & account lockout**
- ✅ **Security headers** (CSP, X-Frame-Options, X-Content-Type-Options)
- ✅ **Auto-clear clipboard** after 30 seconds
- ✅ **Master password in RAM only** (15-minute session)
- ✅ **OWASP ZAP tested** (Level 1 alerts fixed)

## 📁 Project Structure

```
account-manager/
├── frontend/                 # Vue 3 + PrimeVue + Tailwind
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utilities (crypto, api)
│   │   ├── stores/          # Pinia stores
│   │   └── assets/          # Static assets
│   └── package.json
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/migrations/
│   └── composer.json
├── deploy/                   # Deployment configs
│   ├── docker-compose.yml
│   └── nginx.conf
└── docs/                     # Documentation
```

## 🧪 Demo Attacks & Defenses

- **Brute force** → Rate limiting + Account lockout
- **XSS** → Content Security Policy (CSP)
- **Clickjacking** → X-Frame-Options header
- **SQL Injection** → Laravel Query Builder + prepared statements
- **Session hijack** → Secure sessions + HttpOnly cookies
- **MIME sniffing** → X-Content-Type-Options header
- **SSL Stripping** → HSTS (Strict-Transport-Security)


### OWASP ZAP Scan Results
- ✅ **Level 1 (URGENT)**: FIXED - CSP, X-Frame-Options, X-Content-Type-Options
- ✅ **Level 2 (HIGH)**: FIXED - HSTS (Strict-Transport-Security)
- ⏳ **Level 3 (MEDIUM)**: Pending - Additional security improvements

See `docs/SECURITY_HEADERS.md` for complete details.

## 📚 Documentation

- `docs/SECURITY_HEADERS.md` - Security headers implementation
- `docs/SECURITY_FIX_REPORT.md` - Security vulnerabilities fixed
- `docs/OWASP_ZAP_FIX_LEVEL_1.md` - OWASP ZAP scan fixes
- `docs/description_account_manager.md` - Project description

## 📝 License

Educational project for Information Security course.
