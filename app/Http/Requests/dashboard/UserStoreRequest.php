<?php

namespace App\Http\Requests\dashboard;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;


class UserStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Allow web authenticated users
        if (Auth::check()) {
            return true;
        }

        // For API requests, allow when a valid bearer token is provided
        if ($this->is('api/*')) {
            $bearer = $this->bearerToken();
            if ($bearer) {
                $token = PersonalAccessToken::findToken($bearer);
                return $token && $token->tokenable ? true : false;
            }
            // If no bearer token, still allow if request has an authenticated user (session)
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
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|integer|in:1,2,3,4',
        ];
    }
}
