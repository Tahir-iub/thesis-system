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
   public function getAllUsers(array $filters = [])
    {

        // don't call withCount('users') on the User model (no users() relation)
        $query = User::query()->with('role:id,title');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $q = $filters['search'];
            $query->where(function ($qex) use ($q) {
                $qex->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }
        if (!empty($filters['role'])) {
            $query->where('role_id', $filters['role']);
        }

        $user = $query->orderBy('created_at', 'desc')->paginate($filters['per_page']);
      
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
