@extends('auth.layout')

@section('title', 'Reset Password ')

@section('content')
<div class="block-card">
  <div class="block-card-header">
    <h2 class="widget-title pb-0">Reset password</h2>
  </div>
  <div class="block-card-body">
    <form method="POST" action="{{ route('admin.password.update') }}" class="form-box">
      @csrf

      <input type="hidden" name="token" value="{{ $token }}" />
      <input type="hidden" name="email" value="{{ $email }}" />

      <div class="input-box">
        <label class="label-text">Email</label>
        <div class="form-group">
          <span class="la la-envelope form-icon"></span>
          <input
            class="form-control form-control-styled"
            type="email"
            value="{{ $email }}"
            disabled
          />
        </div>
      </div>

      <div class="input-box">
        <label class="label-text">Password</label>
        <div class="form-group">
          <span class="la la-lock form-icon"></span>
          <input
            class="form-control form-control-styled @error('password') is-invalid @enderror"
            type="password"
            name="password"
            placeholder="Enter new password"
            required
            autofocus
          />
        </div>
        <p class="font-size-14 mt-n2">
          Your password must be at least 8 characters long.
        </p>
        @error('password')
          <span class="invalid-feedback d-block" role="alert">
            <strong>{{ $message }}</strong>
          </span>
        @enderror
      </div>

      <div class="input-box">
        <label class="label-text">Confirm Password</label>
        <div class="form-group">
          <span class="la la-lock form-icon"></span>
          <input
            class="form-control form-control-styled"
            type="password"
            name="password_confirmation"
            placeholder="Confirm new password"
            required
          />
        </div>
      </div>

      <div class="btn-box">
        <button type="submit" class="theme-btn gradient-btn w-100">
          Reset Password <i class="la la-arrow-right ms-1"></i>
        </button>
        <p class="sub-text-box text-end pt-1 font-weight-medium font-size-14">
          Remember your password?
          <a class="text-color-2" href="{{ route('admin.login') }}">Back to login</a>
        </p>
      </div>
    </form>
  </div>
</div>
@endsection

