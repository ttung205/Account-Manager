<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TwoFactorAuthentication;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TwoFactorController extends Controller
{
    /**
     * Setup 2FA for user.
     */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'success' => false,
                'message' => '2FA is already enabled for this account'
            ], 400);
        }

        // Generate secret key
        $secretKey = $user->generateTwoFactorSecret();
        
        // Generate recovery codes
        $recoveryCodes = TwoFactorAuthentication::generateRecoveryCodes();

        // Create or update 2FA record
        $twoFactor = TwoFactorAuthentication::updateOrCreate(
            ['user_id' => $user->id],
            [
                'secret_key' => $secretKey,
                'recovery_codes' => $recoveryCodes,
                'is_enabled' => false
            ]
        );

        // Update user with secret key
        $user->update(['google2fa_secret' => $secretKey]);

        return response()->json([
            'success' => true,
            'message' => '2FA setup initiated',
            'data' => [
                'secret_key' => $secretKey,
                'qr_code_url' => $user->getTwoFactorQrCodeUrl(),
                'recovery_codes' => $recoveryCodes
            ]
        ]);
    }

    /**
     * Verify and enable 2FA.
     */
    public function verify(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!$user->google2fa_secret) {
            return response()->json([
                'success' => false,
                'message' => '2FA setup not initiated. Please setup 2FA first.'
            ], 400);
        }

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'success' => false,
                'message' => '2FA is already enabled for this account'
            ], 400);
        }

        if (!$user->verifyTwoFactorCode($request->code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code'
            ], 401);
        }

        // Enable 2FA
        $user->update([
            'two_factor_enabled' => true,
            'two_factor_verified_at' => now()
        ]);

        $twoFactor = TwoFactorAuthentication::where('user_id', $user->id)->first();
        $twoFactor->update([
            'is_enabled' => true,
            'enabled_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => '2FA enabled successfully'
        ]);
    }

    /**
     * Disable 2FA.
     */
    public function disable(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json([
                'success' => false,
                'message' => '2FA is not enabled for this account'
            ], 400);
        }

        if (!$user->verifyTwoFactorCode($request->code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code'
            ], 401);
        }

        // Disable 2FA
        $user->update([
            'two_factor_enabled' => false,
            'google2fa_secret' => null,
            'two_factor_verified_at' => null
        ]);

        $twoFactor = TwoFactorAuthentication::where('user_id', $user->id)->first();
        if ($twoFactor) {
            $twoFactor->update([
                'is_enabled' => false,
                'enabled_at' => null
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => '2FA disabled successfully'
        ]);
    }

    /**
     * Get 2FA status.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $twoFactor = TwoFactorAuthentication::where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'is_enabled' => $user->hasTwoFactorEnabled(),
                'has_secret' => !empty($user->google2fa_secret),
                'recovery_codes_count' => $twoFactor ? count($twoFactor->recovery_codes ?? []) : 0,
                'enabled_at' => $twoFactor?->enabled_at
            ]
        ]);
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json([
                'success' => false,
                'message' => '2FA is not enabled for this account'
            ], 400);
        }

        $recoveryCodes = TwoFactorAuthentication::generateRecoveryCodes();
        
        $twoFactor = TwoFactorAuthentication::where('user_id', $user->id)->first();
        $twoFactor->update(['recovery_codes' => $recoveryCodes]);

        return response()->json([
            'success' => true,
            'message' => 'Recovery codes regenerated successfully',
            'data' => [
                'recovery_codes' => $recoveryCodes
            ]
        ]);
    }
}
