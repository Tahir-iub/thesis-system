<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ClerkRegisterRequest;
use App\Http\Requests\Auth\TeacherRegisterRequest;
use App\Http\Requests\Auth\StudentRegisterRequest;
use App\Services\Auth\RegisterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RegisterController extends Controller
{
    public function __construct(private RegisterService $registerService)
    {
    }

    public function showClerkForm(): RedirectResponse|\Illuminate\View\View
    {
        return view('auth.register-clerk');
    }

    public function registerClerk(ClerkRegisterRequest $request): JsonResponse|RedirectResponse
    {
        $user = $this->registerService->registerClerk($request->validated());

        if ($request->expectsJson()) {
            return response()->json([
                'status' => true,
                'message' => 'Registered successfully',
                'data' => $user,
            ], 201);
        }

        Auth::login($user);

        return redirect()->route('dashboard');
    }

    public function showTeacherForm(): RedirectResponse|\Illuminate\View\View
    {
        return view('auth.register-teacher');
    }

    public function registerTeacher(TeacherRegisterRequest $request): JsonResponse|RedirectResponse
    {
        $user = $this->registerService->registerTeacher($request->validated());

        if ($request->expectsJson()) {
            return response()->json([
                'status' => true,
                'message' => 'Registered successfully',
                'data' => $user,
            ], 201);
        }

        Auth::login($user);

        return redirect()->route('dashboard');
    }

    public function showStudentForm(): RedirectResponse|\Illuminate\View\View
    {
        return view('auth.register-student');
    }

    public function registerStudent(StudentRegisterRequest $request): JsonResponse|RedirectResponse
    {
        $user = $this->registerService->registerStudent($request->validated());

        if ($request->expectsJson()) {
            return response()->json([
                'status' => true,
                'message' => 'Registered successfully',
                'data' => $user,
            ], 201);
        }

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
