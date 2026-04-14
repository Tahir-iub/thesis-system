<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Thesis extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'file_path',
        'original_name',
        'mime_type',
    'size',
    'status',
    'teacher_status',
    'reason',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
