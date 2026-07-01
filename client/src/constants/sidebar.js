import { ROUTES } from './routes.js';

export const getSidebarItems = (role) => {
  if (role === 'Admin') {
    return [
      { label: 'Dashboard', path: ROUTES.DASHBOARD, iconKey: 'Dashboard' },
      { label: 'Employees', path: ROUTES.EMPLOYEES, iconKey: 'Employees' },
      { label: 'Departments', path: ROUTES.DEPARTMENTS, iconKey: 'Departments' },
      { label: 'Teams', path: ROUTES.TEAMS, iconKey: 'Teams' },
      { label: 'Projects', path: ROUTES.PROJECTS, iconKey: 'Projects' },
      { label: 'Tasks', path: ROUTES.TASKS, iconKey: 'Tasks' },
      { label: 'Kanban Board', path: ROUTES.KANBAN, iconKey: 'Kanban' },
      { label: 'Leave Management', path: ROUTES.LEAVES, iconKey: 'Leaves' },
      { label: 'Announcements', path: ROUTES.ANNOUNCEMENTS, iconKey: 'Announcements' },
      { label: 'Documents', path: ROUTES.DOCUMENTS, iconKey: 'Documents' },
      { label: 'Calendar', path: ROUTES.CALENDAR, iconKey: 'Calendar' },
      { label: 'Reports', path: ROUTES.REPORTS, iconKey: 'Reports' },
      { label: 'Activity Logs', path: ROUTES.ACTIVITY_LOGS, iconKey: 'ActivityLogs' },
      { label: 'Settings', path: ROUTES.SETTINGS, iconKey: 'Settings' }
    ];
  }

  if (role === 'Manager') {
    return [
      { label: 'Dashboard', path: ROUTES.DASHBOARD, iconKey: 'Dashboard' },
      { label: 'Teams', path: ROUTES.TEAMS, iconKey: 'Teams' },
      { label: 'Projects', path: ROUTES.PROJECTS, iconKey: 'Projects' },
      { label: 'Tasks', path: ROUTES.TASKS, iconKey: 'Tasks' },
      { label: 'Kanban Board', path: ROUTES.KANBAN, iconKey: 'Kanban' },
      { label: 'Leave', path: ROUTES.LEAVES, iconKey: 'Leaves' },
      { label: 'Announcements', path: ROUTES.ANNOUNCEMENTS, iconKey: 'Announcements' },
      { label: 'Documents', path: ROUTES.DOCUMENTS, iconKey: 'Documents' },
      { label: 'Calendar', path: ROUTES.CALENDAR, iconKey: 'Calendar' },
      { label: 'Settings', path: ROUTES.SETTINGS, iconKey: 'Settings' }
    ];
  }

  if (role === 'Team Lead') {
    return [
      { label: 'Dashboard', path: ROUTES.DASHBOARD, iconKey: 'Dashboard' },
      { label: 'Teams', path: ROUTES.TEAMS, iconKey: 'Teams' },
      { label: 'Projects', path: ROUTES.PROJECTS, iconKey: 'Projects' },
      { label: 'Tasks', path: ROUTES.TASKS, iconKey: 'Tasks' },
      { label: 'Kanban Board', path: ROUTES.KANBAN, iconKey: 'Kanban' },
      { label: 'Leave', path: ROUTES.LEAVES, iconKey: 'Leaves' },
      { label: 'Announcements', path: ROUTES.ANNOUNCEMENTS, iconKey: 'Announcements' },
      { label: 'Documents', path: ROUTES.DOCUMENTS, iconKey: 'Documents' },
      { label: 'Calendar', path: ROUTES.CALENDAR, iconKey: 'Calendar' },
      { label: 'Settings', path: ROUTES.SETTINGS, iconKey: 'Settings' }
    ];
  }

  // Default to Employee
  return [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, iconKey: 'Dashboard' },
    { label: 'My Tasks', path: '/my-tasks', iconKey: 'Tasks' },
    { label: 'My Projects', path: '/my-projects', iconKey: 'Projects' },
    { label: 'Leave', path: ROUTES.LEAVES, iconKey: 'Leaves' },
    { label: 'Announcements', path: ROUTES.ANNOUNCEMENTS, iconKey: 'Announcements' },
    { label: 'Documents', path: ROUTES.DOCUMENTS, iconKey: 'Documents' },
    { label: 'Calendar', path: ROUTES.CALENDAR, iconKey: 'Calendar' },
    { label: 'Settings', path: ROUTES.SETTINGS, iconKey: 'Settings' }
  ];
};
