import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { logActivity } from '../utils/activityLogger.js';

class TaskService {
  async getAll({ search, priority, status, assignee, project, page = 1, limit = 20 }) {
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (priority) {
      query.priority = priority;
    }

    if (status) {
      query.status = status;
    }

    if (assignee) {
      query.assignee = assignee;
    }

    if (project) {
      query.project = project;
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'name email designation avatar')
        .populate('project', 'name status')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(query)
    ]);

    return {
      tasks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const task = await Task.findById(id)
      .populate('assignee', 'name email designation avatar phone')
      .populate('project', 'name description progress members');
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }
    return task;
  }

  async create(data) {
    const task = new Task(data);
    await task.save();

    if (task.assignee) {
      const notificationService = (await import('./notification.service.js')).default;
      await notificationService.notifyTaskAssignment(task.assignee, task.title);
    }

    await logActivity({
      action: 'Created',
      entity: 'Task',
      entityId: task._id,
      description: `Created task: ${task.title}`
    });

    return task;
  }

  async update(id, data) {
    const task = await Task.findById(id);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const oldAssignee = task.assignee;
    const assigneeChanged = data.assignee && data.assignee.toString() !== (oldAssignee ? oldAssignee.toString() : '');
    const oldStatus = task.status;
    const statusChanged = data.status && data.status !== oldStatus;
    const newStatus = data.status;

    Object.assign(task, data);
    await task.save();

    const notificationService = (await import('./notification.service.js')).default;

    if (assigneeChanged) {
      if (oldAssignee) {
        await notificationService.notifyTaskRemoval(oldAssignee, task.title);
      }
      if (task.assignee) {
        await notificationService.notifyTaskAssignment(task.assignee, task.title);
      }
    }

    if (statusChanged && task.assignee) {
      await notificationService.create({
        title: 'Task Status Updated',
        message: `The status of your task "${task.title}" has been updated to "${newStatus}".`,
        category: 'Task',
        recipient: task.assignee,
        isRead: false
      });
    }

    if (statusChanged && newStatus === 'Done') {
      // Find assignee's manager or Admin
      if (task.assignee) {
        const Employee = (await import('../models/Employee.js')).default;
        const assigneeEmp = await Employee.findById(task.assignee);
        let managerId = assigneeEmp ? assigneeEmp.manager : null;
        if (!managerId) {
          const adminUser = await Employee.findOne({ role: 'Admin' });
          managerId = adminUser ? adminUser._id : null;
        }
        if (managerId) {
          await notificationService.notifyTaskCompleted(managerId, assigneeEmp ? assigneeEmp.name : 'Employee', task.title);
        }
      }
    }

    await logActivity({
      action: 'Updated',
      entity: 'Task',
      entityId: task._id,
      description: `Updated task: ${task.title} (Status: ${task.status})`
    });

    return task;
  }

  async delete(id) {
    const task = await Task.findById(id);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    await Task.findByIdAndDelete(id);

    await logActivity({
      action: 'Deleted',
      entity: 'Task',
      entityId: id,
      description: `Deleted task: ${task.title}`
    });

    return task;
  }

  async addComment(id, commentData) {
    const task = await Task.findById(id);
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    task.comments.push({
      author: commentData.author || 'System Admin',
      text: commentData.text
    });
    
    await task.save();

    await logActivity({
      action: 'Updated',
      entity: 'Task',
      entityId: task._id,
      description: `Added comment to task: ${task.title}`
    });

    return task;
  }
}

export default new TaskService();
