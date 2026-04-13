<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;

// Multi-role registration (API)
Route::middleware('guest:sanctum')->group(function () {
    Route::post('/register/clerk', [RegisterController::class, 'registerClerk']);
    Route::post('/register/teacher', [RegisterController::class, 'registerTeacher']);
    Route::post('/register/student', [RegisterController::class, 'registerStudent']);
});
