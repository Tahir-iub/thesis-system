<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <meta name="author" content="Hammrly" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <meta name="google-adsense-account" content="ca-pub-3217304762004705">
    <title>@yield('title', 'Admin Authentication - Hammrly')</title>
    <!-- Favicon -->
    {{-- <link rel="icon" href="{{ asset('assets/images/favicon.png') }}" /> --}}
    <link rel="icon" type="image/png" href="{{ asset('assets/images/h-logo2.png') }}" />


    <!-- Google Fonts -->
    <link
      href="https://fonts.googleapis.com/css2?family=Be+Vietnam:wght@100;300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />

    <!-- Template CSS Files -->
    <link rel="stylesheet" href="{{ asset('assets/css/bootstrap.min.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/css/line-awesome.min.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/css/animated-headline.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/css/chosen.min.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}" />

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3217304762004705"
            crossorigin="anonymous"></script>

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-085BC4C9KB"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-085BC4C9KB');
    </script>

    @stack('styles')
  </head>
  <body>
    <!-- start per-loader -->
    <div class="loader-container">
      <div class="loader-ripple">
        <div></div>
        <div></div>
      </div>
    </div>
    <!-- end per-loader -->

    <div class="auth-wrapper d-flex align-items-center justify-content-center min-vh-100" style="background: #f5f7fc; padding: 40px 0;">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-5 col-md-7">
            <div class="auth-content-wrapper bg-white p-4 rounded shadow-sm">
              <div class="text-center mb-4">
                <a href="{{ route('login') }}">
                  <img src="{{ asset('assets/images/iub-logo.png') }}" alt="logo" class="auth-logo" style="max-height: 120px; width: auto;" />
                </a>
              </div>

              @if(session('status'))
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                  {{ session('status') }}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              @endif

              @if(session('verified'))
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                  Your email has been verified successfully!
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              @endif

              @if($errors->any())
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                  <ul class="mb-0">
                    @foreach($errors->all() as $error)
                      <li>{{ $error }}</li>
                    @endforeach
                  </ul>
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              @endif

              @yield('content')
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template JS Files -->
    <script src="{{ asset('assets/js/jquery-3.7.1.min.js') }}"></script>
    <script src="{{ asset('assets/js/bootstrap.bundle.min.js') }}"></script>
    <script src="{{ asset('assets/js/chosen.min.js') }}"></script>
    <script src="{{ asset('assets/js/main.js') }}"></script>

    @stack('scripts')
  </body>
</html>

