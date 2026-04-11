<?php
namespace App\Services\dashboard;

use App\Models\Role;
use App\Models\User;

class UserService
{
    // public function getAllUsers()
    // {
    //     return User::latest()->get();
    // }

    // public function createUser($data)
    // {
    //     return User::create($data);
    // }

    // public function getUserById($id)
    // {
    //     return User::findOrFail($id);
    // }

    // public function updateUser($id, $data)
    // {
    //     $user = $this->getUserById($id);
    //     return $user->update($data);
    // }

    // public function deleteUser($id)
    // {
    //     $user = $this->getUserById($id);
    //     return $user->delete();
    // }
    public function getAllUsers(){
        $user = User::with('role:id,title')->latest()->limit(10)->get();

        return $user;
    }
    public function getAllRoles(){
        $roles = Role::pluck('title', 'id');;
        return $roles;
    }
    public function getUserById($id){
        $user = User::findOrFail($id);
        return $user;
    }
    public function updateUser($id, $data)
    {
        $user = $this->getUserById($id);
        return $user->update($data);
    }
    public function createUser($data)
    {
        return User::create($data);
    }
}
