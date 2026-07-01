import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import { logActivity } from '../utils/activityLogger.js';

class ProjectService {
  async getAll({ search, status, priority, page = 1, limit = 8, employeeId }) {
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (employeeId) {
      const teams = await Team.find({
        $or: [
          { lead: employeeId },
          { members: employeeId }
        ]
      });
      const teamIds = teams.map(t => t._id);

      query.$or = [
        { members: employeeId },
        { team: { $in: teamIds } },
        { manager: employeeId }
      ];
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('members', 'name email designation avatar')
        .populate('manager', 'name email designation avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(query)
    ]);

    return {
      projects,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const project = await Project.findById(id)
      .populate('members', 'name email designation avatar phone joiningDate')
      .populate('manager', 'name email designation avatar phone');
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    // Include tasks count and task distributions
    const totalTasks = await Task.countDocuments({ project: id });
    const completedTasks = await Task.countDocuments({ project: id, status: 'Done' });

    return {
      ...project.toObject(),
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks
      }
    };
  }

  async create(data) {
    const existing = await Project.findOne({ name: data.name });
    if (existing) {
      const error = new Error('Project with this name already exists');
      error.statusCode = 400;
      throw error;
    }

    // Auto-calculate progress if milestones are provided
    let progress = 0;
    if (data.milestones && data.milestones.length > 0) {
      const completed = data.milestones.filter(m => m.completed).length;
      progress = Math.round((completed / data.milestones.length) * 100);
    }

    const project = new Project({
      ...data,
      progress
    });
    await project.save();

    const notificationService = (await import('./notification.service.js')).default;
    if (project.members && project.members.length > 0) {
      for (const memberId of project.members) {
        await notificationService.notifyProjectAssignment(memberId, project.name);
      }
    }

    await logActivity({
      action: 'Created',
      entity: 'Project',
      entityId: project._id,
      description: `Created project: ${project.name}`
    });

    return project;
  }

  async update(id, data) {
    const project = await Project.findById(id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.name && data.name !== project.name) {
      const existing = await Project.findOne({ name: data.name });
      if (existing) {
        const error = new Error('Project with this name already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    const oldMembers = project.members.map(m => m.toString());
    const newMembers = data.members ? data.members.map(m => m.toString()) : oldMembers;

    const addedMembers = newMembers.filter(m => !oldMembers.includes(m));
    const removedMembers = oldMembers.filter(m => !newMembers.includes(m));

    Object.assign(project, data);

    // Auto-calculate progress based on updated milestones
    if (project.milestones && project.milestones.length > 0) {
      const completed = project.milestones.filter(m => m.completed).length;
      project.progress = Math.round((completed / project.milestones.length) * 100);
    } else {
      project.progress = 0;
    }

    await project.save();

    const notificationService = (await import('./notification.service.js')).default;
    for (const memberId of addedMembers) {
      await notificationService.notifyProjectAssignment(memberId, project.name);
    }
    for (const memberId of removedMembers) {
      await notificationService.notifyProjectRemoval(memberId, project.name);
    }

    await logActivity({
      action: 'Updated',
      entity: 'Project',
      entityId: project._id,
      description: `Updated project: ${project.name}`
    });

    return project;
  }

  async delete(id) {
    const project = await Project.findById(id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    // Delete related tasks
    await Task.deleteMany({ project: id });

    await Project.findByIdAndDelete(id);

    await logActivity({
      action: 'Deleted',
      entity: 'Project',
      entityId: id,
      description: `Deleted project: ${project.name}`
    });

    return project;
  }
}

export default new ProjectService();
