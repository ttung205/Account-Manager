<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTokenExpiration
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $token = $user->currentAccessToken();
            
            // Check if token has an expires_at date and if it's expired
            if ($token->expires_at && $token->expires_at->isPast()) {
                // Delete the expired token
                $token->delete();
                
                return response()->json([
                    'success' => false,
                    'message' => 'Session expired. Please login again.',
                    'error_code' => 'SESSION_EXPIRED'
                ], 401);
            }
        }

        return $next($request);
    }
}

