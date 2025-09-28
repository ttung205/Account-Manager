<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use PragmaRX\Google2FA\Google2FA;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google2fa_secret',
        'two_factor_enabled',
        'two_factor_verified_at',
        'backup_codes',
        'last_login_at',
        'last_login_ip',
        'failed_login_attempts',
        'locked_until',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google2fa_secret',
        'backup_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed:argon2id',
            'two_factor_enabled' => 'boolean',
            'two_factor_verified_at' => 'datetime',
            'backup_codes' => 'array',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
        ];
    }

    /**
     * Get the accounts for the user.
     */
    public function accounts()
    {
        return $this->hasMany(Account::class);
    }

    /**
     * Get the two factor authentication for the user.
     */
    public function twoFactorAuthentication()
    {
        return $this->hasOne(TwoFactorAuthentication::class);
    }

    /**
     * Check if user is locked due to failed login attempts.
     */
    public function isLocked()
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Check if user has 2FA enabled.
     */
    public function hasTwoFactorEnabled()
    {
        return $this->two_factor_enabled && !empty($this->google2fa_secret);
    }

    /**
     * Generate 2FA secret key.
     */
    public function generateTwoFactorSecret()
    {
        $google2fa = new Google2FA();
        return $google2fa->generateSecretKey();
    }

    /**
     * Generate QR code for 2FA setup.
     */
    public function getTwoFactorQrCodeUrl()
    {
        $google2fa = new Google2FA();
        return $google2fa->getQRCodeUrl(
            config('app.name'),
            $this->email,
            $this->google2fa_secret
        );
    }

    /**
     * Verify 2FA code.
     */
    public function verifyTwoFactorCode($code)
    {
        $google2fa = new Google2FA();
        return $google2fa->verifyKey($this->google2fa_secret, $code);
    }
}
