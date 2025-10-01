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

- ✅ Client-side encryption (AES-GCM/XChaCha20)
- ✅ Zero-knowledge architecture
- ✅ Argon2id password hashing
- ✅ 2FA (TOTP) support
- ✅ Rate limiting & lockout
- ✅ Security headers (CSP, HSTS)
- ✅ Auto-clear clipboard

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

- Brute force → Rate limiting
- XSS → CSP protection
- SQL Injection → Query Builder
- Session hijack → Secure sessions

## 📝 License

Educational project for Information Security course.
