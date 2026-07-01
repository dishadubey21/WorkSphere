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

// APIs
import { getAnnouncementsApi, createAnnouncementApi, deleteAnnouncementApi, updateAnnouncementApi } from '../api/announcement.api.js';
import { getEmployeesApi } from '../api/employee.api.js';

const AnnouncementForm = ({ announcement, employees = [], onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: announcement ? {
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      isPinned: announcement.isPinned || false
    } : {
      title: '',
      content: '',
      category: 'Company',
      isPinned: false
    }
  });

  const queryClient = useQueryClient();
  const { showToast } = useUI();

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        publishedBy: user?._id,
        createdBy: user?._id,
        publisherName: user?.name,
        publisherEmail: user?.email
      };
      if (announcement) {
        return updateAnnouncementApi({ id: announcement._id, ...payload });
      }
      return createAnnouncementApi(payload);
    },
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
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
        label="Announcement Title"
        name="title"
        required
        error={errors.title?.message}
        {...register('title', { required: 'Title is required' })}
      />
      <Select
        label="Category"
        name="category"
        options={[
          { value: 'Company', label: 'Company' },
          { value: 'HR', label: 'HR' },
          { value: 'Project', label: 'Project' },
          { value: 'Social', label: 'Social' }
        ]}
        {...register('category')}
      />
      <div className="mb-3">
        <label htmlFor="content-text" className="form-label font-heading fw-medium text-dark fs-7 mb-1">Content Notice</label>
        <textarea
          id="content-text"
          className={`form-control rounded-3 p-3 fs-7 ${errors.content ? 'is-invalid border-danger' : 'border-ws-border'}`}
          placeholder="Write the announcement detail content here..."
          rows={6}
          {...register('content', { required: 'Content description is required' })}
        />
        {errors.content && <div className="invalid-feedback fs-7 mt-1 fw-medium text-danger">{errors.content.message}</div>}
      </div>
      <div className="form-check mb-3">
        <input
          type="checkbox"
          id="isPinned"
          className="form-check-input"
          {...register('isPinned')}
        />
        <label htmlFor="isPinned" className="form-check-label fs-7 fw-medium text-dark">Pin this notice to top of feed</label>
      </div>

      <div className="d-flex gap-2 justify-content-end mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {announcement ? 'Save Changes' : 'Publish Announcement'}
        </Button>
      </div>
    </form>
  );
};

export const Announcements = () => {
  const queryClient = useQueryClient();
  const { activeModal, openModal, closeModal, showToast } = useUI();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  // 1. Fetch Announcements
  const { data, isLoading } = useQuery({
    queryKey: ['announcements', { category: selectedCategory, search }],
    queryFn: () => getAnnouncementsApi({ category: selectedCategory, search })
  });

  // 2. Fetch Employees (for dropdown)
  const { data: empData } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: () => getEmployeesApi({ limit: 1000 })
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAnnouncementApi(id),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id);
    }
  };

  const announcements = data?.announcements || [];
  const employees = empData?.employees || [];
  const pinnedAnnouncements = announcements.filter(a => a.isPinned);

  const categoryBadgeVariant = (cat) => {
    const map = { Company: 'primary', HR: 'secondary', Project: 'warning', Social: 'success' };
    return map[cat] || 'secondary';
  };

  return (
    <>
      <PageLayout
        title="Announcements"
        description="Publish general company updates, HR policies, and social updates."
        loading={isLoading}
        isEmpty={announcements.length === 0}
        emptyIllustration="notifications"
        emptyTitle="No Announcements Published"
        emptyDescription="Keep your workforce aligned by publishing your first company update."
        emptyActionLabel="Announce Update"
        onEmptyAction={() => openModal('ANNOUNCEMENT_CREATE')}
        actions={
          <Button onClick={() => openModal('ANNOUNCEMENT_CREATE')} icon={<Icons.Plus size={16} />}>
            Announce
          </Button>
        }
      >
        <div className="row g-4 animate-fadeIn">
          {/* Main Feed */}
          <div className="col-12 col-lg-8 d-flex flex-column gap-3.5">
            {/* Filter Bar */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 bg-white p-3 border border-light rounded-3 shadow-sm">
              <div className="position-relative flex-grow-1" style={{ maxWidth: '300px' }}>
                <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                  <Icons.Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control rounded-pill border-ws-border ps-5 py-2 fs-7"
                />
              </div>
              <div className="d-flex gap-2">
                {['', 'Company', 'HR', 'Project', 'Social'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fs-8 border-0 ${selectedCategory === cat ? 'bg-ws-primary text-white fw-bold' : 'bg-light text-muted'}`}
                  >
                    {cat || 'All Feed'}
                  </button>
                ))}
              </div>
            </div>

            {announcements.map((item) => (
              <Card key={item._id} className="border border-light">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <Badge variant={categoryBadgeVariant(item.category)}>{item.category}</Badge>
                    {item.isPinned && (
                      <span className="d-flex align-items-center gap-1.5 text-ws-accent-dark fs-8 fw-semibold">
                        <Icons.Bell size={12} /> Pinned Notice
                      </span>
                    )}
                  </div>
                  { (user?.role === 'Admin' || item.createdBy?._id === user?._id || item.createdBy === user?._id || item.publishedBy?._id === user?._id || item.publishedBy === user?._id) && (
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        onClick={() => openModal('ANNOUNCEMENT_EDIT', item)}
                        className="btn btn-link text-ws-primary p-1 border-0 bg-transparent rounded-2"
                        title="Edit Notice"
                      >
                        <Icons.Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="btn btn-link text-ws-danger p-1 border-0 bg-transparent rounded-2"
                        title="Delete Notice"
                      >
                        <Icons.Trash size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <Typography variant="h3" className="mb-2 text-dark">{item.title}</Typography>
                <p className="fs-7 text-muted mb-4 style-pre-line" style={{ whiteSpace: 'pre-line' }}>{item.content}</p>

                <div className="d-flex align-items-center justify-content-between pt-3 border-top border-light">
                  <div className="d-flex align-items-center gap-2">
                    <Avatar src={item.publishedBy?.avatar} name={item.publisherName || item.publishedBy?.name} size="xs" />
                    <div>
                      <span className="fw-semibold text-dark fs-8 block">{item.publisherName || item.publishedBy?.name || 'Publisher'}</span>
                      <span className="text-muted fs-9 block">{item.publishedBy?.designation || item.publishedBy?.role || 'Staff'}</span>
                    </div>
                  </div>
                  <span className="text-muted fs-8">
                    {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar widget for Pinned announcements */}
          <div className="col-12 col-lg-4">
            <Card className="border border-light">
              <Typography variant="h3" className="mb-3 border-bottom pb-2">Pinned Bulletin</Typography>
              {pinnedAnnouncements.length === 0 ? (
                <div className="text-center py-4 text-muted fs-8">No pinned notices currently active.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {pinnedAnnouncements.map((p) => (
                    <div key={p._id} className="p-3 bg-light rounded-3 border-start border-3 border-ws-accent">
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <Badge variant={categoryBadgeVariant(p.category)} className="fs-9">{p.category}</Badge>
                        <span className="text-muted fs-9">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Typography variant="h4" className="mb-1 text-dark fs-7 text-truncate">{p.title}</Typography>
                      <p className="fs-8 text-muted mb-0 text-truncate-2" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }}>
                        {p.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageLayout>

      {/* CREATE / EDIT ANNOUNCEMENT MODALS */}
      <Modal
        isOpen={activeModal.type === 'ANNOUNCEMENT_CREATE'}
        onClose={closeModal}
        title="Publish Announcement"
      >
        <AnnouncementForm
          employees={employees}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={activeModal.type === 'ANNOUNCEMENT_EDIT'}
        onClose={closeModal}
        title="Edit Announcement Details"
      >
        <AnnouncementForm
          announcement={activeModal.data}
          employees={employees}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>
    </>
  );
};

export default Announcements;
