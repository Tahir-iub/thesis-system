@extends('dashboard.layouts.app')
@section('title', 'User Details')
@section('content')

<div class="container py-4">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<div>
			<h3 class="mb-0">User Details</h3>
			<small class="text-muted">Details for user #{{ $user->id ?? '-' }}</small>
		</div>
		<div class="d-flex gap-2">
			<a href="{{ route('users.index') }}" class="btn btn-sm btn-outline-secondary">Back</a>
			{{-- <a href="{{ route('dashboard.users.edit', $user->id) }}" class="btn btn-sm btn-primary">Edit</a> --}}
			<form action="{{ route('users.destroy', $user->id) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this user?')">
				@csrf
				@method('DELETE')
				<button class="btn btn-sm btn-danger">Delete</button>
			</form>
		</div>
	</div>

	<div class="card shadow-sm">
		<div class="card-body">
			<div class="row">
				<div class="col-md-3 text-center border-end">
					<div class="avatar bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto" style="width:96px;height:96px;font-size:36px;">
						{{ strtoupper(substr($user->name ?? 'U', 0, 1)) }}
					</div>
					<h5 class="mt-3 mb-0">{{ $user->name ?? '-' }}</h5>
					<div class="text-muted small">{{ $user->email ?? '-' }}</div>
				</div>

				<div class="col-md-9">
					<dl class="row mt-2">
						<dt class="col-sm-3">Role</dt>
						<dd class="col-sm-9">
							@php
								$roleName = match($user->role_id ?? 0) {
									1 => 'Admin',
									2 => 'Teacher',
									3 => 'Student',
									default => 'User',
								};
							@endphp
							<span class="badge bg-info text-dark">{{ $roleName }}</span>
						</dd>

						<dt class="col-sm-3">Created</dt>
						<dd class="col-sm-9">{{ $user->created_at ? \Carbon\Carbon::parse($user->created_at)->toDayDateTimeString() : '-' }}</dd>

						<dt class="col-sm-3">Updated</dt>
						<dd class="col-sm-9">{{ $user->updated_at ? \Carbon\Carbon::parse($user->updated_at)->toDayDateTimeString() : '-' }}</dd>

						<dt class="col-sm-3">Status</dt>
						<dd class="col-sm-9">
							@if(isset($user->deleted_at) && $user->deleted_at)
								<span class="badge bg-danger">Deleted</span>
							@else
								<span class="badge bg-success">Active</span>
							@endif
						</dd>

						@if(isset($user->phone))
							<dt class="col-sm-3">Phone</dt>
							<dd class="col-sm-9">{{ $user->phone }}</dd>
						@endif

						@if(isset($user->notes))
							<dt class="col-sm-3">Notes</dt>
							<dd class="col-sm-9">{{ $user->notes }}</dd>
						@endif
					</dl>
				</div>
			</div>
		</div>
	</div>
</div>

@endsection
