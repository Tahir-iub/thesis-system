@extends('dashboard.layouts.app')
@section('title', 'Thesis')
@section('content')

    <div class="container py-4">
        <h3>{{ $thesis->title }}</h3>
        <p><strong>Owner:</strong> {{ $thesis->user->name ?? 'N/A' }}</p>
        <p><strong>Description:</strong><br>{{ $thesis->description }}</p>
        <p><strong>File:</strong> {{ $thesis->original_name }}</p>
        <p><strong>Teacher Status:</strong>
            @if($thesis->teacher_status == 1)
                <span class="badge bg-success">Approved</span>
            @elseif($thesis->teacher_status == 2)
                <span class="badge bg-danger">Rejected</span>
            @else
                <span class="badge bg-secondary">Pending</span>
            @endif
        </p>

        @if($thesis->teacher_status == 2 && $thesis->reason)
            <div class="card mt-3">
                <div class="card-body">
                    <h5 class="card-title">Rejection Reason</h5>
                    <p class="card-text">{{ $thesis->reason }}</p>
                </div>
            </div>
        @endif
        <a href="{{ route('theses.download', $thesis->id) }}" class="btn btn-success">Download</a>
        <a href="{{ route('theses.index') }}" class="btn btn-secondary">Back</a>
    </div>

@endsection
