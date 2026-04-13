<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Api\AuthController;
// ...existing imports


// Multi-role registration (API)
Route::middleware('guest:sanctum')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register/clerk', [AuthController::class, 'registerClerk']);
    Route::post('/register/teacher', [RegisterController::class, 'registerTeacher']);
    Route::post('/register/student', [RegisterController::class, 'registerStudent']);
});


Route::post('/test/api', function (Request $request) {
    return response()->json([
        'status' => true,
        'message' => 'Test API endpoint',
        'data' => $request->all()
    ]);
});
// API user endpoint handled by controller (returns JSON or 401)
Route::get('/user', [\App\Http\Controllers\Api\ApiUserController::class, 'index']);
Route::get('/user/{id}', [\App\Http\Controllers\Api\ApiUserController::class, 'show']);
Route::post('/user', [\App\Http\Controllers\Api\ApiUserController::class, 'store']);
Route::put('/user/{id}', [\App\Http\Controllers\Api\ApiUserController::class, 'update']);
Route::delete('/user/{id}', [\App\Http\Controllers\Api\ApiUserController::class, 'destroy']);
