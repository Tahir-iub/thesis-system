<?php

namespace App\Http\Requests\dashboard;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class UserUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (Auth::check()) {
            return true;
        }

        if ($this->is('api/*')) {
            $bearer = $this->bearerToken();
            if ($bearer) {
                $token = PersonalAccessToken::findToken($bearer);
                return $token && $token->tokenable ? true : false;
            }
            return $this->user() !== null;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($this->route('user')?->id ?? $this->route('user')),
            ],
            'role_id' => 'required|integer|in:0,1,2,3,4',

        ];
    }
}
