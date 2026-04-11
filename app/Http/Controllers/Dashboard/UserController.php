<?php

namespace App\Http\Controllers\dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\dashboard\UserUpdateRequest;
use App\Http\Requests\dashboard\UserStoreRequest;
use Illuminate\Http\Request;
use App\Services\dashboard\UserService;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }
    public function index()
    {
        $users = $this->userService->getAllUsers();

        return view('dashboard.users.index', compact('users'));
    }
    public function show($id){
        $user = $this->userService->getUserById($id);
        return view('dashboard.users.show', compact('user'));
    }
    public function create(){
        $roles = $this->userService->getAllRoles();
        return view('dashboard.users.create', compact('roles'));
    }
    public function edit($id){
        $user = $this->userService->getUserById($id);
        $roles = $this->userService->getAllRoles();
        return view('dashboard.users.edit', compact('user', 'roles'));
    }
    public function update(UserUpdateRequest $request, $id)
    {
        $data = $request->validated();

        // If password provided, hash it; otherwise remove to avoid overwriting with null
        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->input('password'));
        } else {
            unset($data['password']);
        }

        $this->userService->updateUser($id, $data);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function store(UserStoreRequest $request)
    {
        $data = $request->validated();
        // Hash password before creating
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

        $this->userService->createUser($data);

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

}
