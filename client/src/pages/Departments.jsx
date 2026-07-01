import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext.jsx';

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

// APIs
import { getDepartmentsApi, getDepartmentByIdApi, createDepartmentApi, updateDepartmentApi, deleteDepartmentApi } from '../api/department.api.js';
import { getEmployeesApi } from '../api/employee.api.js';

export const DepartmentForm = ({ department, employees = [], onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: department ? {
      name: department.name,
      code: department.code,
      description: department.description || '',
      head: department.head?._id || '',
      budget: department.budget || 0
    } : {
      name: '',
      code: '',
      description: '',
      head: '',
      budget: 0
    }
  });

  useEffect(() => {
    if (department) {
      reset({
        name: department.name,
        code: department.code,
        description: department.description || '',
        head: department.head?._id || department.head || '',
        budget: department.budget || 0
      });
    } else {
      reset({
        name: '',
        code: '',
        description: '',
        head: '',
        budget: 0
      });
    }
  }, [department, reset]);

  const queryClient = useQueryClient();
  const { showToast } = useUI();

  const mutation = useMutation({
    mutationFn: (data) => {
      if (department) {
        return updateDepartmentApi({ id: department._id, ...data });
      }
      return createDepartmentApi(data);
    },
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      reset();
      onSuccess();
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const onSubmit = (data) => {
    if (!data.head) delete data.head;
    mutation.mutate(data);
  };

  const headOptions = employees.map(e => ({ value: e._id, label: `${e.name} (${e.designation})` }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
      <Input
        label="Department Name"
        name="name"
        required
        error={errors.name?.message}
        {...register('name', { required: 'Department Name is required' })}
      />
      <Input
        label="Department Code (e.g. ENG, HR)"
        name="code"
        required
        error={errors.code?.message}
        {...register('code', { required: 'Code is required' })}
      />
      <Input
        label="Description"
        name="description"
        error={errors.description?.message}
        {...register('description')}
      />
      <Select
        label="Department Head"
        name="head"
        placeholder="Select Department Head"
        error={errors.head?.message}
        options={headOptions}
        {...register('head')}
      />
      <Input
        label="Budget ($)"
        name="budget"
        type="number"
        error={errors.budget?.message}
        {...register('budget', { valueAsNumber: true })}
      />
      <div className="d-flex gap-2 justify-content-end mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {department ? 'Save Changes' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
};
const DepartmentDetailsView = ({ departmentId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['department-details', departmentId],
    queryFn: () => getDepartmentByIdApi(departmentId),
    enabled: !!departmentId
  });

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <span className="spinner-border text-ws-primary" role="status"></span>
        <p className="text-muted mt-2 fs-8">Loading department directory...</p>
      </div>
    );
  }

  const deptDetails = data?.department;
  if (!deptDetails) {
    return <div className="text-center py-4 text-danger fs-8">Failed to load department details.</div>;
  }

  return (
    <div className="d-flex flex-column gap-3.5">
      <div className="bg-light p-3 rounded-3 border border-light">
        <div className="row g-3">
          <div className="col-6">
            <span className="text-muted fs-8 d-block mb-0.5">Budget Allocation</span>
            <span className="fw-bold text-dark fs-7">${deptDetails.budget?.toLocaleString() || 0}</span>
          </div>
          <div className="col-6">
            <span className="text-muted fs-8 d-block mb-0.5">Total Teams</span>
            <span className="fw-bold text-dark fs-7">{deptDetails.teamCount || 0} Teams</span>
          </div>
        </div>
        {deptDetails.description && (
          <div className="mt-3 pt-2.5 border-top border-light">
            <span className="text-muted fs-8 d-block mb-1">Description</span>
            <p className="fs-8 text-dark mb-0">{deptDetails.description}</p>
          </div>
        )}
      </div>

      <div>
        <h6 className="font-heading fw-bold fs-7 text-dark mb-2.5">Department HOD / Head</h6>
        {deptDetails.head ? (
          <div className="d-flex align-items-center gap-3 p-3 rounded-3 border border-light bg-light">
            <Avatar src={deptDetails.head.avatar} name={deptDetails.head.name} size="md" />
            <div>
              <div className="fw-bold text-dark fs-7">{deptDetails.head.name}</div>
              <div className="text-muted fs-8 mb-0.5">{deptDetails.head.designation}</div>
              <div className="text-muted fs-8">{deptDetails.head.email} {deptDetails.head.phone && `• ${deptDetails.head.phone}`}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-muted fs-8 border border-dashed rounded-3 bg-light">No Department Head assigned yet.</div>
        )}
      </div>

      <div>
        <h6 className="font-heading fw-bold fs-7 text-dark mb-2.5 d-flex align-items-center justify-content-between">
          <span>Assigned Staff ({deptDetails.employees?.length || 0})</span>
        </h6>
        {(!deptDetails.employees || deptDetails.employees.length === 0) ? (
          <div className="text-center py-4 text-muted fs-8 border border-dashed rounded-3">No staff members assigned to this department.</div>
        ) : (
          <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '250px' }}>
            {deptDetails.employees.map(emp => (
              <div key={emp._id} className="d-flex align-items-center justify-content-between p-2.5 rounded-3 border border-light hover-bg-light transition-all">
                <div className="d-flex align-items-center gap-2.5">
                  <Avatar src={emp.avatar} name={emp.name} size="sm" />
                  <div>
                    <div className="fw-bold text-dark fs-7">{emp.name}</div>
                    <div className="text-muted fs-8">{emp.designation}</div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-muted fs-8 d-block">Joined:</span>
                  <span className="fw-medium text-dark fs-8">
                    {new Date(emp.joiningDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Departments = () => {
  const queryClient = useQueryClient();
  const { activeModal, openModal, closeModal, showToast } = useUI();

  // 1. Fetch Departments
  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartmentsApi()
  });

  // 2. Fetch Employees (for dropdown)
  const { data: empData } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: () => getEmployeesApi({ limit: 1000 })
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDepartmentApi(id),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this department? This will reset the department for all assigned employees.')) {
      deleteMutation.mutate(id);
    }
  };

  const departments = data?.departments || [];
  const employees = empData?.employees || [];

  return (
    <>
      <PageLayout
        title="Departments"
        description="Configure organizational departments, budget allocations, and leadership structures."
        loading={isLoading}
        isEmpty={departments.length === 0}
        emptyIllustration="default"
        emptyTitle="No Departments Registered"
        emptyDescription="Get started by defining your organization's departmental groupings."
        emptyActionLabel="Add Department"
        onEmptyAction={() => openModal('DEPARTMENT_CREATE')}
        actions={
          <Button onClick={() => openModal('DEPARTMENT_CREATE')} icon={<Icons.Plus size={16} />}>
            Add Department
          </Button>
        }
      >
        <div className="row g-4 animate-fadeIn">
          {departments.map((dept) => (
            <div key={dept._id} className="col-12 col-md-6 col-lg-4">
              <Card 
                hoverable 
                className="h-100 border border-light flex-column d-flex justify-content-between cursor-pointer"
                onClick={(e) => {
                  if (!e.target.closest('button')) {
                    openModal('DEPARTMENT_DETAILS', dept);
                  }
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <Badge variant="secondary">{dept.code}</Badge>
                    <div className="d-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openModal('DEPARTMENT_EDIT', dept)}
                        className="btn btn-link text-ws-primary p-1 border-0 bg-transparent rounded-2"
                        title="Edit Department"
                      >
                        <Icons.Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dept._id)}
                        className="btn btn-link text-ws-danger p-1 border-0 bg-transparent rounded-2"
                        title="Delete Department"
                      >
                        <Icons.Trash size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <Typography variant="h3" className="mb-2 text-dark">{dept.name}</Typography>
                  <Typography variant="body2" className="text-muted mb-4">{dept.description || 'No description provided.'}</Typography>
                </div>

                <div className="border-top border-light pt-3 mt-2 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    {dept.head ? (
                      <>
                        <Avatar src={dept.head.avatar} name={dept.head.name} size="xs" />
                        <div>
                          <p className="font-heading fw-semibold text-dark fs-8 mb-0">{dept.head.name}</p>
                          <p className="font-body text-muted fs-9 mb-0">Head of Dept</p>
                        </div>
                      </>
                    ) : (
                      <span className="text-muted fs-8">No Department Head</span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openModal('DEPARTMENT_DETAILS', dept)}
                    >
                      Details
                    </Button>
                    <span className="badge bg-ws-primary-light text-ws-primary fw-bold fs-8 rounded-2 px-2.5 py-1.5">
                      {dept.employeeCount} Staff
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </PageLayout>

      {/* MODALS FOR CREATE / EDIT */}
      <Modal
        isOpen={activeModal.type === 'DEPARTMENT_CREATE'}
        onClose={closeModal}
        title="Create New Department"
      >
        <DepartmentForm
          employees={employees}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={activeModal.type === 'DEPARTMENT_EDIT'}
        onClose={closeModal}
        title="Edit Department Details"
      >
        <DepartmentForm
          department={activeModal.data}
          employees={employees}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={activeModal.type === 'DEPARTMENT_DETAILS'}
        onClose={closeModal}
        title={activeModal.data ? `Department details: ${activeModal.data.name}` : 'Department details'}
        size="lg"
      >
        {activeModal.data && (
          <DepartmentDetailsView
            departmentId={activeModal.data._id}
            onClose={closeModal}
          />
        )}
      </Modal>
    </>
  );
};

export default Departments;
