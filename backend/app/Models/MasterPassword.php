<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;

class MasterPassword extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'password_hash',
        'verification_data',
        'salt',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password_hash',
        'verification_data',
        'salt',
    ];

    /**
     * Get the user that owns the master password.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Hash the master password using Argon2id.
     *
     * @param string $password
     * @return string
     */
    public static function hashPassword(string $password): string
    {
        return Hash::make($password, [
            'driver' => 'argon2id',
            'memory' => 65536, // 64 MB
            'time' => 4,       // 4 iterations
            'threads' => 3,    // 3 threads
        ]);
    }

    /**
     * Verify the master password against the stored hash.
     *
     * @param string $password
     * @return bool
     */
    public function verifyPassword(string $password): bool
    {
        return Hash::check($password, $this->password_hash);
    }

    /**
     * Generate verification data for master password validation.
     *
     * @param string $password
     * @return array
     */
    public static function generateVerificationData(string $password): array
    {
        // Generate random salt
        $salt = bin2hex(random_bytes(16));
        
        // Create test data
        $testData = 'MASTER_PASSWORD_VERIFICATION_' . time() . '_' . bin2hex(random_bytes(8));
        
        // Simple encryption using password + salt (for verification purposes)
        $key = hash('sha256', $password . $salt);
        $iv = random_bytes(16);
        $encryptedData = openssl_encrypt($testData, 'AES-256-CBC', $key, 0, $iv);
        
        $verificationData = [
            'iv' => base64_encode($iv),
            'data' => $encryptedData,
            'test' => hash('sha256', $testData), // Hash of original data for verification
        ];

        return [
            'salt' => $salt,
            'verification_data' => json_encode($verificationData),
        ];
    }

    /**
     * Verify master password using verification data.
     *
     * @param string $password
     * @return bool
     */
    public function verifyUsingVerificationData(string $password): bool
    {
        try {
            $verificationData = json_decode($this->verification_data, true);
            
            if (!$verificationData || !isset($verificationData['iv'], $verificationData['data'], $verificationData['test'])) {
                return false;
            }

            // Reconstruct key
            $key = hash('sha256', $password . $this->salt);
            $iv = base64_decode($verificationData['iv']);
            
            // Decrypt test data
            $decryptedData = openssl_decrypt($verificationData['data'], 'AES-256-CBC', $key, 0, $iv);
            
            if ($decryptedData === false) {
                return false;
            }

            // Verify against stored hash
            return hash('sha256', $decryptedData) === $verificationData['test'];
            
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Create or update master password for a user.
     *
     * @param int $userId
     * @param string $password
     * @return static
     */
    public static function setForUser(int $userId, string $password): static
    {
        $passwordHash = static::hashPassword($password);
        $verificationData = static::generateVerificationData($password);

        return static::updateOrCreate(
            ['user_id' => $userId],
            [
                'password_hash' => $passwordHash,
                'verification_data' => $verificationData['verification_data'],
                'salt' => $verificationData['salt'],
            ]
        );
    }

    /**
     * Get master password for a user.
     *
     * @param int $userId
     * @return static|null
     */
    public static function getForUser(int $userId): ?static
    {
        return static::where('user_id', $userId)->first();
    }

    /**
     * Check if user has master password set.
     *
     * @param int $userId
     * @return bool
     */
    public static function existsForUser(int $userId): bool
    {
        return static::where('user_id', $userId)->exists();
    }
}