<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ClerkRegisterRequest;
use App\Services\Auth\RegisterService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private RegisterService $registerService)
    {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->getAuthPassword())) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Authenticated',
            'data' => $user,
            'token' => $token,
        ], 200);
    }

    public function registerClerk(ClerkRegisterRequest $request): JsonResponse
    {
        $user = $this->registerService->registerClerk($request->validated());
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Registered successfully',
            'data' => $user,
            'token' => $token,
        ], 201);
    }
}
