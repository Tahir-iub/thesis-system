<header class="bg-white border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="{{ url('/') }}" class="flex items-center gap-3">
            <x-application-logo class="h-8 w-8"/>
            <div>
                <div class="text-sm font-semibold">{{ config('app.name') }}</div>
                <div class="text-xs text-gray-500">University Portal</div>
            </div>
        </a>

        <nav class="flex items-center gap-4 text-sm">
            @auth
                <a href="{{ route('dashboard') }}" class="text-gray-700">Dashboard</a>
                <form method="POST" action="{{ route('logout') }}">@csrf
                    <button type="submit" class="text-sm text-red-600">Logout</button>
                </form>
            @else
                <a href="{{ route('login') }}" class="text-indigo-600">Login</a>
            @endauth
        </nav>
    </div>
</header>
