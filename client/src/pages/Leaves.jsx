import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Design System
import Modal from '../design-system/Modal.jsx';
import Button from '../design-system/Button.jsx';
import Input from '../design-system/Input.jsx';
import Select from '../design-system/Select.jsx';
import Card from '../design-system/Card.jsx';
import Typography from '../design-system/Typography.jsx';
import Badge from '../design-system/Badge.jsx';
import Avatar from '../design-system/Avatar.jsx';
import Icons from '../design-system/Icons.jsx';
import PageLayout from '../layouts/PageLayout.jsx';
import TableLayout from '../layouts/TableLayout.jsx';

// APIs
import { getLeavesApi, createLeaveApi, updateLeaveStatusApi, getLeaveSummaryApi } from '../api/leave.api.js';
import { getEmployeesApi } from '../api/employee.api.js';

const LeaveForm = ({ employees = [], onSuccess, onCancel }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      employee: isAdmin ? '' : user?._id,
      type: 'Annual',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days out
      reason: ''
    }
  });

  const queryClient = useQueryClient();
  const { showToast } = useUI();

  const mutation = useMutation({
    mutationFn: (data) => createLeaveApi(data),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      reset();
      onSuccess();
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const employeeOptions = employees.map(e => ({ value: e._id, label: `${e.name} (${e.designation})` }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
      {isAdmin ? (
        <Select
          label="Applying Employee"
          name="employee"
          placeholder="Select Employee"
          required
          error={errors.employee?.message}
          options={employeeOptions}
          {...register('employee', { required: 'Employee is required' })}
        />
      ) : (
        <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border border-light mb-1">
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div>
            <span className="fw-semibold text-dark fs-7 d-block">{user?.name}</span>
            <span className="text-muted fs-8 d-block">Applying as Employee (Self)</span>
          </div>
        </div>
      )}
      <Select
        label="Leave Type"
        name="type"
        options={[
          { value: 'Annual', label: 'Annual Vacation' },
          { value: 'Sick', label: 'Sick Leave' },
          { value: 'Maternity/Paternity', label: 'Maternity/Paternity' },
          { value: 'Unpaid', label: 'Unpaid Leave' }
        ]}
        {...register('type')}
      />
      <div className="row">
        <div className="col-6">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            required
            error={errors.startDate?.message}
            {...register('startDate', { required: 'Start date is required' })}
          />
        </div>
        <div className="col-6">
          <Input
            label="End Date"
            name="endDate"
            type="date"
            required
            error={errors.endDate?.message}
            {...register('endDate', { required: 'End date is required' })}
          />
        </div>
      </div>
      <Input
        label="Reason for Time Off"
        name="reason"
        required
        error={errors.reason?.message}
        {...register('reason', { required: 'Reason is required' })}
      />

      <div className="d-flex gap-2 justify-content-end mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          Apply Leave
        </Button>
      </div>
    </form>
  );
};

export const Leaves = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeModal, openModal, closeModal, showToast } = useUI();
  const [activeEmployeeFilter, setActiveEmployeeFilter] = useState('');
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const canApproveLeaves = isAdmin || isManager;
  
  // If not Admin/Manager, they only view their own leaves
  const targetEmployeeId = canApproveLeaves ? activeEmployeeFilter : user?._id;
  const targetSummaryEmployeeId = activeEmployeeFilter || user?._id;

  // 1. Fetch Leaves list
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', { employee: targetEmployeeId }],
    queryFn: () => getLeavesApi({ employee: targetEmployeeId })
  });

  // 2. Fetch Employees (for dropdown form & filter)
  const { data: empData } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: () => getEmployeesApi({ limit: 1000 }),
    enabled: canApproveLeaves // Only fetch employee list for admins or managers
  });

  // 3. Fetch Leave Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['leave-summary', targetSummaryEmployeeId],
    queryFn: () => getLeaveSummaryApi(targetSummaryEmployeeId),
    enabled: !!targetSummaryEmployeeId
  });

  // 4. Update Status Mutation (Approved / Rejected)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateLeaveStatusApi({ id, status, approvedBy: user?._id }),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const leaves = leavesData?.leaves || [];
  const employees = empData?.employees || [];
  const summary = summaryData?.summary || {
    allocations: { Annual: 25, Sick: 15, 'Maternity/Paternity': 90, Unpaid: 0 },
    taken: { Annual: 0, Sick: 0, 'Maternity/Paternity': 0, Unpaid: 0 },
    remaining: { Annual: 25, Sick: 15, 'Maternity/Paternity': 90, Unpaid: 0 }
  };

  const statusBadgeColor = (status) => {
    const map = { Pending: 'warning', Approved: 'success', Rejected: 'danger' };
    return map[status] || 'secondary';
  };

  const calculateDays = (start, end) => {
    const ms = new Date(end) - new Date(start);
    return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  };

  const filteredLeaves = leaves.filter(leave => {
    const empName = leave.employee?.name || '';
    const reason = leave.reason || '';
    const type = leave.type || '';
    const q = search.toLowerCase();
    return empName.toLowerCase().includes(q) ||
           reason.toLowerCase().includes(q) ||
           type.toLowerCase().includes(q);
  });

  const headers = [
    'Employee',
    'Leave Type',
    'Date Range',
    'Duration',
    'Reason',
    'Status',
    'Approver',
    'Actions'
  ];

  const filterElements = (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
        <div className="position-relative w-100">
          <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
            <Icons.Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search leaves by employee or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control rounded-pill border-ws-border ps-5 py-2 fs-7"
          />
        </div>
      </div>
      <div className="d-flex flex-wrap gap-2.5">
        {canApproveLeaves && (
          <select
            value={activeEmployeeFilter}
            onChange={(e) => setActiveEmployeeFilter(e.target.value)}
            className="form-select rounded-3 border-ws-border fs-7 py-2"
            style={{ width: '220px' }}
          >
            <option value="">Show All Employees Summary</option>
            {employees.map(e => (
              <option key={e._id} value={e._id}>{e.name} ({e.designation})</option>
            ))}
          </select>
        )}
        {user?.role !== 'Admin' && (
          <Button onClick={() => openModal('LEAVE_APPLY')} icon={<Icons.Plus size={16} />}>
            Apply Leave
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="d-flex flex-column gap-4 animate-fadeIn">
        <div className="d-flex align-items-center justify-content-between border-bottom pb-3">
          <div>
            <Typography variant="h2">Leave Management</Typography>
            <Typography variant="body1">Request leave times, monitor quotas, and approve requests.</Typography>
          </div>
        </div>

        {/* Balance cards */}
        {!summaryLoading && (
          <div className="row g-4">
            <div className="col-12 col-md-3">
              <Card className="border border-light">
                <Typography variant="body2" className="text-muted fw-semibold">Annual Vacation</Typography>
                <h3 className="fw-bold fs-2 text-ws-primary mt-2 mb-1">{summary.remaining?.Annual || 0} Days</h3>
                <span className="text-muted fs-8">Remaining from {summary.allocations?.Annual || 0} days</span>
              </Card>
            </div>
            <div className="col-12 col-md-3">
              <Card className="border border-light">
                <Typography variant="body2" className="text-muted fw-semibold">Sick Leave</Typography>
                <h3 className="fw-bold fs-2 text-ws-secondary mt-2 mb-1">{summary.remaining?.Sick || 0} Days</h3>
                <span className="text-muted fs-8">Remaining from {summary.allocations?.Sick || 0} days</span>
              </Card>
            </div>
            <div className="col-12 col-md-3">
              <Card className="border border-light">
                <Typography variant="body2" className="text-muted fw-semibold">Maternity/Paternity</Typography>
                <h3 className="fw-bold fs-2 text-ws-accent-dark mt-2 mb-1">{summary.remaining?.['Maternity/Paternity'] || 0} Days</h3>
                <span className="text-muted fs-8">Remaining from {summary.allocations?.['Maternity/Paternity'] || 0} days</span>
              </Card>
            </div>
            <div className="col-12 col-md-3">
              <Card className="border border-light">
                <Typography variant="body2" className="text-muted fw-semibold">Unpaid Taken</Typography>
                <h3 className="fw-bold fs-2 text-muted mt-2 mb-1">{summary.taken?.Unpaid || 0} Days</h3>
                <span className="text-muted fs-8">Accumulated total time off</span>
              </Card>
            </div>
          </div>
        )}

        <TableLayout
          headers={headers}
          loading={leavesLoading}
          isEmpty={filteredLeaves.length === 0}
          emptyIllustration="default"
          emptyTitle="No Leave Requests"
          emptyActionLabel={user?.role !== 'Admin' ? "Apply Leave" : ""}
          onEmptyAction={user?.role !== 'Admin' ? () => openModal('LEAVE_APPLY') : undefined}
          filters={filterElements}
        >
          {filteredLeaves.map((leave) => (
            <tr key={leave._id}>
              <td>
                <div className="d-flex align-items-center gap-3">
                  <Avatar src={leave.employee?.avatar} name={leave.employee?.name} size="xs" />
                  <span className="fw-semibold text-dark fs-7">{leave.employee?.name || 'Employee'}</span>
                </div>
              </td>
              <td className="text-muted fs-7">{leave.type}</td>
              <td className="text-muted fs-7">
                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
              </td>
              <td className="text-dark fw-medium fs-7">
                {calculateDays(leave.startDate, leave.endDate)} Days
              </td>
              <td className="text-muted fs-7 max-w-sm text-truncate" title={leave.reason}>
                {leave.reason}
              </td>
              <td>
                <Badge variant={statusBadgeColor(leave.status)}>{leave.status}</Badge>
              </td>
              <td className="text-muted fs-7">
                {leave.approvedBy ? leave.approvedBy.name : '—'}
              </td>
              <td>
                {leave.status === 'Pending' ? (
                  canApproveLeaves && leave.employee?._id?.toString() !== user?._id?.toString() ? (
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => updateStatusMutation.mutate({ id: leave._id, status: 'Approved' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => updateStatusMutation.mutate({ id: leave._id, status: 'Rejected' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-warning fs-8 fw-semibold">Pending Review</span>
                  )
                ) : (
                  <span className="text-muted fs-8">Finalized</span>
                )}
              </td>
            </tr>
          ))}
        </TableLayout>
      </div>

      {/* MODALS */}
      <Modal
        isOpen={activeModal.type === 'LEAVE_APPLY'}
        onClose={closeModal}
        title="Apply for Leave"
      >
        <LeaveForm
          employees={employees}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>
    </>
  );
};

export default Leaves;
