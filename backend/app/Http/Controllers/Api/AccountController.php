<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    /**
     * Display a listing of accounts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->accounts();

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->category($request->category);
        }

        // Filter favorites
        if ($request->has('favorites') && $request->favorites) {
            $query->favorites();
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $accounts = $query->get(); // Get all accounts (no pagination for now)

        return response()->json([
            'success' => true,
            'data' => [
                'accounts' => $accounts
            ]
        ]);
    }

    /**
     * Store a newly created account.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'service_name' => 'required|string|max:255',
            'username' => 'required|string|max:255',
            'encrypted_password' => 'required|string',
            'encrypted_note' => 'nullable|string',
            'website_url' => 'nullable|string|max:255|regex:/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
            'category' => 'nullable|string|max:100',
            'favorite' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $account = $request->user()->accounts()->create([
            'service_name' => $request->service_name,
            'username' => $request->username,
            'encrypted_password' => $request->encrypted_password,
            'encrypted_note' => $request->encrypted_note,
            'website_url' => $request->website_url,
            'category' => $request->category ?? 'general',
            'favorite' => $request->favorite ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'data' => [
                'account' => $account
            ]
        ], 201);
    }

    /**
     * Display the specified account.
     */
    public function show(Request $request, Account $account): JsonResponse
    {
        // Ensure user owns this account
        if ($account->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $account
        ]);
    }

    /**
     * Update the specified account.
     */
    public function update(Request $request, Account $account): JsonResponse
    {
        // Ensure user owns this account
        if ($account->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'service_name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255',
            'encrypted_password' => 'sometimes|required|string',
            'encrypted_note' => 'nullable|string',
            'website_url' => 'nullable|string|max:255|regex:/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
            'category' => 'nullable|string|max:100',
            'favorite' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $account->update($request->only([
            'service_name',
            'username',
            'encrypted_password',
            'encrypted_note',
            'website_url',
            'category',
            'favorite'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully',
            'data' => [
                'account' => $account->fresh()
            ]
        ]);
    }

    /**
     * Remove the specified account.
     */
    public function destroy(Request $request, Account $account): JsonResponse
    {
        // Ensure user owns this account
        if ($account->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found'
            ], 404);
        }

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully'
        ]);
    }

    /**
     * Mark account as used.
     */
    public function markAsUsed(Request $request, Account $account): JsonResponse
    {
        // Ensure user owns this account
        if ($account->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found'
            ], 404);
        }

        $account->markAsUsed();

        return response()->json([
            'success' => true,
            'message' => 'Account marked as used'
        ]);
    }

    /**
     * Get account statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $stats = [
            'total' => $user->accounts()->count(),
            'favorites' => $user->accounts()->where('favorite', true)->count(),
            'categories' => $user->accounts()
                ->selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
