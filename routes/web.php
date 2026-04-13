<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

    
// Multi-role registration (web)
Route::middleware('guest')->group(function () {

    // Central role selection page
    Route::get('/register', function () {
        return view('auth.register');
    })->name('register');

    Route::get('/register/clerk', [RegisterController::class, 'showClerkForm'])->name('register.clerk.show');
    Route::post('/register/clerk', [RegisterController::class, 'registerClerk'])->name('register.clerk');

    Route::get('/register/teacher', [RegisterController::class, 'showTeacherForm'])->name('register.teacher.show');
    Route::post('/register/teacher', [RegisterController::class, 'registerTeacher'])->name('register.teacher');

    Route::get('/register/student', [RegisterController::class, 'showStudentForm'])->name('register.student.show');
    Route::post('/register/student', [RegisterController::class, 'registerStudent'])->name('register.student');
});
