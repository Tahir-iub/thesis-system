@extends('dashboard.layouts.app')
@section('title', 'Edit Thesis')
@section('content')

    <div class="container py-4">
        <h3>Edit Thesis</h3>
        <form action="{{ route('theses.update', $thesis->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT')
            <div class="mb-3">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-control" value="{{ old('title', $thesis->title) }}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-control">{{ old('description', $thesis->description) }}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Replace File (optional)</label>
                <input type="file" name="file" class="form-control">
                @if($thesis->original_name)
                    <div class="mt-2">Current: {{ $thesis->original_name }}</div>
                @endif
            </div>
            <div class="mb-3">
                <label class="form-label">Status</label>
                <select name="status" class="form-control">
                    <option value="0" {{ $thesis->status == 0 ? 'selected' : '' }}>Pending</option>
                    <option value="1" {{ $thesis->status == 1 ? 'selected' : '' }}>Submit</option>
                    {{-- <option value="2" {{ $thesis->status == 2 ? 'selected' : '' }}>Rejected</option> --}}
                </select>
            </div>
            <button class="btn btn-primary">Save</button>
            <a href="{{ route('theses.index') }}" class="btn btn-secondary">Cancel</a>
        </form>
    </div>

@endsection
