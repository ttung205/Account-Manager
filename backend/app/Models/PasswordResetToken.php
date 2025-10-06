<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordResetToken extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'token',
        'type',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->isUsed();
    }

    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
