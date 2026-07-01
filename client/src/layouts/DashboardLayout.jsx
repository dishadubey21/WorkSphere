import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';
import { useSearch } from '../context/SearchContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Design System
import Icons from '../design-system/Icons.jsx';
import Avatar from '../design-system/Avatar.jsx';
import Badge from '../design-system/Badge.jsx';
import Button from '../design-system/Button.jsx';
import Logo from '../design-system/Logo.jsx';
import { ToastContainer } from '../design-system/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// APIs
import { globalSearchApi } from '../api/search.api.js';
import { getNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from '../api/notification.api.js';

// Constants
import { getSidebarItems } from '../constants/sidebar.js';
import { ROUTES } from '../constants/routes.js';
import { hasRouteAccess, hasActionAccess } from '../constants/permissions.js';

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const {
    sidebarCollapsed,
    toggleSidebar,
    toasts,
    dismissToast,
    openDrawer,
    openModal
  } = useUI();

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    clearSearch
  } = useSearch();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown-container')) {
        setShowProfileMenu(false);
      }
      if (!event.target.closest('.notifications-dropdown-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch Notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotificationsApi(),
    refetchInterval: 15000 // poll notifications every 15s
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 2. Notification Mutations
  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationReadApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // 3. Search Fetch
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length >= 2) {
      setIsSearching(true);
      try {
        const res = await globalSearchApi(value);
        setSearchResults(res.results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults(null);
    }
  };

  // 4. Helper for date
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // 5. Build breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;

    if (path === ROUTES.DASHBOARD) {
      return ['Dashboard'];
    }

    const sidebarItems = getSidebarItems(user?.role || 'Employee');

    const matched = sidebarItems.find(item => item.path === path);

    if (matched) {
      return ['WorkSphere', matched.label];
    }

    return ['WorkSphere', 'Page'];
  };

  const breadcrumbs = getBreadcrumbs();

  const getSpeedDialActions = () => {
    if (!user) return [];
    if (user.role === 'Admin') {
      return [
        { label: 'Create Employee', icon: <Icons.User size={14} className="text-ws-primary" />, action: () => openDrawer('EMPLOYEE_CREATE') },
        { label: 'Create Project', icon: <Icons.Projects size={14} className="text-ws-secondary" />, action: () => openDrawer('PROJECT_CREATE') },
        { label: 'Create Team', icon: <Icons.Teams size={14} className="text-ws-success" />, action: () => openModal('TEAM_CREATE') },
        { label: 'Create Department', icon: <Icons.Departments size={14} className="text-ws-info" />, action: () => openModal('DEPARTMENT_CREATE') },
        { label: 'Create Announcement', icon: <Icons.Announcements size={14} className="text-ws-danger" />, action: () => openModal('ANNOUNCEMENT_CREATE') },
        { label: 'Create Task', icon: <Icons.Tasks size={14} className="text-ws-accent" />, action: () => openDrawer('TASK_CREATE') }
      ];
    }
    if (user.role === 'Manager') {
      return [
        { label: 'Create Sprint', icon: <Icons.Calendar size={14} className="text-ws-secondary" />, action: () => openModal('SPRINT_CREATE') },
        { label: 'Create Task', icon: <Icons.Tasks size={14} className="text-ws-accent" />, action: () => openDrawer('TASK_CREATE') },
        { label: 'Assign Task', icon: <Icons.User size={14} className="text-ws-primary" />, action: () => openDrawer('TASK_CREATE') }
      ];
    }
    if (user.role === 'Team Lead') {
      return [
        { label: 'Create Task', icon: <Icons.Tasks size={14} className="text-ws-accent" />, action: () => openDrawer('TASK_CREATE') },
        { label: 'Assign Task', icon: <Icons.User size={14} className="text-ws-primary" />, action: () => openDrawer('TASK_CREATE') }
      ];
    }
    return [];
  };

  const dialActions = getSpeedDialActions();

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Off-canvas sidebar mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar-wrapper shadow-sm d-flex flex-column ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-expanded' : ''}`}>
        <div className="p-4 d-flex align-items-center justify-content-between border-bottom border-light" style={{ height: '70px' }}>
          {!sidebarCollapsed && (
            <Link to={ROUTES.DASHBOARD} className="text-decoration-none">
              <Logo size={28} variant="dark" />
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to={ROUTES.DASHBOARD} className="text-decoration-none mx-auto">
              <Logo size={28} iconOnly variant="dark" />
            </Link>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            className="btn btn-link text-muted p-1 border-0 bg-transparent rounded-2 d-none d-lg-flex"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <Icons.ChevronRight size={18} /> : <Icons.ArrowLeft size={18} />}
          </button>
        </div>

        <nav className="flex-grow-1 overflow-auto py-3 px-2">
          <ul className="nav flex-column gap-1">
            {getSidebarItems(user?.role || 'Employee').map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = Icons[item.iconKey];

              return (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`nav-link rounded-3 py-2.5 px-3 d-flex align-items-center transition-all ${isActive
                      ? 'bg-ws-primary-light text-ws-primary fw-medium'
                      : 'text-muted hover-bg-light'
                      }`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <span className="d-flex align-items-center justify-content-center">
                      <IconComponent size={18} />
                    </span>
                    {!sidebarCollapsed && <span className="ms-3 font-body fs-7">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-top border-light mt-auto">
          {!sidebarCollapsed ? (
            <div className="d-flex align-items-center gap-3">
              <Avatar name={user?.name} src={user?.avatar} size="sm" />
              <div className="overflow-hidden">
                <p className="font-heading fw-bold text-dark fs-7 mb-0 text-truncate">{user?.name}</p>
                <p className="font-body text-muted fs-8 mb-0 text-truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-center">
              <Avatar name={user?.name} src={user?.avatar} size="sm" />
            </div>
          )}
        </div>
      </aside>

      {/* MAIN SCREEN AREA */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden min-vh-100">
        {/* STICKY TOP NAVBAR */}
        <header
          className="navbar navbar-expand navbar-light border-bottom border-light px-4 sticky-top py-2.5"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100,
            height: '70px'
          }}
        >
          <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
            {/* Left: Breadcrumbs & Date */}
            <div className="d-flex flex-column d-none d-sm-flex">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-1 fs-8">
                  {breadcrumbs.map((crumb, idx) => (
                    <li
                      key={crumb}
                      className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active fw-medium text-dark' : 'text-muted'}`}
                    >
                      {crumb}
                    </li>
                  ))}
                </ol>
              </nav>
              <span className="font-body text-muted fs-8">{getFormattedDate()}</span>
            </div>

            {/* Mobile Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              className="btn btn-link text-muted p-1 border-0 bg-transparent rounded-2 d-lg-none me-3"
            >
              <Icons.Menu size={20} />
            </button>

            {/* Right: Search & Notifications & Quick Actions */}
            <div className="d-flex align-items-center gap-3 ms-auto position-relative">
              {/* Global Search Input */}
              <div className="position-relative d-none d-md-block" style={{ width: '280px' }}>
                <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted d-flex align-items-center">
                  <Icons.Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search WorkSphere..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="form-control bg-light rounded-pill border-0 ps-5 py-1.5 fs-7 w-100"
                />

                {/* Search Dropdown Overlay */}
                {searchTerm.trim().length >= 2 && (
                  <div className="search-results-overlay p-3">
                    <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                      <span className="fw-bold fs-7 text-dark">Search Results</span>
                      <button className="btn btn-link text-muted p-0 fs-8 border-0" onClick={clearSearch}>Clear</button>
                    </div>

                    {isSearching ? (
                      <div className="text-center py-3 fs-8 text-muted">Searching...</div>
                    ) : searchResults && Object.values(searchResults).every(arr => arr.length === 0) ? (
                      <div className="text-center py-3 fs-8 text-muted">No results found for "{searchTerm}"</div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {searchResults?.employees?.length > 0 && (
                          <div>
                            <div className="text-uppercase fw-bold text-muted fs-9 mb-1">Employees</div>
                            <div className="d-flex flex-column gap-1.5">
                              {searchResults.employees.map(emp => (
                                <Link to={ROUTES.EMPLOYEES} key={emp._id} onClick={clearSearch} className="text-decoration-none d-flex align-items-center gap-2 hover-bg-light p-1 rounded-2">
                                  <Avatar src={emp.avatar} name={emp.name} size="xs" />
                                  <div>
                                    <div className="text-dark fs-7 fw-medium">{emp.name}</div>
                                    <div className="text-muted fs-8">{emp.designation}</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults?.projects?.length > 0 && (
                          <div>
                            <div className="text-uppercase fw-bold text-muted fs-9 mb-1">Projects</div>
                            <div className="d-flex flex-column gap-1">
                              {searchResults.projects.map(p => (
                                <Link to={ROUTES.PROJECTS} key={p._id} onClick={clearSearch} className="text-decoration-none d-flex align-items-center justify-content-between hover-bg-light p-1 rounded-2">
                                  <span className="text-dark fs-7 fw-medium">{p.name}</span>
                                  <Badge variant="primary">{p.status}</Badge>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {searchResults?.tasks?.length > 0 && (
                          <div>
                            <div className="text-uppercase fw-bold text-muted fs-9 mb-1">Tasks</div>
                            <div className="d-flex flex-column gap-1">
                              {searchResults.tasks.map(t => (
                                <Link to={ROUTES.KANBAN} key={t._id} onClick={clearSearch} className="text-decoration-none d-flex align-items-center justify-content-between hover-bg-light p-1 rounded-2">
                                  <span className="text-dark fs-7 fw-medium text-truncate" style={{ maxWidth: '180px' }}>{t.title}</span>
                                  <span className="text-muted fs-8">{t.status}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications Popover */}
              <div className="position-relative notifications-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowNotifications(prev => !prev)}
                  className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center border-0"
                  title="Notifications"
                >
                  <Icons.Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white fs-9" style={{ marginTop: '5px', marginLeft: '-5px' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border border-light p-3" style={{ width: '320px', zIndex: 1020 }}>
                    <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                      <span className="fw-bold fs-7 text-dark">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-link text-ws-primary fs-8 p-0 border-0 text-decoration-none fw-medium bg-transparent"
                          onClick={() => {
                            markAllReadMutation.mutate();
                            setShowNotifications(false);
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-auto" style={{ maxHeight: '250px' }}>
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-muted fs-8">No notifications yet.</div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => {
                                if (!notif.isRead) markReadMutation.mutate(notif._id);
                                setShowNotifications(false);

                                const isEmp = user?.role === 'Employee';
                                if (notif.category === 'Leave') {
                                  navigate(ROUTES.LEAVES);
                                } else if (notif.category === 'Task') {
                                  navigate(isEmp ? '/my-tasks' : ROUTES.TASKS);
                                } else if (notif.category === 'Project') {
                                  navigate(isEmp ? '/my-projects' : ROUTES.PROJECTS);
                                } else if (notif.category === 'Announcement') {
                                  if (notif.title.toLowerCase().includes('document')) {
                                    navigate(ROUTES.DOCUMENTS);
                                  } else {
                                    navigate(ROUTES.ANNOUNCEMENTS);
                                  }
                                }
                              }}
                              className={`p-2 rounded-2 transition-all cursor-pointer ${notif.isRead ? 'opacity-70 bg-light' : 'bg-ws-primary-light border-start border-3 border-ws-primary'}`}
                            >
                              <div className="d-flex align-items-center justify-content-between mb-0.5">
                                <span className="fw-semibold fs-8 text-dark">{notif.title}</span>
                                <span className="text-muted fs-9">{new Date(notif.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="fs-8 text-muted mb-0">{notif.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Profile Dropdown */}
              <div className="position-relative profile-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="btn p-0 border-0 bg-transparent d-flex align-items-center gap-2"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                  title="Profile Options"
                >
                  <Avatar name={user?.name} src={user?.avatar} size="sm" />
                  <div className="d-none d-md-block text-start">
                    <p className="fw-semibold text-dark fs-7 mb-0 leading-none">{user?.name}</p>
                    <span className="text-muted fs-8">{user?.role}</span>
                  </div>
                  <Icons.ChevronDown size={14} className="text-muted d-none d-md-block" />
                </button>

                {showProfileMenu && (
                  <div
                    className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border border-light p-2 dropdown-menu-custom animate-scaleUp"
                    style={{ width: '220px', zIndex: 1030 }}
                  >
                    <div className="px-3 py-2 border-bottom border-light mb-1">
                      <p className="fw-semibold text-dark fs-7 mb-0">{user?.name}</p>
                      <p className="text-muted fs-8 mb-0 text-truncate text-slate-500">{user?.email}</p>
                      <p className="text-muted fs-9 mb-0 fw-medium text-capitalize mt-0.5" style={{ color: 'var(--ws-primary)' }}>
                        {user?.role} • {user?.department?.name || 'No Dept'}
                      </p>
                    </div>
                    <Link
                      to={ROUTES.SETTINGS}
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 rounded-2 fs-7 text-dark text-decoration-none hover-bg-light"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Icons.User size={14} className="text-muted" /> My Profile
                    </Link>
                    <Link
                      to={ROUTES.SETTINGS}
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 rounded-2 fs-7 text-dark text-decoration-none hover-bg-light"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Icons.Settings size={14} className="text-muted" /> Settings
                    </Link>
                    <button
                      type="button"
                      className="dropdown-item w-100 text-start d-flex align-items-center gap-2 px-3 py-2 rounded-2 fs-7 text-dark border-0 bg-transparent hover-bg-light"
                      onClick={() => {
                        setShowNotifications(true);
                        setShowProfileMenu(false);
                      }}
                    >
                      <Icons.Bell size={14} className="text-muted" /> Notifications
                    </button>
                    <div className="dropdown-divider my-1 border-top border-light"></div>
                    <button
                      type="button"
                      className="dropdown-item w-100 text-start d-flex align-items-center gap-2 px-3 py-2 rounded-2 fs-7 text-danger border-0 bg-transparent hover-bg-danger-light"
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                    >
                      <Icons.Close size={14} className="text-danger" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER ROUTE VIEW */}
        <main className="flex-grow-1 p-4 overflow-auto">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="footer bg-white border-top border-light px-4 py-3 text-center">
          <span className="font-body text-muted fs-8">© {new Date().getFullYear()} WorkSphere. Your Complete Digital Workplace.</span>
        </footer>
      </div>

      {/* FLOATING ACTION SPEED DIAL */}
      {dialActions.length > 0 && (
        <div className="speed-dial-container">
          <button
            type="button"
            onClick={() => setSpeedDialOpen(prev => !prev)}
            className={`speed-dial-trigger btn btn-ws-primary d-flex align-items-center justify-content-center text-white ${speedDialOpen ? 'open' : ''}`}
            title="Quick Actions"
          >
            <Icons.Plus size={24} />
          </button>
          <div className={`speed-dial-menu ${speedDialOpen ? 'open' : ''}`}>
            {dialActions.map((act, index) => (
              <button
                key={index}
                type="button"
                className="speed-dial-item btn btn-light rounded-pill px-3 py-1.5 fs-8 fw-semibold border border-light d-flex align-items-center gap-1.5 shadow-sm text-dark hover-bg-light"
                onClick={() => { act.action(); setSpeedDialOpen(false); }}
              >
                {act.icon} {act.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLOAT TOAST CENTER */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default DashboardLayout;
