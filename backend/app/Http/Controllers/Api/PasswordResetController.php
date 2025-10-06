<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetToken;
use App\Models\User;
use App\Notifications\PasswordResetNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Request password reset link
     */
    public function requestReset(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:login,master',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Không tiết lộ thông tin user có tồn tại hay không
            return response()->json([
                'message' => 'Nếu email này tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
            ], 200);
        }

        // Xóa các token cũ chưa sử dụng của user này với cùng type
        PasswordResetToken::where('user_id', $user->id)
            ->where('type', $request->type)
            ->whereNull('used_at')
            ->delete();

        // Tạo token mới
        $token = Str::random(64);
        
        PasswordResetToken::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'token' => $token,
            'type' => $request->type,
            'expires_at' => now()->addHour(),
        ]);

        // Tạo reset URL
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $resetUrl = "{$frontendUrl}/reset-password?token={$token}&type={$request->type}";

        // Gửi email
        $user->notify(new PasswordResetNotification($resetUrl, $request->type, $token));

        return response()->json([
            'message' => 'Nếu email này tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
        ], 200);
    }

    /**
     * Verify reset token
     */
    public function verifyToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'type' => 'required|in:login,master',
        ]);

        $resetToken = PasswordResetToken::where('token', $request->token)
            ->where('type', $request->type)
            ->first();

        if (!$resetToken) {
            throw ValidationException::withMessages([
                'token' => ['Token không hợp lệ.'],
            ]);
        }

        if (!$resetToken->isValid()) {
            throw ValidationException::withMessages([
                'token' => [$resetToken->isExpired() ? 'Token đã hết hạn.' : 'Token đã được sử dụng.'],
            ]);
        }

        return response()->json([
            'valid' => true,
            'email' => $resetToken->email,
            'type' => $resetToken->type,
        ]);
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'type' => 'required|in:login,master',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $resetToken = PasswordResetToken::where('token', $request->token)
            ->where('type', $request->type)
            ->first();

        if (!$resetToken || !$resetToken->isValid()) {
            throw ValidationException::withMessages([
                'token' => ['Token không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        $user = $resetToken->user;

        // Cập nhật mật khẩu tương ứng
        if ($request->type === 'master') {
            $user->master_password = Hash::make($request->password);
        } else {
            $user->password = Hash::make($request->password);
        }
        
        $user->save();

        // Đánh dấu token đã sử dụng
        $resetToken->markAsUsed();

        // Xóa các token reset password cũ khác của user
        PasswordResetToken::where('user_id', $user->id)
            ->where('type', $request->type)
            ->where('id', '!=', $resetToken->id)
            ->delete();

        return response()->json([
            'message' => 'Đặt lại mật khẩu thành công.',
        ]);
    }
}
