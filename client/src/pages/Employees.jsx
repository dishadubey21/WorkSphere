import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext.jsx';

// Design System
import Drawer from '../design-system/Drawer.jsx';
import Button from '../design-system/Button.jsx';
import Input from '../design-system/Input.jsx';
import Select from '../design-system/Select.jsx';
import Avatar from '../design-system/Avatar.jsx';
import Badge from '../design-system/Badge.jsx';
import Icons from '../design-system/Icons.jsx';
import TableLayout from '../layouts/TableLayout.jsx';
import Typography from '../design-system/Typography.jsx';
import { Modal } from '../design-system/Modal.jsx';

// APIs
import { getEmployeesApi, createEmployeeApi, updateEmployeeApi, deleteEmployeeApi, resetEmployeePasswordApi } from '../api/employee.api.js';
import { getDepartmentsApi } from '../api/department.api.js';

// Form Component inside Employees.jsx
export const EmployeeForm = ({ employee, departments = [], employees = [], onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: employee ? {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department?._id || '',
      designation: employee.designation,
      manager: employee.manager?._id || '',
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
      address: employee.address || '',
      avatar: employee.avatar || ''
    } : {
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      manager: '',
      joiningDate: new Date().toISOString().split('T')[0],
      address: '',
      avatar: '',
      password: ''
    }
  });

  const queryClient = useQueryClient();
  const { showToast } = useUI();

  // Create/Update mutations
  const mutation = useMutation({
    mutationFn: (data) => {
      if (employee) {
        return updateEmployeeApi({ id: employee._id, ...data });
      }
      return createEmployeeApi(data);
    },
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      reset();
      onSuccess();
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const onSubmit = (data) => {
    // Clear manager and department string placeholders if empty
    if (!data.manager) delete data.manager;
    if (!data.department) delete data.department;
    mutation.mutate(data);
  };

  const deptOptions = departments.map(d => ({ value: d._id, label: `${d.name} (${d.code})` }));
  const managerOptions = employees
    .filter(e => !employee || e._id !== employee._id) // prevent managing oneself
    .map(e => ({ value: e._id, label: `${e.name} (${e.designation})` }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
      <Input
        label="Full Name"
        name="name"
        required
        error={errors.name?.message}
        {...register('name', { required: 'Name is required' })}
      />
      <Input
        label="Email Address"
        name="email"
        type="email"
        required
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
        })}
      />
      <Input
        label="Phone Number"
        name="phone"
        required
        error={errors.phone?.message}
        {...register('phone', { required: 'Phone is required' })}
      />
      <Select
        label="Department"
        name="department"
        placeholder="Select Department"
        required
        error={errors.department?.message}
        options={deptOptions}
        {...register('department', { required: 'Department is required' })}
      />
      <Input
        label="Designation"
        name="designation"
        required
        error={errors.designation?.message}
        {...register('designation', { required: 'Designation is required' })}
      />
      <Select
        label="Manager"
        name="manager"
        placeholder="None (Top Level)"
        error={errors.manager?.message}
        options={managerOptions}
        {...register('manager')}
      />
      <Input
        label="Joining Date"
        name="joiningDate"
        type="date"
        required
        error={errors.joiningDate?.message}
        {...register('joiningDate', { required: 'Joining date is required' })}
      />
      <Input
        label="Avatar Photo URL"
        name="avatar"
        placeholder="https://randomuser.me/api/portraits/..."
        error={errors.avatar?.message}
        {...register('avatar')}
      />
      <Input
        label="Home Address"
        name="address"
        error={errors.address?.message}
        {...register('address')}
      />
      {!employee && (
        <Input
          label="Password"
          name="password"
          type="password"
          required
          error={errors.password?.message}
          {...register('password', { 
            required: 'Password is required for new employees',
            minLength: { value: 6, message: 'Password must be at least 6 characters' }
          })}
        />
      )}
      <div className="d-flex gap-2 justify-content-end mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {employee ? 'Save Changes' : 'Add Employee'}
        </Button>
      </div>
    </form>
  );
};

export const Employees = () => {
  const queryClient = useQueryClient();
  const { activeDrawer, openDrawer, closeDrawer, showToast } = useUI();

  // Search & Pagination States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [sort, setSort] = useState('name:asc');
  const [page, setPage] = useState(1);

  // Dropdown & Modal States
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [targetEmployee, setTargetEmployee] = useState(null);

  // Close dropdowns on click anywhere
  useEffect(() => {
    const handleClose = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, []);

  // 1. Fetch Employees
  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search, department, sort, page }],
    queryFn: () => getEmployeesApi({ search, department, sort, page, limit: 10 }),
    keepPreviousData: true
  });

  // 2. Fetch Departments (for filter and dropdown)
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartmentsApi()
  });

  // 3. Fetch all employees (for manager assignments)
  const { data: allEmployeesData } = useQuery({
    queryKey: ['employees-all-list'],
    queryFn: () => getEmployeesApi({ limit: 1000 })
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEmployeeApi(id),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => updateEmployeeApi({ id, role }),
    onSuccess: (data) => {
      showToast('Employee role updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateEmployeeApi({ id, status }),
    onSuccess: (data) => {
      showToast(`Employee status set to ${data.employee?.status || 'updated'}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (id) => resetEmployeePasswordApi(id),
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
      setResetModalOpen(true);
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this employee? This will also remove them from any managed departments.')) {
      deleteMutation.mutate(id);
    }
  };

  const employees = data?.employees || [];
  const pagination = data?.pagination;
  const departments = deptData?.departments || [];
  const allEmployees = allEmployeesData?.employees || [];

  const headers = [
    'Employee',
    'Role',
    'Status',
    'Department',
    'Designation',
    'Manager',
    'Joining Date',
    'Actions'
  ];

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Admin': return 'danger';
      case 'Manager': return 'secondary';
      case 'Team Lead': return 'warning';
      default: return 'light';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Suspended': return 'danger';
      default: return 'light';
    }
  };

  const filterElements = (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
        <div className="position-relative w-100">
          <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
            <Icons.Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-control rounded-pill border-ws-border ps-5 py-2 fs-7"
          />
        </div>
      </div>
      <div className="d-flex flex-wrap gap-2.5">
        <select
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          className="form-select rounded-3 border-ws-border fs-7 py-2 px-3"
          style={{ width: '180px' }}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="form-select rounded-3 border-ws-border fs-7 py-2 px-3"
          style={{ width: '180px' }}
        >
          <option value="name:asc">Name: A to Z</option>
          <option value="name:desc">Name: Z to A</option>
          <option value="joiningDate:desc">Newest Hired</option>
          <option value="joiningDate:asc">Oldest Hired</option>
        </select>
        <Button onClick={() => openDrawer('EMPLOYEE_CREATE')} icon={<Icons.Plus size={16} />}>
          Add Employee
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="d-flex flex-column gap-4 animate-fadeIn">
        <div className="d-flex align-items-center justify-content-between border-bottom pb-3">
          <div>
            <Typography variant="h2">Employee Directory</Typography>
            <Typography variant="body1">Search, organize, and manage employee records.</Typography>
          </div>
        </div>

        <TableLayout
          headers={headers}
          loading={isLoading}
          isEmpty={employees.length === 0}
          emptyIllustration="employees"
          emptyTitle="No Employees Found"
          emptyDescription="Start building your workforce directory by adding a new employee profile."
          emptyActionLabel="Add Employee"
          onEmptyAction={() => openDrawer('EMPLOYEE_CREATE')}
          pagination={pagination}
          onPageChange={setPage}
          filters={filterElements}
        >
          {employees.map((emp) => (
            <tr key={emp._id}>
              <td>
                <div className="d-flex align-items-center gap-3">
                  <Avatar src={emp.avatar} name={emp.name} size="sm" />
                  <div>
                    <span className="fw-semibold text-dark fs-7 d-block">{emp.name}</span>
                    <span className="text-muted fs-8 d-block">{emp.email}</span>
                  </div>
                </div>
              </td>
              <td>
                <Badge variant={getRoleBadgeVariant(emp.role)}>{emp.role}</Badge>
              </td>
              <td>
                <Badge variant={getStatusBadgeVariant(emp.status)}>{emp.status}</Badge>
              </td>
              <td>
                {emp.department ? (
                  <Badge variant="primary">{emp.department.name}</Badge>
                ) : (
                  <span className="text-muted fs-7">—</span>
                )}
              </td>
              <td className="text-muted fs-7">{emp.designation}</td>
              <td>
                {emp.manager ? (
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-7 text-dark fw-medium">{emp.manager.name}</span>
                  </div>
                ) : (
                  <span className="text-muted fs-7">—</span>
                )}
              </td>
              <td className="text-muted fs-7">
                {new Date(emp.joiningDate).toLocaleDateString()}
              </td>
              <td>
                <div className="position-relative">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === emp._id ? null : emp._id); }}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fs-8 py-1 px-2.5 rounded-3"
                    style={{ borderWidth: '1.5px' }}
                  >
                    Manage <Icons.ChevronDown size={12} />
                  </button>
                  {openDropdownId === emp._id && (
                    <div 
                      className="position-absolute bg-white border border-light rounded-3 shadow-lg py-1.5 z-3 end-0 animate-slideUp"
                      style={{ minWidth: '170px', top: '100%', marginTop: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => { openDrawer('EMPLOYEE_EDIT', emp); setOpenDropdownId(null); }}
                        className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-dark hover-bg-light"
                      >
                        <Icons.Edit size={14} className="me-2 text-ws-primary" /> Edit Details
                      </button>
                      
                      {/* Change Role Section */}
                      <div className="dropdown-divider border-light"></div>
                      <div className="px-3 py-1 text-muted fs-9 fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Change Role</div>
                      {emp.role !== 'Manager' && emp.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => { updateRoleMutation.mutate({ id: emp._id, role: 'Manager' }); setOpenDropdownId(null); }}
                          className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-dark hover-bg-light"
                        >
                          Promote to Manager
                        </button>
                      )}
                      {emp.role !== 'Team Lead' && emp.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => { updateRoleMutation.mutate({ id: emp._id, role: 'Team Lead' }); setOpenDropdownId(null); }}
                          className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-dark hover-bg-light"
                        >
                          Promote to Team Lead
                        </button>
                      )}
                      {emp.role !== 'Employee' && emp.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => { updateRoleMutation.mutate({ id: emp._id, role: 'Employee' }); setOpenDropdownId(null); }}
                          className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-dark hover-bg-light"
                        >
                          Demote to Employee
                        </button>
                      )}

                      {/* Account Status Section */}
                      {emp.role !== 'Admin' && (
                        <>
                          <div className="dropdown-divider border-light"></div>
                          <div className="px-3 py-1 text-muted fs-9 fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Account Status</div>
                          {emp.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => { updateStatusMutation.mutate({ id: emp._id, status: 'Suspended' }); setOpenDropdownId(null); }}
                              className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-danger hover-bg-danger-light"
                            >
                              Suspend Account
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { updateStatusMutation.mutate({ id: emp._id, status: 'Active' }); setOpenDropdownId(null); }}
                              className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-success hover-bg-success-light"
                            >
                              Activate Account
                            </button>
                          )}
                        </>
                      )}

                      {/* Password / Logs Section */}
                      <div className="dropdown-divider border-light"></div>
                      <button
                        type="button"
                        onClick={() => { 
                          setTargetEmployee(emp); 
                          resetPasswordMutation.mutate(emp._id); 
                          setOpenDropdownId(null); 
                        }}
                        className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-dark hover-bg-light"
                      >
                        <Icons.Alert size={14} className="me-2 text-warning" /> Reset Password
                      </button>
                      
                      <a
                        href={`/activity-logs?user=${encodeURIComponent(emp.name)}`}
                        onClick={() => setOpenDropdownId(null)}
                        className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-dark hover-bg-light text-decoration-none d-block"
                      >
                        <Icons.Menu size={14} className="me-2 text-info" /> View Activity
                      </a>

                      {emp.role !== 'Admin' && (
                        <>
                          <div className="dropdown-divider border-light"></div>
                          <button
                            type="button"
                            onClick={() => { handleDelete(emp._id); setOpenDropdownId(null); }}
                            className="dropdown-item px-3 py-1.5 fs-8 text-start w-100 border-0 bg-transparent text-danger hover-bg-danger-light"
                          >
                            <Icons.Trash size={14} className="me-2 text-danger" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </TableLayout>
      </div>

      {/* DRAWERS FOR CREATION / EDITING */}
      <Drawer
        isOpen={activeDrawer.type === 'EMPLOYEE_CREATE'}
        onClose={closeDrawer}
        title="Add New Employee"
      >
        <EmployeeForm
          departments={departments}
          employees={allEmployees}
          onSuccess={closeDrawer}
          onCancel={closeDrawer}
        />
      </Drawer>

      <Drawer
        isOpen={activeDrawer.type === 'EMPLOYEE_EDIT'}
        onClose={closeDrawer}
        title="Edit Employee Profile"
      >
        <EmployeeForm
          employee={activeDrawer.data}
          departments={departments}
          employees={allEmployees}
          onSuccess={closeDrawer}
          onCancel={closeDrawer}
        />
      </Drawer>

      {/* RESET PASSWORD CONFIRMATION MODAL */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => { setResetModalOpen(false); setTempPassword(''); }}
        title="Temporary Password Generated"
        size="md"
        footer={
          <Button onClick={() => { setResetModalOpen(false); setTempPassword(''); }}>
            Close Modal
          </Button>
        }
      >
        <div className="text-center py-2 animate-fadeIn">
          <p className="fs-7 text-muted mb-3.5">
            A temporary password has been successfully generated for <strong>{targetEmployee?.name}</strong>.
          </p>
          <div 
            className="bg-light p-3 rounded-3 border mb-3.5 font-monospace fs-5 fw-bold text-ws-primary select-all text-center"
            style={{ borderStyle: 'dashed', letterSpacing: '1px' }}
          >
            {tempPassword}
          </div>
          <div className="alert alert-warning py-2.5 px-3 fs-8 rounded-3 text-start border-0 bg-warning-light text-warning-dark d-flex gap-2">
            <Icons.Alert size={20} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Attention:</strong> Copy this plain temporary password now. For security purposes, this password is saved as a secure hash in the database and <strong>cannot be viewed again</strong>.
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Employees;
