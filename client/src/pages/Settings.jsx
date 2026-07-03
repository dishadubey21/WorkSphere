import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/client.js';

// Design System
import Button from '../design-system/Button.jsx';
import Input from '../design-system/Input.jsx';
import Select from '../design-system/Select.jsx';
import Card from '../design-system/Card.jsx';
import Typography from '../design-system/Typography.jsx';
import Icons from '../design-system/Icons.jsx';
import Avatar from '../design-system/Avatar.jsx';
import PageLayout from '../layouts/PageLayout.jsx';

// APIs
import { getSettingsApi, updateSettingsApi, getPersonalSettingsApi, updatePersonalSettingsApi } from '../api/settings.api.js';
import { getEmployeesApi, updateEmployeeApi } from '../api/employee.api.js';

export const Settings = () => {
  const queryClient = useQueryClient();
  const { showToast } = useUI();
  const { user, refreshUser } = useAuth();

  // Tab State: 'profile' | 'system' | 'roles'
  const [activeTab, setActiveTab] = useState('profile');

  // Check permissions for rendering tabs
  const isAdmin = user?.role === 'Admin';

  // ==========================================
  // TAB 1: Profile Settings & Password Change
  // ==========================================
  const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      designation: '',
      avatar: '',
      address: '',
      emergencyContact: '',
      bio: ''
    }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, watch: watchPassword, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm({
    defaultValues: { password: '', confirmPassword: '' }
  });

  const newPasswordVal = watchPassword('password');

  // Populate profile form on load
  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        designation: user.designation || '',
        avatar: user.avatar || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        bio: user.bio || ''
      });
    }
  }, [user, resetProfile]);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const onUpdateProfile = async (formData) => {
    setProfileLoading(true);
    try {
      await apiClient.put(`/employees/${user._id}`, formData);
      await refreshUser();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'danger');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (formData) => {
    setPasswordLoading(true);
    try {
      await apiClient.put(`/employees/${user._id}`, { password: formData.password });
      resetPasswordForm();
      showToast('Password changed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'danger');
    } finally {
      setPasswordLoading(false);
    }
  };


  // ==========================================
  // TAB: Personal Settings (Theme & Notifications)
  // ==========================================
  const { data: personalData, isLoading: personalLoading } = useQuery({
    queryKey: ['personal-settings'],
    queryFn: () => getPersonalSettingsApi()
  });

  const { register: registerPersonal, handleSubmit: handleSubmitPersonal, reset: resetPersonal } = useForm();

  useEffect(() => {
    if (personalData?.settings) {
      resetPersonal(personalData.settings);
    }
  }, [personalData, resetPersonal]);

  const personalMutation = useMutation({
    mutationFn: (newData) => updatePersonalSettingsApi(newData),
    onSuccess: (res) => {
      showToast(res.message || 'Personal settings updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['personal-settings'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const onUpdatePersonal = (formData) => {
    personalMutation.mutate(formData);
  };


  // ==========================================
  // TAB 2: System Settings (Admin Only)
  // ==========================================
  const { data: systemData, isLoading: systemLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettingsApi(),
    enabled: isAdmin && activeTab === 'system'
  });

  const { register: registerSystem, handleSubmit: handleSubmitSystem, reset: resetSystem, formState: { errors: systemErrors } } = useForm();

  useEffect(() => {
    if (systemData?.settings) {
      resetSystem(systemData.settings);
    }
  }, [systemData, resetSystem]);

  const systemMutation = useMutation({
    mutationFn: (newData) => updateSettingsApi(newData),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const onUpdateSystem = (formData) => {
    systemMutation.mutate(formData);
  };


  // ==========================================
  // TAB 3: Role Management (Admin Only)
  // ==========================================
  const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['role-management-employees'],
    queryFn: () => getEmployeesApi({ limit: 100 }), // retrieve all
    enabled: isAdmin && activeTab === 'roles'
  });

  const employeesList = employeesData?.employees || [];

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => apiClient.put(`/employees/${id}`, { role }),
    onSuccess: (res) => {
      showToast(`User role updated successfully to ${res.employee?.role}!`, 'success');
      refetchEmployees();
      // If we updated ourselves, refresh context
      if (res.employee?._id === user._id) {
        refreshUser();
      }
    },
    onError: (err) => {
      showToast(err.message || 'Failed to update role', 'danger');
    }
  });

  const handleRoleChange = (empId, newRole) => {
    updateRoleMutation.mutate({ id: empId, role: newRole });
  };

  return (
    <PageLayout
      title="Workspace Settings"
      description="Configure your personal profile, secure credentials, and manage system preferences."
    >
      <div className="d-flex flex-column flex-md-row gap-4 animate-fadeIn">
        {/* Left Side: Tabs Navigation Panel */}
        <div className="col-12 col-md-3">
          <Card className="p-2 border border-light shadow-sm">
            <div className="d-flex flex-row flex-md-column nav flex-pills gap-1">
              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 fs-7 fw-medium transition-all border-0 bg-transparent ${activeTab === 'profile' ? 'bg-ws-primary-light text-ws-primary fw-bold' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('profile')}
              >
                <Icons.User size={16} className="me-2.5" /> Personal Profile
              </button>

              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 fs-7 fw-medium transition-all border-0 bg-transparent ${activeTab === 'security' ? 'bg-ws-primary-light text-ws-primary fw-bold' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('security')}
              >
                <Icons.Lock size={16} className="me-2.5" /> Security / Credentials
              </button>

              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 fs-7 fw-medium transition-all border-0 bg-transparent ${activeTab === 'notifications' ? 'bg-ws-primary-light text-ws-primary fw-bold' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Icons.Bell size={16} className="me-2.5" /> Notifications
              </button>

              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 fs-7 fw-medium transition-all border-0 bg-transparent ${activeTab === 'appearance' ? 'bg-ws-primary-light text-ws-primary fw-bold' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('appearance')}
              >
                <Icons.Kanban size={16} className="me-2.5" /> Theme & Appearance
              </button>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    className={`nav-link text-start py-2.5 px-3 rounded-2 fs-7 fw-medium transition-all border-0 bg-transparent ${activeTab === 'system' ? 'bg-ws-primary-light text-ws-primary fw-bold' : 'text-muted hover-bg-light'}`}
                    onClick={() => setActiveTab('system')}
                  >
                    <Icons.Settings size={16} className="me-2.5" /> System Settings
                  </button>
                  <button
                    type="button"
                    className={`nav-link text-start py-2.5 px-3 rounded-2 fs-7 fw-medium transition-all border-0 bg-transparent ${activeTab === 'roles' ? 'bg-ws-primary-light text-ws-primary fw-bold' : 'text-muted hover-bg-light'}`}
                    onClick={() => setActiveTab('roles')}
                  >
                    <Icons.Employees size={16} className="me-2.5" /> Role Management
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Tab View Pane */}
        <div className="flex-grow-1">
          {/* TAB 1: Profile View */}
          {activeTab === 'profile' && (
            <div className="d-flex flex-column gap-4">
              {/* Profile Details Form */}
              <Card className="p-4 border border-light shadow-sm">
                <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
                  <Avatar name={user?.name} src={user?.avatar} size="lg" />
                  <div>
                    <Typography variant="h3" className="mb-0">{user?.name}</Typography>
                    <span className="text-muted fs-8 text-capitalize">{user?.role} • {user?.department?.name || 'No Department'}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="d-flex flex-column gap-3.5">
                  <Typography variant="h4" className="mb-1 text-ws-primary">Profile Credentials</Typography>
                  
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <Input
                        label="Full Name"
                        name="name"
                        required
                        disabled={!isAdmin}
                        error={profileErrors.name?.message}
                        {...registerProfile('name', { required: 'Name is required' })}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <Input
                        label="Email Address"
                        name="email"
                        required
                        disabled={!isAdmin}
                        error={profileErrors.email?.message}
                        {...registerProfile('email', { required: 'Email is required' })}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <Input
                        label="Phone Number"
                        name="phone"
                        required
                        error={profileErrors.phone?.message}
                        {...registerProfile('phone', { required: 'Phone is required' })}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <Input
                        label="Designation"
                        name="designation"
                        required
                        disabled={!isAdmin}
                        error={profileErrors.designation?.message}
                        {...registerProfile('designation', { required: 'Designation is required' })}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <Input
                        label="Emergency Contact"
                        name="emergencyContact"
                        placeholder="Name - Phone"
                        error={profileErrors.emergencyContact?.message}
                        {...registerProfile('emergencyContact')}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <Input
                        label="Home Address"
                        name="address"
                        placeholder="123 Corporate Blvd, City, ST"
                        error={profileErrors.address?.message}
                        {...registerProfile('address')}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <Input
                      label="Avatar Image URL"
                      name="avatar"
                      error={profileErrors.avatar?.message}
                      {...registerProfile('avatar')}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label font-body fs-7 text-dark fw-medium mb-1.5">Personal Biography</label>
                    <textarea
                      className="form-control bg-light border-0 py-2 fs-7"
                      rows={3}
                      placeholder="Write a brief bio about yourself..."
                      {...registerProfile('bio')}
                    />
                  </div>

                  <div className="text-end">
                    <Button type="submit" loading={profileLoading} icon={<Icons.Check size={16} />}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* TAB: Security / Credentials */}
          {activeTab === 'security' && (
            <Card className="p-4 border border-light shadow-sm">
              <form onSubmit={handleSubmitPassword(onChangePassword)} className="d-flex flex-column gap-3.5">
                <div className="border-bottom pb-2 mb-2">
                  <Typography variant="h3" className="mb-0 text-danger">Change Secure Password</Typography>
                  <p className="text-muted fs-8 mb-0">Provide a secure new password for your enterprise credential access.</p>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <Input
                      label="New Password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      error={passwordErrors.password?.message}
                      {...registerPassword('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      error={passwordErrors.confirmPassword?.message}
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm password',
                        validate: value => value === newPasswordVal || 'Passwords do not match'
                      })}
                    />
                  </div>
                </div>

                <div className="text-end">
                  <Button type="submit" loading={passwordLoading} variant="danger" icon={<Icons.Check size={16} />}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB: Notifications */}
          {activeTab === 'notifications' && (
            <Card className="p-4 border border-light shadow-sm">
              <Typography variant="h3" className="mb-3 border-bottom pb-2">Notification Preferences</Typography>
              {personalLoading ? (
                <div className="text-center py-4 text-muted fs-8">Loading notification preferences...</div>
              ) : (
                <form onSubmit={handleSubmitPersonal(onUpdatePersonal)} className="d-flex flex-column gap-3.5">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      className="form-check-input"
                      {...registerPersonal('emailNotifications')}
                    />
                    <label htmlFor="emailNotifications" className="form-check-label fs-7 fw-medium text-dark">
                      Email Notifications
                    </label>
                    <p className="text-muted fs-8 mb-0">Receive email alerts for task assignments, comments, and milestones.</p>
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="pushNotifications"
                      className="form-check-input"
                      {...registerPersonal('pushNotifications')}
                    />
                    <label htmlFor="pushNotifications" className="form-check-label fs-7 fw-medium text-dark">
                      Push Notifications
                    </label>
                    <p className="text-muted fs-8 mb-0">Show real-time notifications in the sidebar dropdown widget.</p>
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="smsAlerts"
                      className="form-check-input"
                      {...registerPersonal('smsAlerts')}
                    />
                    <label htmlFor="smsAlerts" className="form-check-label fs-7 fw-medium text-dark">
                      SMS/Mobile Text Alerts
                    </label>
                    <p className="text-muted fs-8 mb-0">Receive critical emergency or holiday notifications on your registered phone.</p>
                  </div>

                  <div className="text-end border-top pt-3 mt-2">
                    <Button type="submit" loading={personalMutation.isPending} icon={<Icons.Check size={16} />}>
                      Save Notification Preferences
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* TAB: Appearance */}
          {activeTab === 'appearance' && (
            <Card className="p-4 border border-light shadow-sm">
              <Typography variant="h3" className="mb-3 border-bottom pb-2">Theme & Style Preferences</Typography>
              {personalLoading ? (
                <div className="text-center py-4 text-muted fs-8">Loading appearance settings...</div>
              ) : (
                <form onSubmit={handleSubmitPersonal(onUpdatePersonal)} className="d-flex flex-column gap-3.5">
                  <Select
                    label="Theme Mode Selection"
                    name="theme"
                    options={[
                      { value: 'light', label: 'WorkSphere Standard Light' },
                      { value: 'dark', label: 'Enterprise Dark (Omitted in this scope)' }
                    ]}
                    {...registerPersonal('theme')}
                  />

                  <div className="text-end border-top pt-3 mt-2">
                    <Button type="submit" loading={personalMutation.isPending} icon={<Icons.Check size={16} />}>
                      Save Appearance Settings
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* TAB 2: System Config */}
          {activeTab === 'system' && isAdmin && (
            <Card className="p-4 border border-light shadow-sm">
              <Typography variant="h3" className="mb-3 border-bottom pb-2">General Configurations</Typography>
              {systemLoading ? (
                <div className="text-center py-4 text-muted fs-8">Loading settings...</div>
              ) : (
                <form onSubmit={handleSubmitSystem(onUpdateSystem)} className="d-flex flex-column gap-4">
                  <div className="d-flex flex-column gap-3">
                    <Input
                      label="Workspace Company Name"
                      name="companyName"
                      required
                      error={systemErrors.companyName?.message}
                      {...registerSystem('companyName', { required: 'Company Name is required' })}
                    />
                    <Input
                      label="System Alert Email"
                      name="systemEmail"
                      type="email"
                      required
                      error={systemErrors.systemEmail?.message}
                      {...registerSystem('systemEmail', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                      })}
                    />
                  </div>

                  <Typography variant="h3" className="mb-1 border-bottom pb-2">Business Operations</Typography>
                  <div className="row g-3">
                    <div className="col-6">
                      <Input
                        label="Office Start Hour"
                        name="workingHoursStart"
                        type="time"
                        {...registerSystem('workingHoursStart')}
                      />
                    </div>
                    <div className="col-6">
                      <Input
                        label="Office End Hour"
                        name="workingHoursEnd"
                        type="time"
                        {...registerSystem('workingHoursEnd')}
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex flex-column gap-2">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="allowEmployeeLeaveRequests"
                        className="form-check-input"
                        {...registerSystem('allowEmployeeLeaveRequests')}
                      />
                      <label htmlFor="allowEmployeeLeaveRequests" className="form-check-label fs-7 fw-medium text-dark">
                        Allow staff leave applications
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="enableGlobalNotifications"
                        className="form-check-input"
                        {...registerSystem('enableGlobalNotifications')}
                      />
                      <label htmlFor="enableGlobalNotifications" className="form-check-label fs-7 fw-medium text-dark">
                        Enable global bulletin board notifications
                      </label>
                    </div>
                  </div>

                  <Typography variant="h3" className="mb-1 border-bottom pb-2">Visual Theme</Typography>
                  <Select
                    label="Standard Theme Preference"
                    name="themePreference"
                    options={[
                      { value: 'light', label: 'WorkSphere Standard Light' },
                      { value: 'dark', label: 'Enterprise Dark (Omitted in this scope)' }
                    ]}
                    {...registerSystem('themePreference')}
                  />

                  <div className="text-end border-top pt-3">
                    <Button type="submit" loading={systemMutation.isPending} icon={<Icons.Check size={16} />}>
                      Save System Settings
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* TAB 3: Role Management */}
          {activeTab === 'roles' && isAdmin && (
            <Card className="p-4 border border-light shadow-sm">
              <div className="border-bottom pb-2 mb-3">
                <Typography variant="h3" className="mb-0">User Role Management</Typography>
                <p className="text-muted fs-8 mb-0">Configure enterprise roles and access permissions for employees below.</p>
              </div>

              {employeesLoading ? (
                <div className="text-center py-4 text-muted fs-8">Loading employees directory...</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 fs-7">
                    <thead className="table-light">
                      <tr>
                        <th className="fw-semibold py-2">Employee</th>
                        <th className="fw-semibold py-2">Designation / Dept</th>
                        <th className="fw-semibold py-2">System Role</th>
                        <th className="fw-semibold py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesList.map((emp) => (
                        <tr key={emp._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2.5">
                              <Avatar src={emp.avatar} name={emp.name} size="sm" />
                              <div>
                                <div className="fw-bold text-dark">{emp.name}</div>
                                <div className="text-muted fs-8">{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium text-dark">{emp.designation}</div>
                            <span className="text-muted fs-8">{emp.department?.name || 'Unassigned'}</span>
                          </td>
                          <td style={{ width: '160px' }}>
                            <select
                              className="form-select bg-light border-0 py-1 fs-8"
                              style={{ borderRadius: '6px' }}
                              value={emp.role}
                              onChange={(e) => handleRoleChange(emp._id, e.target.value)}
                              disabled={updateRoleMutation.isPending}
                            >
                              <option value="Employee">Employee</option>
                              <option value="Team Lead">Team Lead</option>
                              <option value="Manager">Manager</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <span className={`badge rounded-pill fs-9 py-1 px-2.5 ${emp.status === 'Active' ? 'bg-ws-success-light text-ws-success' : 'bg-slate-100 text-muted'}`}>
                              {emp.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
