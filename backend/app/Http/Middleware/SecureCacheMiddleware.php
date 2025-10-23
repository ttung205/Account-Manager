<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SecureCacheMiddleware
 * 
 * Prevents caching of sensitive API responses to protect user data.
 * Should be applied to all authenticated endpoints and endpoints returning sensitive data.
 */
class SecureCacheMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent caching of sensitive responses
        // This ensures that sensitive data (accounts, passwords, etc.) 
        // are not stored in browser cache or intermediate proxies
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
}

