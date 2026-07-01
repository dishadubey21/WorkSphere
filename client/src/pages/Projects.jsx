import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { useUI } from '../context/UIContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Design System
import Drawer from '../design-system/Drawer.jsx';
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
import { getProjectsApi, createProjectApi, updateProjectApi, deleteProjectApi } from '../api/project.api.js';
import { getEmployeesApi } from '../api/employee.api.js';

// Project Form Component inside Projects.jsx
const ProjectForm = ({ project, employees = [], onSuccess, onCancel }) => {
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: project ? {
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      members: project.members?.map(m => m._id) || [],
      milestones: project.milestones?.map(m => ({
        title: m.title,
        dueDate: new Date(m.dueDate).toISOString().split('T')[0],
        completed: m.completed
      })) || []
    } : {
      name: '',
      description: '',
      status: 'Planning',
      priority: 'Medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days out
      members: [],
      milestones: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones'
  });

  const queryClient = useQueryClient();
  const { showToast } = useUI();

  const mutation = useMutation({
    mutationFn: (data) => {
      if (project) {
        return updateProjectApi({ id: project._id, ...data });
      }
      return createProjectApi(data);
    },
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
      <Input
        label="Project Name"
        name="name"
        required
        error={errors.name?.message}
        {...register('name', { required: 'Project name is required' })}
      />
      <Input
        label="Description"
        name="description"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="row">
        <div className="col-6">
          <Select
            label="Priority"
            name="priority"
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' }
            ]}
            {...register('priority')}
          />
        </div>
        <div className="col-6">
          <Select
            label="Status"
            name="status"
            options={[
              { value: 'Planning', label: 'Planning' },
              { value: 'Active', label: 'Active' },
              { value: 'On Hold', label: 'On Hold' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Archived', label: 'Archived' }
            ]}
            {...register('status')}
          />
        </div>
      </div>
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

      <div>
        <label className="form-label font-heading fw-medium text-dark fs-7 mb-2">Team Members</label>
        <div className="p-3 border border-light rounded-3 bg-light d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {employees.map(emp => (
            <div key={emp._id} className="form-check d-flex align-items-center gap-2">
              <input
                type="checkbox"
                value={emp._id}
                id={`member-${emp._id}`}
                className="form-check-input mt-0"
                {...register('members')}
              />
              <label htmlFor={`member-${emp._id}`} className="form-check-label fs-7 fw-medium text-dark m-0 d-flex align-items-center gap-2">
                <Avatar src={emp.avatar} name={emp.name} size="xs" /> {emp.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="form-label font-heading fw-medium text-dark fs-7 mb-0">Project Milestones</label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => append({ title: '', dueDate: new Date().toISOString().split('T')[0], completed: false })}
          >
            Add Milestone
          </Button>
        </div>
        <div className="d-flex flex-column gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="row g-2 align-items-center bg-light p-2.5 rounded-3 border border-light">
              <div className="col-12 col-md-5">
                <input
                  type="text"
                  placeholder="Milestone title"
                  className="form-control rounded-2 py-1 px-2 fs-7 border-ws-border"
                  {...register(`milestones.${index}.title`, { required: 'Title is required' })}
                />
              </div>
              <div className="col-12 col-md-4">
                <input
                  type="date"
                  className="form-control rounded-2 py-1 px-2 fs-7 border-ws-border"
                  {...register(`milestones.${index}.dueDate`, { required: 'Due date is required' })}
                />
              </div>
              <div className="col-12 col-md-2 d-flex align-items-center justify-content-center">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id={`milestone-complete-${index}`}
                    className="form-check-input mt-0"
                    {...register(`milestones.${index}.completed`)}
                  />
                  <label htmlFor={`milestone-complete-${index}`} className="form-check-label fs-8 text-muted m-0 ms-1">Done</label>
                </div>
              </div>
              <div className="col-12 col-md-1 text-end">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="btn btn-link text-danger p-0 border-0 bg-transparent"
                >
                  <Icons.Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-end mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {project ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export const Projects = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeDrawer, openDrawer, closeDrawer, showToast } = useUI();

  const canManageProjects = user?.role === 'Admin' || user?.role === 'Manager';

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  // 1. Fetch Projects
  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, status, priority, page }],
    queryFn: () => getProjectsApi({ search, status, priority, page, limit: 6 }),
    keepPreviousData: true
  });

  // 2. Fetch Employees (for dropdown members select)
  const { data: empData } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: () => getEmployeesApi({ limit: 1000 })
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProjectApi(id),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project? This will also remove all nested tasks.')) {
      deleteMutation.mutate(id);
    }
  };

  const projects = data?.projects || [];
  const pagination = data?.pagination;
  const employees = empData?.employees || [];

  const statusBadgeColor = (status) => {
    const map = {
      Planning: 'secondary',
      Active: 'primary',
      'On Hold': 'warning',
      Completed: 'success',
      Archived: 'dark'
    };
    return map[status] || 'secondary';
  };

  const priorityBadgeColor = (prio) => {
    const map = {
      Low: 'light',
      Medium: 'info',
      High: 'danger'
    };
    return map[prio] || 'secondary';
  };

  const filterElements = (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '350px' }}>
        <div className="position-relative w-100">
          <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
            <Icons.Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-control rounded-pill border-ws-border ps-5 py-2 fs-7"
          />
        </div>
      </div>
      <div className="d-flex flex-wrap gap-2.5">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="form-select rounded-3 border-ws-border fs-7 py-2 px-3"
        >
          <option value="">All Statuses</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="form-select rounded-3 border-ws-border fs-7 py-2 px-3"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        {canManageProjects && (
          <Button onClick={() => openDrawer('PROJECT_CREATE')} icon={<Icons.Plus size={16} />}>
            Add Project
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <PageLayout
        title="Projects"
        description="Organize timelines, deliverables, progress parameters, and team members."
        loading={isLoading}
        isEmpty={projects.length === 0}
        emptyIllustration="projects"
        emptyTitle="No Projects Found"
        emptyDescription="Get started by sketching your first project roadmap timeline."
        emptyActionLabel={canManageProjects ? "Add Project" : ""}
        onEmptyAction={canManageProjects ? () => openDrawer('PROJECT_CREATE') : undefined}
        actions={
          canManageProjects ? (
            <Button onClick={() => openDrawer('PROJECT_CREATE')} icon={<Icons.Plus size={16} />}>
              Add Project
            </Button>
          ) : null
        }
      >
        {/* Filters */}
        <div className="mb-4">{filterElements}</div>

        <div className="row g-4 animate-fadeIn">
          {projects.map((p) => (
            <div key={p._id} className="col-12 col-md-6 col-lg-4">
              <Card className="h-100 border border-light flex-column d-flex justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex gap-2">
                      <Badge variant={statusBadgeColor(p.status)}>{p.status}</Badge>
                      <Badge variant={priorityBadgeColor(p.priority)}>{p.priority} Priority</Badge>
                    </div>
                    {canManageProjects && (
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          onClick={() => openDrawer('PROJECT_EDIT', p)}
                          className="btn btn-link text-ws-primary p-1 border-0 bg-transparent rounded-2"
                          title="Edit Project"
                        >
                          <Icons.Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id)}
                          className="btn btn-link text-ws-danger p-1 border-0 bg-transparent rounded-2"
                          title="Delete Project"
                        >
                          <Icons.Trash size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <Typography variant="h3" className="mb-2 text-dark">{p.name}</Typography>
                  <Typography variant="body2" className="text-muted mb-4">{p.description || 'No description provided.'}</Typography>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-1.5 fs-8">
                      <span className="text-muted font-heading fw-medium">Completion Progress</span>
                      <span className="fw-bold text-dark">{p.progress}%</span>
                    </div>
                    <div className="progress rounded-pill bg-light" style={{ height: '8px' }}>
                      <div
                        className="progress-bar rounded-pill bg-ws-primary"
                        role="progressbar"
                        style={{ width: `${p.progress}%` }}
                        aria-valuenow={p.progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-top border-light pt-3 mt-2 d-flex align-items-center justify-content-between">
                  <div className="d-flex flex-column">
                    <span className="text-muted fs-8 mb-0.5">Timeline:</span>
                    <span className="text-dark fw-semibold fs-8">
                      {new Date(p.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(p.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>
                  
                  {/* Avatars of members */}
                  <div className="d-flex align-items-center">
                    {p.members?.slice(0, 4).map((m, idx) => (
                      <div key={m._id} style={{ marginLeft: idx > 0 ? '-8px' : '0px', zIndex: 5 - idx }}>
                        <Avatar src={m.avatar} name={m.name} size="xs" className="border border-2 border-white" />
                      </div>
                    ))}
                    {p.members?.length > 4 && (
                      <div className="bg-ws-primary-light text-ws-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-9 border border-2 border-white ms-n2" style={{ width: '22px', height: '22px', marginLeft: '-8px', zIndex: 0 }}>
                        +{p.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Pagination Row */}
        {pagination && pagination.pages > 1 && (
          <div className="d-flex align-items-center justify-content-between mt-4 border-top pt-3">
            <Typography variant="body2" className="text-muted">
              Showing Page <span className="fw-semibold text-dark">{pagination.page}</span> of <span className="fw-semibold text-dark">{pagination.pages}</span>
            </Typography>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
                icon={<Icons.ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage(pagination.page + 1)}
                icon={<Icons.ChevronRight size={14} />}
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </PageLayout>

      {/* DRAWERS FOR CREATE / EDIT */}
      <Drawer
        isOpen={activeDrawer.type === 'PROJECT_CREATE'}
        onClose={closeDrawer}
        title="Add New Project"
        width="md"
      >
        <ProjectForm
          employees={employees}
          onSuccess={closeDrawer}
          onCancel={closeDrawer}
        />
      </Drawer>

      <Drawer
        isOpen={activeDrawer.type === 'PROJECT_EDIT'}
        onClose={closeDrawer}
        title="Edit Project Details"
        width="md"
      >
        <ProjectForm
          project={activeDrawer.data}
          employees={employees}
          onSuccess={closeDrawer}
          onCancel={closeDrawer}
        />
      </Drawer>
    </>
  );
};

export default Projects;
