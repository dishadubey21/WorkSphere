import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
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
import SearchableSelect from '../design-system/SearchableSelect.jsx';

// APIs
import { getTeamsApi, createTeamApi, updateTeamApi, deleteTeamApi, addTeamMemberApi, removeTeamMemberApi } from '../api/team.api.js';
import { getEmployeesApi } from '../api/employee.api.js';
import { getDepartmentsApi } from '../api/department.api.js';

export const TeamForm = ({ team, employees = [], departments = [], onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm({
    defaultValues: team ? {
      name: team.name,
      description: team.description || '',
      department: team.department?._id || '',
      lead: team.lead?._id || ''
    } : {
      name: '',
      description: '',
      department: '',
      lead: ''
    }
  });

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        description: team.description || '',
        department: team.department?._id || team.department || '',
        lead: team.lead?._id || team.lead || ''
      });
    } else {
      reset({
        name: '',
        description: '',
        department: '',
        lead: ''
      });
    }
  }, [team, reset]);

  const queryClient = useQueryClient();
  const { showToast } = useUI();

  const mutation = useMutation({
    mutationFn: (data) => {
      if (team) {
        return updateTeamApi({ id: team._id, ...data });
      }
      return createTeamApi(data);
    },
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
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

  const leadOptions = employees.map(e => ({ value: e._id, label: `${e.name} (${e.designation})` }));
  const deptOptions = departments.map(d => ({ value: d._id, label: `${d.name} (${d.code})` }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3">
      <Input
        label="Team Name"
        name="name"
        required
        error={errors.name?.message}
        {...register('name', { required: 'Team Name is required' })}
      />
      <Input
        label="Description"
        name="description"
        error={errors.description?.message}
        {...register('description')}
      />
      <Controller
        name="department"
        control={control}
        rules={{ required: 'Department is required' }}
        render={({ field, fieldState: { error } }) => (
          <SearchableSelect
            label="Department"
            name="department"
            required
            options={departments.map(d => ({
              value: d._id,
              label: d.name,
              subtitle: d.code
            }))}
            value={field.value}
            onChange={field.onChange}
            error={error?.message}
            placeholder="Select Department"
          />
        )}
      />

      <Controller
        name="lead"
        control={control}
        rules={{ required: 'Team Lead is required' }}
        render={({ field, fieldState: { error } }) => (
          <SearchableSelect
            label="Team Lead"
            name="lead"
            required
            options={employees.map(e => ({
              value: e._id,
              label: e.name,
              avatar: e.avatar,
              subtitle: `${e.designation} • ${e.email}`
            }))}
            value={field.value}
            onChange={field.onChange}
            error={error?.message}
            placeholder="Select Team Lead"
          />
        )}
      />
      <div className="d-flex gap-2 justify-content-end mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>
          {team ? 'Save Changes' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
};

// Member management form inside Modal
const MemberManager = ({ teamId, teams = [], employees = [], onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useUI();

  // Dynamically find team from list to react to list updates
  const team = teams.find(t => t._id === teamId) || {};

  // Add Member Mutation
  const addMutation = useMutation({
    mutationFn: (employeeId) => addTeamMemberApi({ id: teamId, employeeId }),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  // Remove Member Mutation
  const removeMutation = useMutation({
    mutationFn: (employeeId) => removeTeamMemberApi({ id: teamId, employeeId }),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  // Available employees to add (not currently in team.members)
  const memberIds = team.members?.map(m => m._id) || [];
  const nonMembers = employees.filter(e => !memberIds.includes(e._id));

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <Typography variant="h4" className="mb-2">Team Members ({team.members?.length || 0})</Typography>
        <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '180px' }}>
          {!team.members || team.members.length === 0 ? (
            <span className="text-muted fs-8">No members in this team.</span>
          ) : (
            team.members.map((member) => (
              <div key={member._id} className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light">
                <div className="d-flex align-items-center gap-2">
                  <Avatar src={member.avatar} name={member.name} size="xs" />
                  <span className="fw-semibold text-dark fs-7">{member.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(member._id)}
                  className="btn btn-link text-danger p-0 border-0 bg-transparent"
                  title="Remove Member"
                  disabled={removeMutation.isPending}
                >
                  <Icons.Close size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-top pt-3">
        <Typography variant="h4" className="mb-2">Add Team Member</Typography>
        {nonMembers.length === 0 ? (
          <span className="text-muted fs-8">All employees are already in this team.</span>
        ) : (
          <SearchableSelect
            name="add-member"
            options={nonMembers.map(e => ({
              value: e._id,
              label: e.name,
              avatar: e.avatar,
              subtitle: `${e.designation} • ${e.email}`
            }))}
            value=""
            onChange={(val) => {
              if (val) {
                addMutation.mutate(val);
              }
            }}
            placeholder="Search Employee to Add..."
          />
        )}
      </div>
    </div>
  );
};

export const Teams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activeModal, openModal, closeModal, showToast } = useUI();

  // 1. Fetch Teams
  const { data, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeamsApi()
  });

  // 2. Fetch Employees (for lead & member selection)
  const { data: empData } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: () => getEmployeesApi({ limit: 1000 })
  });

  // 3. Fetch Departments
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartmentsApi()
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTeamApi(id),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err) => {
      showToast(err.message, 'danger');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteMutation.mutate(id);
    }
  };

  const teams = data?.teams || [];
  const employees = empData?.employees || [];
  const departments = deptData?.departments || [];

  return (
    <>
      <PageLayout
        title="Teams"
        description="Organize employee groups into cross-functional project teams."
        loading={isLoading}
        isEmpty={teams.length === 0}
        emptyIllustration="default"
        emptyTitle="No Teams Created"
        emptyDescription="Define your functional business teams to track tasks and projects."
        emptyActionLabel={user?.role === 'Admin' ? "Create Team" : ""}
        onEmptyAction={user?.role === 'Admin' ? () => openModal('TEAM_CREATE') : undefined}
        actions={
          user?.role === 'Admin' && (
            <Button onClick={() => openModal('TEAM_CREATE')} icon={<Icons.Plus size={16} />}>
              Create Team
            </Button>
          )
        }
      >
        <div className="row g-4 animate-fadeIn">
          {teams.map((team) => (
            <div key={team._id} className="col-12 col-md-6 col-lg-4">
              <Card className="h-100 border border-light flex-column d-flex justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <Badge variant="secondary">{team.department?.name}</Badge>
                    <div className="d-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openModal('TEAM_MEMBERS', team)}
                        className="btn btn-link text-ws-primary p-1 border-0 bg-transparent rounded-2"
                        title="Manage Members"
                      >
                        <Icons.Employees size={16} />
                      </button>
                      {user?.role === 'Admin' && (
                        <button
                          type="button"
                          onClick={() => openModal('TEAM_EDIT', team)}
                          className="btn btn-link text-ws-primary p-1 border-0 bg-transparent rounded-2"
                          title="Edit Team"
                        >
                          <Icons.Edit size={16} />
                        </button>
                      )}
                      {user?.role === 'Admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(team._id)}
                          className="btn btn-link text-ws-danger p-1 border-0 bg-transparent rounded-2"
                          title="Delete Team"
                        >
                          <Icons.Trash size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <Typography variant="h3" className="mb-2 text-dark">{team.name}</Typography>
                  <Typography variant="body2" className="text-muted mb-4">{team.description || 'No description.'}</Typography>
                </div>

                <div className="border-top border-light pt-3 mt-2 d-flex flex-column gap-2">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted fs-8">Team Lead:</span>
                    <div className="d-flex align-items-center gap-1.5">
                      <Avatar src={team.lead?.avatar} name={team.lead?.name} size="xs" />
                      <span className="fw-semibold text-dark fs-8">{team.lead?.name}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted fs-8">Members ({team.members?.length || 0}):</span>
                    <div className="d-flex align-items-center">
                      {team.members?.slice(0, 5).map((m, idx) => (
                        <div key={m._id} style={{ marginLeft: idx > 0 ? '-10px' : '0px', zIndex: 5 - idx }}>
                          <Avatar src={m.avatar} name={m.name} size="xs" className="border border-2 border-white" />
                        </div>
                      ))}
                      {team.members?.length > 5 && (
                        <div className="bg-ws-primary-light text-ws-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-9 border border-2 border-white ms-n2" style={{ width: '24px', height: '24px', marginLeft: '-10px', zIndex: 0 }}>
                          +{team.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </PageLayout>

      {/* TEAM CREATE/EDIT MODALS */}
      <Modal
        isOpen={activeModal.type === 'TEAM_CREATE'}
        onClose={closeModal}
        title="Create New Team"
      >
        <TeamForm
          employees={employees}
          departments={departments}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={activeModal.type === 'TEAM_EDIT'}
        onClose={closeModal}
        title="Edit Team Details"
      >
        <TeamForm
          team={activeModal.data}
          employees={employees}
          departments={departments}
          onSuccess={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      {/* MEMBERS MANAGEMENT MODAL */}
      <Modal
        isOpen={activeModal.type === 'TEAM_MEMBERS'}
        onClose={closeModal}
        title={`Manage members: ${activeModal.data?.name}`}
      >
        {activeModal.data && (
          <MemberManager
            teamId={activeModal.data._id}
            teams={teams}
            employees={employees}
            onClose={closeModal}
          />
        )}
      </Modal>
    </>
  );
};

export default Teams;
