<?php
namespace App\Services\dashboard;

use App\Models\Thesis;

class ThesisService
{
    public function getAll(array $filters = [])
    {
        $query = Thesis::query()->with('user:id,name');

        if (!empty($filters['search'])) {
            $q = $filters['search'];
            $query->where(function ($ex) use ($q) {
                $ex->where('title', 'like', "%{$q}%")
                   ->orWhere('original_name', 'like', "%{$q}%");
            });
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }
        if (\Illuminate\Support\Facades\Auth::check() && \Illuminate\Support\Facades\Auth::user()->role_id == 3) {
            $query->where('status', 1);
        }
         if (\Illuminate\Support\Facades\Auth::check() && \Illuminate\Support\Facades\Auth::user()->role_id == 2) {
            $query->where('teacher_status', 1);
        }

        $perPage = $filters['per_page'] ?? 10;
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function getById($id)
    {
        return Thesis::findOrFail($id);
    }

    public function create(array $data)
    {
        return Thesis::create($data);
    }

    public function update($id, array $data)
    {
        $thesis = $this->getById($id);
        return $thesis->update($data);
    }

    public function delete($id)
    {
        $thesis = $this->getById($id);
        return $thesis->delete();
    }

    public function approve($id)
    {
        $thesis = $this->getById($id);
        return $thesis->update(['teacher_status' => 1]);
    }

    public function reject($id, $reason = null)
    {
        $thesis = $this->getById($id);
        return $thesis->update(['teacher_status' => 2, 'reason' => $reason, 'status' => 2]);
    }
    public function submit($id){
        $thesis = $this->getById($id);
        return $thesis->update(['status'=>1,'teacher_status' => 0]);
    }
}
