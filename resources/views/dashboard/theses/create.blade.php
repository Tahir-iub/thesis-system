@extends('dashboard.layouts.app')
@section('title', 'Upload Thesis')
@section('content')

    <div class="container py-4">
        <h3>Upload Thesis</h3>
        <form action="{{ route('theses.store') }}" method="POST" enctype="multipart/form-data">
            @csrf
            <div class="mb-3">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-control" value="{{ old('title') }}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-control">{{ old('description') }}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">File (PDF, DOCX, images, etc)</label>
                <input type="file" name="file" class="form-control" required>
            </div>
            <button class="btn btn-primary">Upload</button>
            <a href="{{ route('theses.index') }}" class="btn btn-secondary">Cancel</a>
        </form>
    </div>

@endsection
