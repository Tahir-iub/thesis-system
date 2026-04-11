    <!-- ================================
    START DASHBOARD AREA
================================= -->
    <section class="dashboard-wrap d-flex">
        <ul class="navbar-nav dashboard-sidebar">
            <li>
                <span id="sidebar-close">
                    <i class="la la-times"></i>
                </span>
            </li>
            <li>
                <a class="sidebar-brand" href="#">
                    <img src="{{ asset('assets/images/hammrly-logo.png') }}" alt="logo"
                        style="max-height: 38px; width: auto; height: auto; object-fit: contain;" class="img-fluid" />
                </a>
            </li>
            <li class="sidebar-heading pt-3">Main</li>
            <li class="nav-item {{ request()->routeIs('#') ? 'active' : '' }}">
                <a class="nav-link" href="#">
                    <i class="la la-dashboard font-size-18 me-1"></i>
                    <span>Dashboard</span>
                </a>
            </li>

            <li>
                <hr class="sidebar-divider border-top-color" />
            </li>
            <li class="sidebar-heading">Management</li>

            @auth
                @if(auth()->user()->role_id == 1)
                    <li class="nav-item {{ request()->routeIs('users.index') && !request('role') ? 'active' : '' }}">
                        <a class="nav-link" href="{{ route('users.index') }}">
                            {{-- <i class="la la-user-alt font-size-18 me-1"></i> --}}
                            <i class="fa-solid fa-users"></i>
                            <span>Users</span>
                        </a>
                    </li>
                @endif
                 @if(auth()->user()->role_id == 2)
                    <li class="nav-item {{ request()->routeIs('users.index') && request('role') == 3 ? 'active' : '' }}">
                        <a class="nav-link" href="{{ route('users.index', ['role' => '3']) }}">
                            <i class="fa-solid fa-chalkboard-teacher"></i>
                            <span>Teachers</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->routeIs('users.index') && request('role') == 4 ? 'active' : '' }}">
                        <a class="nav-link" href="{{ route('users.index', ['role' => '4']) }}">
                            <i class="fa-solid fa-user-graduate"></i>
                            <span>Students</span>
                        </a>
                    </li>
                @endif
                 @if(auth()->user()->role_id == 3)
                    <li class="nav-item {{ request()->routeIs('users.index') && request('role') == 4? 'active' : '' }}">
                        <a class="nav-link" href="{{ route('users.index', ['role' => '4']) }}">
                            <i class="fa-solid fa-user-graduate"></i>
                            <span>Students</span>
                        </a>
                    </li>
                @endif
            @endauth




            <li class="nav-item">
                <form method="POST" action="{{ route('logout') }}" class="d-inline">
                    @csrf
                    <button type="submit" class="nav-link border-0 bg-transparent w-100 text-start">
                        <i class="la la-power-off font-size-18 me-1"></i>
                        <span>Logout</span>
                    </button>
                </form>
            </li>
        </ul>

        <style>
            /* Make sidebar scrollable */
            .dashboard-sidebar {
                overflow-y: auto !important;
                max-height: 100vh;
                padding-bottom: 30px;
            }

            /* Custom scrollbar styling */
            .dashboard-sidebar::-webkit-scrollbar {
                width: 6px;
            }

            .dashboard-sidebar::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
            }

            .dashboard-sidebar::-webkit-scrollbar-thumb {
                background: #4c60da;
                border-radius: 3px;
            }

            .dashboard-sidebar::-webkit-scrollbar-thumb:hover {
                background: #3a4db8;
            }
        </style>
