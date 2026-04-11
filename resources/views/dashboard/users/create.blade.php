@extends('dashboard.layouts.app')
@section('title', 'Create User')
@section('content')

<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
            <h3 class="mb-0">Create User</h3>
            <small class="text-muted">Add a new user to the system</small>
        </div>
        <div>
            <a href="{{ route('users.index') }}" class="btn btn-sm btn-outline-secondary">Back to list</a>
        </div>
    </div>

    <div class="card shadow-sm">
        <div class="card-body">
            <form action="{{ route('users.store') }}" method="POST">
                @csrf

                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Name</label>
                        <input type="text" name="name" value="{{ old('name') }}" class="form-control @error('name') is-invalid @enderror">
                        @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Email</label>
                        <input type="email" name="email" value="{{ old('email') }}" class="form-control @error('email') is-invalid @enderror">
                        @error('email') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    <div class="col-md-4">
                        <label class="form-label">Role</label>
                        <select name="role_id" class="form-select @error('role_id') is-invalid @enderror">
                            <option value="1" {{ old('role_id') == 1 ? 'selected' : '' }}>Admin</option>
                            <option value="2" {{ old('role_id') == 2 ? 'selected' : '' }}>Clerk</option>
                            <option value="3" {{ old('role_id') == 3 ? 'selected' : '' }}>Teacher</option>
                            <option value="4" {{ old('role_id') == 4 ? 'selected' : '' }}>Student</option>
                        </select>
                        @error('role_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>



                    <div class="col-md-4">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" class="form-control @error('password') is-invalid @enderror">
                        @error('password') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" name="password_confirmation" class="form-control">
                    </div>



                    <div class="col-12 text-end ">
                        <a href="{{ route('users.index') }}" class="btn btn-secondary">Cancel</a>
                        <button class="btn gradient-btn" style="color: white">Create User</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

@endsection
