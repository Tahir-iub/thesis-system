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

    public function index(Request $request)
    {
        $isApi = $request->expectsJson() || $request->is('api/*');

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

    if($isApi){
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
    return view('dashboard.users.index', compact('users', 'roles'));
    }

    public function show(Request $request, $id){
        $isApi = $request->expectsJson() || $request->is('api/*');

        $user = $this->userService->getUserById($id);

        if($isApi){

            return response()->json([
                'status' => true,
                'message' => 'User retrieved successfully',
                'data' => $user
            ], 200);
        }


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
        $isApi = $request->expectsJson() || $request->is('api/*');

        $data = $request->validated();

        // If password provided, hash it; otherwise remove to avoid overwriting with null
        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->input('password'));
        } else {
            unset($data['password']);
        }

    $this->userService->updateUser($id, $data);
    if($isApi){
            return response()->json([
                'status' => true,
                'message' => 'User updated successfully.',
                'data' => $data
            ], 200);
        }

    return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }


    public function store(UserStoreRequest $request)
    {
        $isApi = $request->expectsJson() || $request->is('api/*');
        $data = $request->validated();
        // Hash password before creating
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

    $this->userService->createUser($data);

    if($isApi){
            return response()->json([
                'status'=> 'true',
                'message'=> 'User created successfully.',
                'data'=> $data
            ]);
        }
    return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

}
