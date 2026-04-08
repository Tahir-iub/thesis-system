@extends('auth.layout')
@section('title', ' Login ')

@push('styles')
<style>
  /* Mobile responsive improvements */
  @media (max-width: 768px) {
    .auth-wrapper {
      padding: 20px 15px !important;
    }

    .auth-content-wrapper {
      padding: 20px 15px !important;
    }

    .block-card-header h2 {
      font-size: 1.5rem !important;
      margin-bottom: 0.5rem;
    }

    .input-box {
      margin-bottom: 1rem;
    }

    .form-control {
      font-size: 14px;
      padding: 12px 15px 12px 45px;
    }

    .label-text {
      font-size: 13px;
      margin-bottom: 5px;
    }

    /* Mobile user actions layout */
    .user-action-meta {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 10px;
      padding-bottom: 1.5rem !important;
    }

    .custom-checkbox {
      margin-bottom: 5px;
    }

    .custom-checkbox label {
      font-size: 13px !important;
    }

    .forgot-password-link {
      font-size: 13px !important;
      align-self: flex-end;
    }

    /* Mobile button improvements */
    .theme-btn {
      padding: 12px 20px !important;
      font-size: 14px !important;
      border-radius: 6px;
    }

    .sub-text-box {
      font-size: 13px !important;
      text-align: center !important;
      margin-top: 15px;
    }
  }

  @media (max-width: 480px) {
    .auth-content-wrapper {
      margin: 10px;
      padding: 15px !important;
    }

    .block-card-header h2 {
      font-size: 1.3rem !important;
    }

    .form-control {
      font-size: 13px;
      padding: 10px 12px 10px 40px;
    }

    .theme-btn {
      padding: 10px 15px !important;
      font-size: 13px !important;
    }
  }

  /* General improvements */
  .user-action-meta {
    transition: all 0.3s ease;
  }

  .forgot-password-link {
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .forgot-password-link:hover {
    text-decoration: underline;
  }
</style>
@endpush

@section('content')
<div class="block-card">
  <div class="block-card-header">
    <h2 class="widget-title pb-0">Hey, Welcome back!</h2>
  </div>
  <div class="block-card-body">
    <form method="POST" action="{{ route('login') }}" class="form-box">
      @csrf

      <div class="input-box">
        <label class="label-text">Email</label>
        <div class="form-group">
          <span class="la la-envelope form-icon"></span>
          <input
            class="form-control form-control-styled @error('email') is-invalid @enderror"
            type="email"
            name="email"
            value="{{ old('email') }}"
            placeholder="Email address"
            required
            autofocus
          />
        </div>
        @error('email')
          <span class="invalid-feedback d-block" role="alert">
            <strong>{{ $message }}</strong>
          </span>
        @enderror
      </div>

      <div class="input-box">
        <label class="label-text">Password</label>
        <div class="form-group">
          <span class="la la-lock form-icon"></span>
          <input
            class="form-control form-control-styled @error('password') is-invalid @enderror"
            type="password"
            name="password"
            placeholder="Enter password"
            required
          />
        </div>
        @error('password')
          <span class="invalid-feedback d-block" role="alert">
            <strong>{{ $message }}</strong>
          </span>
        @enderror
      </div>

      <div class="input-box d-flex align-items-center justify-content-between pb-4 user-action-meta">
        <div class="custom-checkbox">
          <input type="checkbox" id="remember" name="remember" />
          <label for="remember" class="font-size-14">Keep me signed in</label>
        </div>
        {{-- <a href="{{ route('admin.password.request') }}" class="forgot-password-link margin-bottom-10px font-size-14">
          Lost Password?
        </a> --}}
        @if (Route::has('password.request'))
                <a class="underline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800" href="{{ route('password.request') }}">
                    {{ __('Forgot your password?') }}
                </a>
            @endif
      </div>

      <div class="btn-box">
        <button type="submit" class="theme-btn gradient-btn w-100">
          <i class="la la-sign-in me-1"></i> Login to Account
        </button>
      </div>
    </form>
  </div>
</div>
@endsection
