import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUI } from '../context/UIContext.jsx';

// Design System
import Drawer from '../design-system/Drawer.jsx';
import Card from '../design-system/Card.jsx';
import Typography from '../design-system/Typography.jsx';
import Badge from '../design-system/Badge.jsx';
import Avatar from '../design-system/Avatar.jsx';
import Button from '../design-system/Button.jsx';
import Input from '../design-system/Input.jsx';
import Icons from '../design-system/Icons.jsx';
import PageLayout from '../layouts/PageLayout.jsx';

// APIs
import { getTasksApi, updateTaskStatusApi, getTaskByIdApi, addTaskCommentApi } from '../api/task.api.js';

export const Kanban = () => {
  const queryClient = useQueryClient();
  const { showToast } = useUI();

  // Kanban Board columns
  const COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];

  // Local state for active viewing task in drawer
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // 1. Fetch Tasks (All limit 500 for kanban view)
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: () => getTasksApi({ limit: 500 })
  });

  // 2. Fetch specific task for details view
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['task', activeTaskId],
    queryFn: () => getTaskByIdApi(activeTaskId),
    enabled: !!activeTaskId
  });

  // 3. Status Drag Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTaskStatusApi({ id, status }),
    onMutate: async ({ id, status }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['tasks', 'kanban'] });
      const previous = queryClient.getQueryData(['tasks', 'kanban']);
      
      queryClient.setQueryData(['tasks', 'kanban'], (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map(t => t._id === id ? { ...t, status } : t)
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks', 'kanban'], context.previous);
      }
      showToast(err.message, 'danger');
    },
    onSuccess: (data) => {
      showToast('Task status updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    }
  });

  // 4. Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ id, text }) => addTaskCommentApi({ id, text, author: 'System Admin' }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task', activeTaskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  // Drag and Drop Handlers
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.classList.add('kanban-card-dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('kanban-card-dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      updateStatusMutation.mutate({ id, status });
    }
  };

  const tasks = data?.tasks || [];
  const activeTask = detailData?.task;

  // Filter tasks per column
  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  const priorityBadgeVariant = (p) => {
    const map = { Low: 'secondary', Medium: 'info', High: 'warning', Urgent: 'danger' };
    return map[p] || 'secondary';
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ id: activeTaskId, text: commentText });
  };

  return (
    <>
      <PageLayout
        title="Kanban Board"
        description="Drag and drop task cards to balance workflow statuses."
        loading={isLoading}
      >
        <div className="row g-4 flex-nowrap overflow-auto pb-4">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column);
            
            return (
              <div
                key={column}
                className="col-12 col-md-3"
                style={{ minWidth: '280px', maxWidth: '350px' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column)}
              >
                <div className="kanban-column-container d-flex flex-column gap-3 h-100 border border-light">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
                    <Typography variant="h4" className="mb-0 text-dark fw-bold">
                      {column}
                    </Typography>
                    <Badge variant="pill">{columnTasks.length}</Badge>
                  </div>

                  <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-4 text-muted fs-8 border border-dashed rounded-3 bg-white p-3">
                        Drop tasks here
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task._id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setActiveTaskId(task._id)}
                        >
                          <Card hoverable className="p-3 border border-light bg-white cursor-grab">
                            <div className="d-flex align-items-start justify-content-between gap-2.5 mb-2">
                              <Typography variant="h5" className="fs-7 fw-semibold text-dark mb-0 text-truncate-2">
                                {task.title}
                              </Typography>
                            </div>
                            
                            <div className="d-flex flex-wrap gap-1 mb-3">
                              {task.labels?.map((lbl) => (
                                <Badge key={lbl} variant="primary" pill className="fs-9 py-0.5 px-1.5">
                                  {lbl}
                                </Badge>
                              ))}
                            </div>

                            <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light">
                              <div className="d-flex align-items-center gap-1 text-muted fs-8">
                                <Icons.Clock size={12} />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                              
                              <div className="d-flex align-items-center gap-2">
                                <Badge variant={priorityBadgeVariant(task.priority)} className="fs-9">
                                  {task.priority}
                                </Badge>
                                <Avatar src={task.assignee?.avatar} name={task.assignee?.name} size="xs" />
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageLayout>

      {/* DETAIL TASK EXPANSION DRAWER */}
      <Drawer
        isOpen={!!activeTaskId}
        onClose={() => setActiveTaskId(null)}
        title={activeTask ? `Task Details: ${activeTask.title.substring(0, 30)}...` : 'Loading Task Details...'}
        width="md"
      >
        {activeTaskId && detailLoading && (
          <div className="text-center py-5">
            <span className="spinner-border text-ws-primary" role="status"></span>
            <p className="text-muted mt-2 fs-7">Loading detailed audit...</p>
          </div>
        )}

        {activeTask && !detailLoading && (
          <div className="d-flex flex-column gap-4 animate-fadeIn">
            {/* Header Metadata */}
            <div className="d-flex flex-wrap gap-3 p-3 bg-light rounded-3">
              <div className="d-flex flex-column">
                <span className="text-muted fs-8">Status:</span>
                <Badge variant={activeTask.status === 'Done' ? 'success' : 'primary'} className="mt-1">
                  {activeTask.status}
                </Badge>
              </div>
              <div className="d-flex flex-column">
                <span className="text-muted fs-8">Priority:</span>
                <Badge variant={priorityBadgeVariant(activeTask.priority)} className="mt-1">
                  {activeTask.priority}
                </Badge>
              </div>
              <div className="d-flex flex-column">
                <span className="text-muted fs-8">Project:</span>
                <span className="fw-semibold text-dark fs-7 mt-1">{activeTask.project?.name}</span>
              </div>
              <div className="d-flex flex-column">
                <span className="text-muted fs-8">Assignee:</span>
                <div className="d-flex align-items-center gap-1.5 mt-1">
                  <Avatar src={activeTask.assignee?.avatar} name={activeTask.assignee?.name} size="xs" />
                  <span className="fw-semibold text-dark fs-8">{activeTask.assignee?.name}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Typography variant="h4" className="mb-2">Description</Typography>
              <p className="fs-7 text-dark bg-white border rounded-3 p-3 mb-0">
                {activeTask.description || 'No description provided.'}
              </p>
            </div>

            {/* Attachments (UI Only) */}
            {activeTask.attachments?.length > 0 && (
              <div>
                <Typography variant="h4" className="mb-2">Attachments ({activeTask.attachments.length})</Typography>
                <div className="d-flex flex-column gap-2">
                  {activeTask.attachments.map(att => (
                    <div key={att.name} className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border">
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <Icons.Documents className="text-ws-primary flex-shrink-0" size={16} />
                        <span className="fs-8 text-dark text-truncate fw-medium">{att.name}</span>
                      </div>
                      <Icons.Download className="text-muted flex-shrink-0 cursor-pointer" size={14} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussions / Comments */}
            <div className="border-top pt-4">
              <Typography variant="h4" className="mb-3">Discussion / Comments ({activeTask.comments?.length || 0})</Typography>
              
              <div className="d-flex flex-column gap-3 mb-4 max-h-60 overflow-auto">
                {activeTask.comments?.length === 0 ? (
                  <span className="text-muted fs-8">No comments on this task yet. Start the conversation.</span>
                ) : (
                  activeTask.comments.map((c, i) => (
                    <div key={i} className="p-3 bg-light rounded-3">
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="fw-bold text-dark fs-8">{c.author}</span>
                        <span className="text-muted fs-9">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="fs-8 text-muted mb-0">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleCommentSubmit} className="d-flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or post an update..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="form-control rounded-3 py-2 px-3 fs-7 border-ws-border"
                />
                <Button type="submit" size="sm" loading={addCommentMutation.isPending}>
                  Comment
                </Button>
              </form>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default Kanban;
