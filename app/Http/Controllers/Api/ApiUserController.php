<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Laravel\Sanctum\PersonalAccessToken;
use App\Services\dashboard\UserService;
use App\Http\Requests\dashboard\UserStoreRequest;
use App\Http\Requests\dashboard\UserUpdateRequest;

class ApiUserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }
    /**
     * Return authenticated user as JSON.
     * Accepts a Bearer token or a session-authenticated request.
     */
    public function index(Request $request): JsonResponse
    {
        // 1) Try Bearer token (Personal Access Token) to authenticate the request
        $accessToken = null;
        $authenticated = null;
        $bearer = $request->bearerToken();
        if ($bearer) {
            $accessToken = PersonalAccessToken::findToken($bearer);
            if ($accessToken && $accessToken->tokenable) {
                // mark as authenticated but do not return the single user
                $authenticated = $accessToken->tokenable;
            }
        }

        // 2) Fallback to session user (for stateful SPA requests)
        if (!$authenticated && $request->user()) {
            $authenticated = $request->user();
        }

        if (!$authenticated) {
            // 3) Unauthenticated - always return JSON (no redirect)
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Build filters same as the dashboard UserController
        $filters = [
            'search' => $request->query('search', null),
            'status' => $request->query('status', null),
            'role' => $request->query('role', null),
            'per_page' => $request->query('per_page', 10)
        ];

        // Remove empty filters
        $filters = array_filter($filters, function ($v) {
            return !is_null($v) && $v !== '';
        });

        $users = $this->userService->getAllUsers($filters);
        $roles = $this->userService->getAllRoles();

        // ensure role relation available and add role_title attribute for each user
        $users->getCollection()->transform(function ($user) {
            $user->role_title = $user->role->title ?? null;
            return $user;
        });

        return response()->json([
            'status' => true,
            'message' => 'Users retrieved successfully',
            'data' => $users->toArray(),
            'roles' => $roles,
        ], 200);
    }

    /**
     * Show single user by id (API).
     */
    public function show(Request $request, $id): JsonResponse
    {
        // Authenticate request (bearer token or session)
        $accessToken = null;
        $authenticated = null;
        $bearer = $request->bearerToken();
        if ($bearer) {
            $accessToken = PersonalAccessToken::findToken($bearer);
            if ($accessToken && $accessToken->tokenable) {
                $authenticated = $accessToken->tokenable;
            }
        }

        if (!$authenticated && $request->user()) {
            $authenticated = $request->user();
        }

        if (!$authenticated) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        $user = $this->userService->getUserById($id);

        return response()->json([
            'status' => true,
            'message' => 'User retrieved successfully',
            'data' => $user
        ], 200);
    }

    /**
     * Store a new user (API)
     */
    public function store(UserStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        // Hash password if provided
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

        $this->userService->createUser($data);

        return response()->json([
            'status' => true,
            'message' => 'User created successfully.',
            'data' => $data
        ], 201);
    }

    /**
     * Update an existing user (API)
     */
    public function update(UserUpdateRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        // If password provided, hash it; otherwise remove to avoid overwriting with null
        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->input('password'));
        } else {
            unset($data['password']);
        }

        $this->userService->updateUser($id, $data);

        return response()->json([
            'status' => true,
            'message' => 'User updated successfully.',
            'data' => $data
        ], 200);
    }

    /**
     * Delete a user (API)
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $this->userService->getUserById($id)->delete();
        return response()->json([
            'status' => true,
            'message' => 'User deleted successfully.'
        ], 200);
    }
}
