<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterPassword;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;

class MasterPasswordController extends Controller
{
    /**
     * Check if user has master password set.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $hasMasterPassword = MasterPassword::existsForUser($user->id);

        return response()->json([
            'success' => true,
            'data' => [
                'has_master_password' => $hasMasterPassword,
                'user_id' => $user->id,
            ]
        ]);
    }

    /**
     * Create master password for user.
     */
    public function create(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if user already has master password
        if (MasterPassword::existsForUser($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Master password already exists for this user'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:12',
            'password_confirmation' => 'required|string|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $masterPassword = MasterPassword::setForUser($user->id, $request->password);

            return response()->json([
                'success' => true,
                'message' => 'Master password created successfully',
                'data' => [
                    'id' => $masterPassword->id,
                    'created_at' => $masterPassword->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create master password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify master password.
     */
    public function verify(Request $request): JsonResponse
    {
        $user = $request->user();
        $key = 'master-password-attempts:' . $user->id . ':' . $request->ip();

        // Check rate limiting (5 attempts per 15 minutes)
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => 'Too many verification attempts. Please try again in ' . ceil($seconds / 60) . ' minutes.',
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $masterPassword = MasterPassword::getForUser($user->id);

        if (!$masterPassword) {
            return response()->json([
                'success' => false,
                'message' => 'Master password not found. Please create one first.'
            ], 404);
        }

        // Verify using both hash and verification data for double security
        $isValidHash = $masterPassword->verifyPassword($request->password);
        $isValidVerification = $masterPassword->verifyUsingVerificationData($request->password);

        if ($isValidHash && $isValidVerification) {
            // Clear rate limiting on successful verification
            RateLimiter::clear($key);

            return response()->json([
                'success' => true,
                'message' => 'Master password verified successfully',
                'data' => [
                    'verified_at' => now(),
                ]
            ]);
        } else {
            // Increment rate limiting on failed attempt
            RateLimiter::hit($key, 900); // 15 minutes

            return response()->json([
                'success' => false,
                'message' => 'Invalid master password'
            ], 401);
        }
    }

    /**
     * Update master password.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:12',
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $masterPassword = MasterPassword::getForUser($user->id);

        if (!$masterPassword) {
            return response()->json([
                'success' => false,
                'message' => 'Master password not found'
            ], 404);
        }

        // Verify current password
        if (!$masterPassword->verifyPassword($request->current_password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current master password is incorrect'
            ], 401);
        }

        try {
            // Update with new password
            $updatedMasterPassword = MasterPassword::setForUser($user->id, $request->new_password);

            return response()->json([
                'success' => true,
                'message' => 'Master password updated successfully',
                'data' => [
                    'updated_at' => $updatedMasterPassword->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update master password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete master password (dangerous operation).
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
            'confirmation' => 'required|string|in:DELETE_MASTER_PASSWORD',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $masterPassword = MasterPassword::getForUser($user->id);

        if (!$masterPassword) {
            return response()->json([
                'success' => false,
                'message' => 'Master password not found'
            ], 404);
        }

        // Verify password before deletion
        if (!$masterPassword->verifyPassword($request->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Master password is incorrect'
            ], 401);
        }

        try {
            $masterPassword->delete();

            return response()->json([
                'success' => true,
                'message' => 'Master password deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete master password',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}