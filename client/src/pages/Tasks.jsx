import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useUI } from '../context/UIContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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
// APIs
import { getTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../api/task.api.js';
import { getEmployeesApi } from '../api/employee.api.js';
import { getProjectsApi } from '../api/project.api.js';

// Task Form inside Tasks.jsx
export const TaskForm = ({ task, employees = [], projects = [], onSuccess, onCancel }) => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'Employee';

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: task ? {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignee: task.assignee?._id || '',
      project: task.project?._id || '',
      labels: task.labels?.join(', ') || ''
    } : {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Todo',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days out
      assignee: '',
      project: '',
      labels: ''
    }
  });

  const queryClient = useQueryClient();
  const { showToast } = useUI();

  const mutation = useMutation({
    mutationFn: (data) => {
      if (task) {
        return updateTaskApi({ id: task._id, ...data });
      }
      return createTaskApi(data);
    },
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
    // Convert comma-separated labels into array
    if (data.labels) {
      data.labels = data.labels.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else {
      data.labels = [];
    }
    mutation.mutate(data);
  };

  const assigneeOptions = employees.map(e => ({ value: e._id, label: `${e.name} (${e.designation})` }));
  const projectOptions = projects.map(p => ({ value: p._id, label: p.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
      <Input
        label="Task Title"
        name="title"
        required
        disabled={isEmployee}
        error={errors.title?.message}
        {...register('title', { required: 'Task Title is required' })}
      />
      <Input
        label="Description"
        name="description"
        disabled={isEmployee}
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="row">
        <div className="col-6">
          <Select
            label="Priority"
            name="priority"
            disabled={isEmployee}
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Urgent', label: 'Urgent' }
            ]}
            {...register('priority')}
          />
        </div>
        <div className="col-6">
          <Select
            label="Status"
            name="status"
            options={[
              { value: 'Todo', label: 'Todo' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Review', label: 'Review' },
              { value: 'Done', label: 'Done' }
            ]}
            {...register('status')}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <Select
            label="Project"
            name="project"
            placeholder="Select Project"
            required
            disabled={isEmployee}
            error={errors.project?.message}
            options={projectOptions}
            {...register('project', { required: 'Project is required' })}
          />
        </div>
        <div className="col-6">
          <Select
            label="Assignee"
            name="assignee"
            placeholder="Select Assignee"
            required
            disabled={isEmployee}
            error={errors.assignee?.message}
            options={assigneeOptions}
            {...register('assignee', { required: 'Assignee is required' })}
          />
        </div>
      </div>
      <Input
        label="Due Date"
        name="dueDate"
        type="date"
        required
        disabled={isEmployee}
        error={errors.dueDate?.message}
        {...register('dueDate', { required: 'Due date is required' })}
      />
      <Input
        label="Labels (comma separated)"
        name="labels"
        placeholder="Design, Auth, Bug"
        disabled={isEmployee}
        error={errors.labels?.message}
        {...register('labels')}
      />

      <div className="d-flex gap-2 justify-content-end mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {isEmployee ? 'Update Status' : (task ? 'Save Changes' : 'Create Task')}
        </Button>
      </div>
    </form>
  );
};

export const Tasks = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeDrawer, openDrawer, closeDrawer, showToast } = useUI();

  const isEmployee = user?.role === 'Employee';
  const targetAssigneeId = isEmployee ? user?._id : '';

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [project, setProject] = useState('');
  const [page, setPage] = useState(1);

  // 1. Fetch Tasks
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { search, priority, status, project, page, assignee: targetAssigneeId }],
    queryFn: () => getTasksApi({ search, priority, status, project, page, limit: 10, assignee: targetAssigneeId }),
    keepPreviousData: true
  });

  // 2. Fetch Employees (for form selection)
  const { data: empData } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: () => getEmployeesApi({ limit: 1000 })
  });

  // 3. Fetch Projects (for filter & form selection)
  const { data: projData } = useQuery({
    queryKey: ['projects-all-list'],
    queryFn: () => getProjectsApi({ limit: 1000 })
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTaskApi(id),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  const tasks = data?.tasks || [];
  const pagination = data?.pagination;
  const employees = empData?.employees || [];
  const projects = projData?.projects || [];

  const priorityBadgeVariant = (p) => {
    const map = { Low: 'secondary', Medium: 'info', High: 'warning', Urgent: 'danger' };
    return map[p] || 'secondary';
  };

  const statusBadgeVariant = (s) => {
    const map = { Todo: 'secondary', 'In Progress': 'primary', Review: 'warning', Done: 'success' };
    return map[s] || 'secondary';
  };

  const headers = [
    'Task Title',
    'Project',
    'Assignee',
    'Priority',
    'Status',
    'Due Date',
    'Actions'
  ];

  const filterElements = (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '300px' }}>
        <div className="position-relative w-100">
          <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
            <Icons.Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-control rounded-pill border-ws-border ps-5 py-2 fs-7"
          />
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <select
          value={project}
          onChange={(e) => { setProject(e.target.value); setPage(1); }}
          className="form-select rounded-3 border-ws-border fs-7 py-2 px-3"
          style={{ width: '150px' }}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="form-select rounded-3 border-ws-border fs-7 py-2 px-3"
          style={{ width: '130px' }}
        >
          <option value="">All Statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Review">Review</option>
          <option value="Done">Done</option>
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="form-select rounded-3 border-ws-border fs-7 py-2 px-3"
          style={{ width: '130px' }}
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
        {!isEmployee && (
          <Button onClick={() => openDrawer('TASK_CREATE')} icon={<Icons.Plus size={16} />}>
            Add Task
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
            <Typography variant="h2">{isEmployee ? 'My Tasks' : 'Tasks Dashboard'}</Typography>
            <Typography variant="body1">
              {isEmployee ? 'View and update progress of your assigned deliverables.' : 'Create, assign, filter, and track granular work items.'}
            </Typography>
          </div>
        </div>

        <TableLayout
          headers={headers}
          loading={isLoading}
          isEmpty={tasks.length === 0}
          emptyIllustration="tasks"
          emptyTitle="No Tasks Scheduled"
          emptyDescription={isEmployee ? "You do not have any tasks assigned currently." : "Start assigning deliverables by scheduling a new task."}
          emptyActionLabel={!isEmployee ? "Add Task" : ""}
          onEmptyAction={!isEmployee ? () => openDrawer('TASK_CREATE') : undefined}
          pagination={pagination}
          onPageChange={setPage}
          filters={filterElements}
        >
          {tasks.map((task) => (
            <tr key={task._id}>
              <td>
                <div className="fw-semibold text-dark fs-7">{task.title}</div>
                {task.labels?.map(lbl => (
                  <span key={lbl} className="badge bg-light text-secondary border border-light fs-9 me-1 px-1.5 py-0.5 rounded-1">
                    {lbl}
                  </span>
                ))}
              </td>
              <td>
                <span className="fs-7 text-dark fw-medium">{task.project?.name}</span>
              </td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <Avatar src={task.assignee?.avatar} name={task.assignee?.name} size="xs" />
                  <span className="fs-7 text-dark fw-medium">{task.assignee?.name}</span>
                </div>
              </td>
              <td>
                <Badge variant={priorityBadgeVariant(task.priority)}>{task.priority}</Badge>
              </td>
              <td>
                <Badge variant={statusBadgeVariant(task.status)}>{task.status}</Badge>
              </td>
              <td className="text-muted fs-7">
                {new Date(task.dueDate).toLocaleDateString()}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => openDrawer('TASK_EDIT', task)}
                    className="btn btn-link text-ws-primary p-1 border-0 bg-transparent rounded-2"
                    title={isEmployee ? "Update Status" : "Edit Task"}
                  >
                    <Icons.Edit size={16} />
                  </button>
                  {!isEmployee && (
                    <button
                      type="button"
                      onClick={() => handleDelete(task._id)}
                      className="btn btn-link text-ws-danger p-1 border-0 bg-transparent rounded-2"
                      title="Delete Task"
                    >
                      <Icons.Trash size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </TableLayout>
      </div>

      {/* DRAWERS FOR CREATE / EDIT */}
      <Drawer
        isOpen={activeDrawer.type === 'TASK_CREATE'}
        onClose={closeDrawer}
        title="Create New Task"
      >
        <TaskForm
          employees={employees}
          projects={projects}
          onSuccess={closeDrawer}
          onCancel={closeDrawer}
        />
      </Drawer>

      <Drawer
        isOpen={activeDrawer.type === 'TASK_EDIT'}
        onClose={closeDrawer}
        title="Edit Task Details"
      >
        <TaskForm
          task={activeDrawer.data}
          employees={employees}
          projects={projects}
          onSuccess={closeDrawer}
          onCancel={closeDrawer}
        />
      </Drawer>
    </>
  );
};

export default Tasks;
