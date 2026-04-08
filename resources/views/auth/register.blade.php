<x-guest-layout>
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-4xl w-full mx-auto px-4 py-8">
            <div class="text-center mb-8">
                <h1 class="text-2xl font-semibold text-gray-900">Choose your role to register</h1>
                <p class="mt-2 text-sm text-gray-500">Select the type of account you want to create.</p>
            </div>

            <div class="grid gap-6 md:grid-cols-3">
                <!-- Student Card -->
                <a href="{{ route('register.student.show') }}" class="group border border-gray-200 rounded-lg p-6 flex flex-col items-start justify-between hover:border-gray-300 hover:shadow-sm transition">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900 mb-2">Register as Student</h2>
                        <p class="text-sm text-gray-500">Create a student account to manage your thesis and submissions.</p>
                    </div>
                    <span class="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Continue as Student
                        <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </a>

                <!-- Teacher Card -->
                <a href="{{ route('register.teacher.show') }}" class="group border border-gray-200 rounded-lg p-6 flex flex-col items-start justify-between hover:border-gray-300 hover:shadow-sm transition">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900 mb-2">Register as Teacher</h2>
                        <p class="text-sm text-gray-500">Create a teacher account to supervise and evaluate theses.</p>
                    </div>
                    <span class="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Continue as Teacher
                        <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </a>

                <!-- Clerk Card -->
                <a href="{{ route('register.clerk.show') }}" class="group border border-gray-200 rounded-lg p-6 flex flex-col items-start justify-between hover:border-gray-300 hover:shadow-sm transition">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900 mb-2">Register as Clerk</h2>
                        <p class="text-sm text-gray-500">Create a clerk account to manage system users and workflows.</p>
                    </div>
                    <span class="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Continue as Clerk
                        <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </a>
            </div>

            <div class="mt-8 text-center">
                <a href="{{ route('login') }}" class="text-sm text-gray-600 hover:text-gray-900">
                    Already registered? Log in
                </a>
            </div>
        </div>
    </div>
</x-guest-layout>
