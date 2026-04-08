@extends('layout.app')

@section('content')
<div class="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
    <div class="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <header class="flex items-center justify-between mb-12">
            <div class="flex items-center gap-4">
                <img src="{{ asset('assets/images/iub-logo.png') }}" alt="University logo" class="h-14 w-auto"/>
                <div>
                    <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Thesis Management System</h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Institution Portal · Streamlined Thesis Workflows</p>
                </div>
            </div>


        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <!-- Big crest and title block -->
            <div class="lg:col-span-6 flex flex-col items-start gap-6">
                <h2 class="text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white tracking-tight">The Islamia University of Bahawalpur</h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">Built for students, teachers, and administrators — manage thesis proposals, drafts, supervision, reviews, and final approvals in a single, secure platform.</p>


            </div>



            <!-- Role selection card (full-width below hero) -->
            <div class="lg:col-span-12 mt-6">
                <div class="max-w-3xl mx-auto bg-white dark:bg-[#061217] border border-gray-100 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Choose your role</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Select how you want to join the platform.</p>

                        <div class="mt-6 divide-y divide-gray-100 dark:divide-neutral-800">
                            <a href="{{ route('register.student.show') }}" class="group flex items-center justify-between gap-4 py-4 px-2 hover:bg-gray-50 dark:hover:bg-neutral-900 transition focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded">
                                <div class="flex items-center gap-4">
                                    <div class="rounded-md bg-indigo-50 text-indigo-600 p-3">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14l9-5-9-5-9 5 9 5z"/></svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">Student</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">Submit work, track feedback and deadlines.</div>
                                    </div>
                                </div>
                                <div class="text-indigo-600 group-hover:text-indigo-700 font-medium">Get started →</div>
                            </a>

                            <a href="{{ route('register.teacher.show') }}" class="group flex items-center justify-between gap-4 py-4 px-2 hover:bg-gray-50 dark:hover:bg-neutral-900 transition focus:outline-none focus:ring-2 focus:ring-amber-200 rounded">
                                <div class="flex items-center gap-4">
                                    <div class="rounded-md bg-amber-50 text-amber-700 p-3">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l4-4 4 4M12 20V4"/></svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">Teacher</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">Supervise, review and manage student theses.</div>
                                    </div>
                                </div>
                                <div class="text-indigo-600 group-hover:text-indigo-700 font-medium">Join as Teacher →</div>
                            </a>

                            <a href="{{ route('register.clerk.show') }}" class="group flex items-center justify-between gap-4 py-4 px-2 hover:bg-gray-50 dark:hover:bg-neutral-900 transition focus:outline-none focus:ring-2 focus:ring-green-200 rounded">
                                <div class="flex items-center gap-4">
                                    <div class="rounded-md bg-green-50 text-green-700 p-3">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M3 12h18M3 17h18"/></svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">Clerk</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">Process approvals, manage records and paperwork.</div>
                                    </div>
                                </div>
                                <div class="text-indigo-600 group-hover:text-indigo-700 font-medium">Office Signup →</div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
