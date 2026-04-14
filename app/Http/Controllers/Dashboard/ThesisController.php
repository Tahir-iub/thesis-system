<?php

namespace App\Http\Controllers\dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\dashboard\ThesisStoreRequest;
use App\Http\Requests\dashboard\ThesisUpdateRequest;
use App\Services\dashboard\ThesisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class ThesisController extends Controller
{
    protected $service;

    public function __construct(ThesisService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $filters = [
            'search' => $request->query('search', null),
            'status' => $request->query('status', null),
            'per_page' => $request->query('per_page', 10),
        ];

        $filters = array_filter($filters, function ($v) { return !is_null($v) && $v !== ''; });

        $theses = $this->service->getAll($filters);
        return view('dashboard.theses.index', compact('theses'));
    }

    public function create()
    {
        return view('dashboard.theses.create');
    }

    public function store(ThesisStoreRequest $request)
    {
        $data = $request->validated();
        $file = $request->file('file');

        if ($file) {
            $path = $file->store('theses', 'public');
            $data['file_path'] = $path;
            $data['original_name'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getClientMimeType();
            $data['size'] = $file->getSize();
        }

    $this->service->create($data + ['user_id' => Auth::id()]);

        return redirect()->route('theses.index')->with('success', 'Thesis uploaded successfully.');
    }

    public function show($id)
    {
        $thesis = $this->service->getById($id);
        return view('dashboard.theses.show', compact('thesis'));
    }

    public function edit($id)
    {
        $thesis = $this->service->getById($id);
        return view('dashboard.theses.edit', compact('thesis'));
    }

    public function update(ThesisUpdateRequest $request, $id)
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('theses', 'public');
            $data['file_path'] = $path;
            $data['original_name'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getClientMimeType();
            $data['size'] = $file->getSize();
        }
        if (isset($data['status']) && $data['status'] == 1) {
            $data['teacher_status'] = 0;
        }

        $this->service->update($id, $data);
        return redirect()->route('theses.index')->with('success', 'Thesis updated successfully.');
    }

    public function destroy($id)
    {
        $thesis = $this->service->getById($id);
        // delete file from storage
        if ($thesis->file_path && Storage::disk('public')->exists($thesis->file_path)) {
            Storage::disk('public')->delete($thesis->file_path);
        }

        $this->service->delete($id);
        return redirect()->route('theses.index')->with('success', 'Thesis deleted.');
    }

    public function approve($id)
    {
        $this->service->approve($id);
        return redirect()->route('theses.index')->with('success', 'Thesis approved.');
    }

    public function reject(Request $request, $id)
    {
        $request->validate(['reason' => 'required|string|max:2000']);
        $this->service->reject($id, $request->input('reason'));
        return redirect()->route('theses.index')->with('success', 'Thesis rejected.');
    }

    public function submit($id){
        $this->service->submit($id);
        return redirect()->route('theses.index')->with('success', 'Thesis submitted.');
    }
    public function download($id)
    {
        $thesis = $this->service->getById($id);
        if ($thesis->file_path && Storage::disk('public')->exists($thesis->file_path)) {
            $fullPath = storage_path('app/public/' . $thesis->file_path);
            return response()->download($fullPath, $thesis->original_name ?? 'file');
        }

        return redirect()->back()->with('error', 'File not found.');
    }
}
