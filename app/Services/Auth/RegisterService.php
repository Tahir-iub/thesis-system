<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RegisterService
{
    public function registerClerk(array $data): User
    {
        return $this->createUserWithRole($data, 2);
    }

    public function registerTeacher(array $data): User
    {
        return $this->createUserWithRole($data, 3);
    }

    public function registerStudent(array $data): User
    {
        return $this->createUserWithRole($data, 4);
    }

    protected function createUserWithRole(array $data, int $roleId): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $roleId,
        ]);
    }
}
