          <nav class="navbar navbar-expand bg-navbar dashboard-topbar mb-4">
            <button id="sidebarToggleTop" class="btn rounded-circle me-3">
              <i class="la la-bars"></i>
            </button>
            <ul class="navbar-nav ms-auto">
              {{-- <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle after-none"
                  href="#"
                  id="searchDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i class="la la-search"></i>
                </a>
                <div
                  class="dropdown-menu dropdown-menu-right p-3 animated--grow-in"
                  aria-labelledby="searchDropdown"
                >
                  <form class="search-box">
                    <div class="input-group">
                      <label class="input-label mb-0">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Search here..."
                        />
                      </label>
                      <div class="input-group-append">
                        <button class="btn btn-primary" type="button">
                          <i class="la la-search"></i>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </li>
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle after-none"
                  href="#"
                  id="alertsDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <i class="la la-bell"></i>
                  <span class="badge text-bg-danger badge-counter">3+</span>
                </a>
                <div
                  class="dropdown-menu dropdown-menu-right animated--grow-in"
                  aria-labelledby="alertsDropdown"
                >
                  <h6 class="generic-list-header">Alerts Center</h6>
                  <div class="generic-list scrollable-content scrollbar-hidden">
                    <a
                      class="generic-list-item d-flex align-items-center"
                      href="#"
                    >
                      <div class="icon-element flex-shrink-0 bg-1">
                        <i class="la la-file-alt text-white"></i>
                      </div>
                      <div class="ms-2">
                        <p class="small text-gray">December 12, 2019</p>
                        <p
                          class="text-truncate text-color font-size-14 font-weight-medium"
                        >
                          A new monthly report is ready to download!
                        </p>
                      </div>
                    </a>
                  </div>
                  <!-- end generic-list -->
                  <a
                    class="dropdown-item text-center small text-gray font-weight-medium py-2"
                    href="#"
                    >Show All Alerts</a
                  >
                </div>
              </li> --}}
              <li class="nav-item dropdown border-left ps-3 ms-4">
                <a
                  class="nav-link dropdown-toggle after-none"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <div class="user-thumb user-thumb-sm position-relative">

                      <img src="{{ asset('assets/images/avatar-img.jpg') }}" alt="author-image" />

                    <div class="status-indicator bg-success"></div>
                  </div>
                <span class="ms-2 small font-weight-medium d-none d-md-inline">{{ auth()->user()->name ?? 'Admin' }}</span>
                </a>
                <div
                  class="dropdown-menu dropdown-menu-sm dropdown-menu-right animated--grow-in py-2"
                  aria-labelledby="userDropdown"
                >
                  <a
                    class="dropdown-item text-color font-size-15"
                    href="{{ route('profile.edit') }}"
                  >
                    <i class="la la-user me-2 text-gray font-size-18"></i>
                    Profile
                  </a>
                  <form method="POST" action="{{ route('logout') }}" class="d-inline">
                    @csrf
                    <button type="submit" class="dropdown-item text-color font-size-15 border-0 bg-transparent w-100 text-start">
                      <i class="la la-power-off me-2 text-gray font-size-18"></i>
                      Logout
                    </button>
                  </form>
                </div>
              </li>
            </ul>
          </nav>
          <!-- end dashboard-topbar -->

