<?php

namespace App\Models;



use Illuminate\Database\Eloquent\Model;


class Role extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['title'];

    // Add relationships or helper methods below:
    public function users() {
        return $this->hasMany(User::class);
     }
}
