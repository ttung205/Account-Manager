<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Account extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'service_name',
        'username',
        'encrypted_password',
        'encrypted_note',
        'website_url',
        'category',
        'favorite',
        'last_used_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'favorite' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include accounts of a given category.
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope a query to only include favorite accounts.
     */
    public function scopeFavorites($query)
    {
        return $query->where('favorite', true);
    }

    /**
     * Scope a query to search accounts by service name or username.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('service_name', 'like', "%{$search}%")
              ->orWhere('username', 'like', "%{$search}%");
        });
    }

    /**
     * Update last used timestamp.
     */
    public function markAsUsed()
    {
        $this->update(['last_used_at' => now()]);
    }
}
