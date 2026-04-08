@extends('auth.layout')

@section('title', ' Registration ')

@section('content')
<div class="block-card">
  <div class="block-card-header">
    <h2 class="widget-title pb-0">Welcome! Create your account as Teacher</h2>
  </div>
  <div class="block-card-body">
    <form method="POST" action="{{ route('register.teacher') }}" class="form-box">
      @csrf

      <div class="input-box">
        <label class="label-text">Full Name</label>
        <div class="form-group">
          <span class="la la-user form-icon"></span>
          <input
            class="form-control form-control-styled @error('name') is-invalid @enderror"
            type="text"
            name="name"
            value="{{ old('name') }}"
            placeholder="Full Name"
            required
            autofocus
          />
        </div>
        @error('name')
          <span class="invalid-feedback d-block" role="alert">
            <strong>{{ $message }}</strong>
          </span>
        @enderror
      </div>

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
          />
        </div>
        @error('email')
          <span class="invalid-feedback d-block" role="alert">
            <strong>{{ $message }}</strong>
          </span>
        @enderror
      </div>

      {{-- <div class="input-box">
        <label class="label-text">Phone <span class="text-gray">(Optional)</span></label>
        <div class="form-group">
          <span class="la la-phone form-icon"></span>
          <input
            class="form-control form-control-styled @error('phone') is-invalid @enderror"
            type="text"
            name="phone"
            value="{{ old('phone') }}"
            placeholder="Phone number"
          />
        </div>
        @error('phone')
          <span class="invalid-feedback d-block" role="alert">
            <strong>{{ $message }}</strong>
          </span>
        @enderror
      </div> --}}



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
            placeholder="Confirm password"
            required
          />
        </div>
      </div>

      <div class="input-box py-4 user-action-meta">
        <div class="custom-checkbox">
          <input type="checkbox" id="agreeChb" required />
          <label for="agreeChb" class="font-size-14">
            By signing up, you agree to our
            <a href="#" class="text-color-2">Privacy Policy.</a>
          </label>
        </div>
      </div>

      <div class="btn-box">
        <button type="submit" class="theme-btn gradient-btn w-100">
          <i class="la la-user-plus me-1"></i> Register Account
        </button>
        <p class="sub-text-box text-end pt-1 font-weight-medium font-size-14">
          Already on Hammrly?
          <a class="text-color-2" href="{{ route('login') }}">Log in</a>
        </p>
      </div>
    </form>
  </div>
</div>
@endsection


