@extends('dashboard.layouts.app')
@section('title', 'Users')
@section('content')

    <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="mb-0">Users</h3>
                <small class="text-muted">Manage system users — create, edit and remove users</small>
            </div>
            <div class="d-flex gap-2">
                {{-- <form method="GET" action="{{ route('dashboard.users.index') }}" class="d-flex">
				<input name="search" value="{{ request('search') }}" class="form-control form-control-sm" placeholder="Search name or email" />
				<button class="btn btn-sm btn-primary ms-2">Search</button>
			</form> --}}
                <a href="{{ route('users.create') }}" class="btn gradient-btn" style="color:white">Create User</a>
            </div>
        </div>
        {{-- <div class="d-flex justify-content-between align-items-center mb-4">

            <form method="GET" action="{{ route('users.index') }}" class="d-flex gap-2">
                <input type="text" class="form-control form-control-sm" placeholder="Search name or email" name="search"
                    value="{{ request('search') }}" id="searchInput">

                <select name="status" id="status" class="form-select form-select-sm">
                    <option value="" {{ request('status') === null || request('status') === '' ? 'selected' : '' }}>All</option>
                    <option value="1" {{ request('status') === '1' ? 'selected' : '' }}>Active</option>
                    <option value="0" {{ request('status') === '0' ? 'selected' : '' }}>Inactive</option>
                </select>

                <button type="submit" class="btn btn-sm btn-primary ms-2">Search</button>
            </form>
        </div> --}}
         <!-- Search and Filter -->
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Search & Filter</h6>
            </div>
            <div class="card-body">
                <form method="GET" action="{{ route('users.index') }}">
                    <div class="row">
                        <div class="col-md-3">
                            <input type="text" name="search" class="form-control" placeholder="Search ..."
                                value="{{ request('search') }}">
                        </div>
                        <div class="col-md-2">
                            <select name="status" class="form-control">
                                <option value="">All Status</option>
                                <option value="1" {{ request('status') == '1' ? 'selected' : '' }}>Active</option>
                                <option value="0" {{ request('status') == '0' ? 'selected' : '' }}>Inactive</option>
                            </select>
                        </div>
                        @auth
                            @if(auth()->user()->role_id == 1)
                                <div class="col-md-2">
                                    <select name="role" class="form-control">
                                        <option value="">All Roles</option>
                                        @foreach($roles as $id => $title)
                                            <option value="{{ $id }}" {{ request('role') == $id ? 'selected' : '' }}>{{ $title }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            @endif
                        @endauth
                        <div class="col-md-2">
                            <select name="per_page" class="form-control">
                                <option value="10" {{ request('per_page') == '10' ? 'selected' : '' }}>10 per page
                                </option>
                                <option value="25" {{ request('per_page') == '25' ? 'selected' : '' }}>25 per page
                                </option>
                                <option value="50" {{ request('per_page') == '50' ? 'selected' : '' }}>50 per page
                                </option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button type="submit" class="btn btn-primary">Filter</button>
                            <a href="{{ route('users.index') }}" class="btn btn-secondary">Reset</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div>
            <div class="card shadow-sm">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th class="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($users as $user)
                                    <tr>
                                        <td>{{ $user->id }}</td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="me-3">
                                                    <div class="avatar bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                                                        style="width:38px;height:38px">
                                                        {{ strtoupper(substr($user->name, 0, 1)) }}</div>
                                                </div>
                                                <div>
                                                    <div class="fw-semibold">{{ $user->name }}</div>
                                                    <div class="text-muted small">ID: {{ $user->id }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{{ $user->email }}</td>
                                        <td>

                                            <span class="badge bg-info text-dark">{{ $user->role->title ?? 'N/A' }}</span>
                                        </td>
                                        <td>
                                            <span
                                                class="badge {{ $user->status ? 'bg-success' : 'bg-danger' }}">{{ $user->status ? 'Active' : 'Inactive' }}</span>
                                        </td>
                                        <td>{{ $user->created_at ? \Carbon\Carbon::parse($user->created_at)->format('Y-m-d') : '-' }}
                                        </td>
                                        <td class="text-end">
                                            <a href="{{ route('users.show', $user->id) }}"
                                                class="btn btn-sm btn-outline-primary">View</a>
                                            <a href="{{ route('users.edit', $user->id) }}"
                                                class="btn btn-sm btn-outline-secondary">Edit</a>
                                            <form action="#" method="POST" class="d-inline">
                                                @csrf
                                                @method('DELETE')
                                                <button class="btn btn-sm btn-danger"
                                                    onclick="return confirm('Are you sure you want to delete this user?')">Delete</button>
                                            </form>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="7" class="text-center p-4">No users found.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
                @if ($users->hasPages())
                    <div class="d-flex justify-content-between align-items-center mt-4">
                        <div class="text-muted">
                            Showing {{ $users->firstItem() }} to {{ $users->lastItem() }} of
                            {{ $users->total() }} entries
                            ({{ $users->perPage() }} per page)
                        </div>
                        <nav>
                            {{ $users->withQueryString()->appends(request()->except('page'))->links('pagination::bootstrap-4') }}
                        </nav>
                    </div>
                @endif
            </div>
        </div>

    @endsection
