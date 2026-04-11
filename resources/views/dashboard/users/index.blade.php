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
											<div class="avatar bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:38px;height:38px">{{ strtoupper(substr($user->name,0,1)) }}</div>
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
								<td>{{ $user->created_at ? \Carbon\Carbon::parse($user->created_at)->format('Y-m-d') : '-' }}</td>
								<td class="text-end">
									<a href="{{ route('users.show', $user->id) }}" class="btn btn-sm btn-outline-primary">View</a>
									<a href="{{ route('users.edit', $user->id) }}" class="btn btn-sm btn-outline-secondary">Edit</a>
									<form action="#" method="POST" class="d-inline">
										@csrf
										@method('DELETE')
										<button class="btn btn-sm btn-danger" onclick="return confirm('Are you sure you want to delete this user?')">Delete</button>
									</form>
								</td>
							</tr>
						@empty
							<tr>
								<td colspan="6" class="text-center p-4">No users found.</td>
							</tr>
						@endforelse
					</tbody>
				</table>
			</div>
		</div>
		<div class="card-footer d-flex justify-content-between align-items-center">
			<div class="text-muted">Showing {{ $users->count() }} of {{ $users instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator ? $users->total() : $users->count() }} users</div>
			<div>
				@if(method_exists($users, 'links'))
					{{ $users->withQueryString()->links() }}
				@endif
			</div>
		</div>
	</div>
</div>

@endsection
