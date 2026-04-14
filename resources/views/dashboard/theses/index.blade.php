@extends('dashboard.layouts.app')
@section('title', 'Theses')
@section('content')

    <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h3 class="mb-0">Theses</h3>
                <small class="text-muted">Upload and manage thesis submissions</small>
            </div>
            <div>
                <a href="{{ route('theses.create') }}" class="btn gradient-btn" style="color:white">Upload Thesis</a>
            </div>
        </div>

        <div class="card shadow-sm">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Owner</th>
                                @if (auth()->check() && auth()->user()->role_id != 2)
                                    <th>File</th>
                                    <th>Status</th>
                                @endif
                                <th>Uploaded</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($theses as $thesis)
                                <tr>
                                    <td>{{ $thesis->id }}</td>
                                    <td>{{ $thesis->title }}</td>
                                    <td>{{ $thesis->user->name ?? 'N/A' }}</td>
                                    @if (auth()->check() && auth()->user()->role_id != 2)
                                        <td>{{ $thesis->original_name }}</td>
                                    @endif
                                    @if (auth()->user()->role_id == 4)
                                        <td><span
                                                class="badge {{ $thesis->status == 1 ? 'bg-success' : 'bg-secondary' }}">{{ $thesis->status == 1 ? 'Submitted' : ($thesis->status == 2 ? 'Rejected' : 'Pending') }}</span>
                                        </td>
                                    @endif
                                    @if (auth()->user()->role_id == 3)
                                        <td><span
                                                class="badge {{ $thesis->teacher_status == 1 ? 'bg-success' : 'bg-secondary' }}">{{ $thesis->teacher_status == 1 ? 'Approved' : ($thesis->teacher_status == 2 ? 'Rejected' : 'Pending') }}</span>
                                        </td>
                                    @endif
                                    {{-- @if (auth()->user()->role_id == 2)
                                        <td><span
                                                class="badge {{ $thesis->teacher_status == 1 ? 'bg-success' : 'bg-secondary' }}">{{ $thesis->teacher_status == 1 ? 'Approved' : ($thesis->teacher_status == 2 ? 'Rejected' : 'Pending') }}</span>
                                        </td>
                                    @endif --}}
                                    <td>{{ $thesis->created_at ? $thesis->created_at->format('Y-m-d') : '-' }}</td>
                                    {{-- actions: admin shows all buttons; otherwise show role-specific actions --}}
                                    @if (auth()->user()->role_id == 1)
                                        <td class="text-end">
                                            <a href="{{ route('theses.show', $thesis->id) }}" class="btn btn-sm btn-outline-primary">View</a>
                                            <a href="{{ route('theses.edit', $thesis->id) }}" class="btn btn-sm btn-outline-secondary">Edit</a>

                                            @if ($thesis->status != 1)
                                                <form action="{{ route('theses.submit', $thesis->id) }}" method="POST" class="d-inline">
                                                    @csrf
                                                    <button class="btn btn-sm btn-success">Submit</button>
                                                </form>
                                            @endif

                                            @if ($thesis->teacher_status != 1)
                                                <form action="{{ route('theses.approve', $thesis->id) }}" method="POST" class="d-inline">
                                                    @csrf
                                                    <button class="btn btn-sm btn-success">Approve</button>
                                                </form>
                                            @endif

                                            @if ($thesis->teacher_status != 2)
                                                <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#rejectModal" data-id="{{ $thesis->id }}">Reject</button>
                                            @endif

                                            <a href="{{ route('theses.download', $thesis->id) }}" class="btn btn-sm btn-outline-success">Download</a>

                                            <form action="{{ route('theses.destroy', $thesis->id) }}" method="POST" class="d-inline">
                                                @csrf
                                                @method('DELETE')
                                                <button class="btn btn-sm btn-danger" onclick="return confirm('Delete this thesis?')">Delete</button>
                                            </form>
                                        </td>
                                    @elseif (auth()->user()->role_id == 2)
                                        <td class="text-end">
                                            <a href="{{ route('theses.show', $thesis->id) }}" class="btn btn-sm btn-outline-primary">View</a>
                                            <a href="{{ route('theses.download', $thesis->id) }}" class="btn btn-sm btn-outline-success">Download</a>
                                        </td>
                                    @elseif (auth()->user()->role_id == 3)
                                        <td class="text-end">
                                            <a href="{{ route('theses.show', $thesis->id) }}" class="btn btn-sm btn-outline-primary">View</a>
                                            <a href="{{ route('theses.download', $thesis->id) }}" class="btn btn-sm btn-outline-success">Download</a>

                                            @if ($thesis->teacher_status != 1)
                                                <form action="{{ route('theses.approve', $thesis->id) }}" method="POST" class="d-inline">
                                                    @csrf
                                                    <button class="btn btn-sm btn-success">Approve</button>
                                                </form>
                                            @endif

                                            @if ($thesis->teacher_status != 2)
                                                <button class="btn btn-sm btn-warning" data-bs-toggle="modal" data-bs-target="#rejectModal" data-id="{{ $thesis->id }}">Reject</button>
                                            @endif
                                        </td>
                                    @elseif (auth()->user()->role_id == 4)
                                        <td class="text-end">
                                            <a href="{{ route('theses.show', $thesis->id) }}" class="btn btn-sm btn-outline-primary">View</a>
                                            @if ($thesis->status != 1)
                                                <a href="{{ route('theses.edit', $thesis->id) }}" class="btn btn-sm btn-outline-secondary">Edit</a>
                                                <form action="{{ route('theses.submit', $thesis->id) }}" method="POST" class="d-inline">
                                                    @csrf
                                                    <button class="btn btn-sm btn-success">Submit</button>
                                                </form>
                                                <form action="{{ route('theses.destroy', $thesis->id) }}" method="POST" class="d-inline">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button class="btn btn-sm btn-danger" onclick="return confirm('Delete this thesis?')">Delete</button>
                                                </form>
                                            @endif
                                            <a href="{{ route('theses.download', $thesis->id) }}" class="btn btn-sm btn-outline-success">Download</a>
                                        </td>
                                    @endif



                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="text-center p-4">No theses found.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
            @if ($theses->hasPages())
                <div class="d-flex justify-content-between align-items-center mt-4">
                    <div class="text-muted">Showing {{ $theses->firstItem() }} to {{ $theses->lastItem() }} of
                        {{ $theses->total() }}</div>
                    <nav>
                        {{ $theses->withQueryString()->links('pagination::bootstrap-4') }}
                    </nav>
                </div>
            @endif
        </div>
    </div>

@endsection

@push('scripts')
    <!-- Rejection modal -->
    <div class="modal fade" id="rejectModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <form id="rejectForm" method="POST">
                    @csrf
                    <div class="modal-header">
                        <h5 class="modal-title">Reject Thesis</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Reason for rejection</label>
                            <textarea name="reason" class="form-control" required rows="4"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-danger">Submit Rejection</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var rejectModal = document.getElementById('rejectModal');
            rejectModal.addEventListener('show.bs.modal', function(event) {
                var button = event.relatedTarget;
                var thesisId = button.getAttribute('data-id');
                var form = document.getElementById('rejectForm');
                form.action = '/theses/' + thesisId + '/reject';
            });
        });
    </script>
@endpush
