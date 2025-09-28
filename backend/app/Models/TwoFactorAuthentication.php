<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TwoFactorAuthentication extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'secret_key',
        'recovery_codes',
        'is_enabled',
        'enabled_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'recovery_codes' => 'array',
            'is_enabled' => 'boolean',
            'enabled_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the two factor authentication.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate recovery codes.
     */
    public static function generateRecoveryCodes($count = 8)
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(substr(md5(uniqid()), 0, 8));
        }
        return $codes;
    }

    /**
     * Check if a recovery code is valid.
     */
    public function isValidRecoveryCode($code)
    {
        return in_array($code, $this->recovery_codes ?? []);
    }

    /**
     * Use a recovery code (remove it from the list).
     */
    public function useRecoveryCode($code)
    {
        if (!$this->isValidRecoveryCode($code)) {
            return false;
        }

        $codes = $this->recovery_codes;
        $key = array_search($code, $codes);
        unset($codes[$key]);
        
        $this->update(['recovery_codes' => array_values($codes)]);
        return true;
    }
}
