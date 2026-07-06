import taskService from '../services/task.service.js';

export const getTasks = async (req, res, next) => {
  try {
    const { search, priority, status, assignee, project, page, limit } = req.query;
    
    let assigneeFilter = assignee;

    if (req.user) {
      if (req.user.role === 'Employee') {
        assigneeFilter = req.user._id;
      } else if (req.user.role === 'Manager') {
        const Employee = (await import('../models/Employee.js')).default;
        const Department = (await import('../models/Department.js')).default;
        
        const myDepts = await Department.find({ head: req.user._id });
        const deptIds = myDepts.map(d => d._id);
        
        // Find all employees under the manager (including the manager themselves)
        const subEmployees = await Employee.find({
          $or: [
            { _id: req.user._id },
            { manager: req.user._id },
            { department: { $in: deptIds } }
          ]
        }).select('_id');
        
        const allowedIds = subEmployees.map(e => e._id.toString());
        
        if (assignee) {
          if (allowedIds.includes(assignee.toString())) {
            assigneeFilter = assignee;
          } else {
            // Assignee not under this manager: query a new mock ID to return empty array
            assigneeFilter = new (await import('mongoose')).default.Types.ObjectId();
          }
        } else {
          assigneeFilter = { $in: allowedIds };
        }
      }
    }

    const result = await taskService.getAll({ search, priority, status, assignee: assigneeFilter, project, page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id);
    res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const task = await taskService.create(req.body);
    res.status(201).json({ success: true, task, message: 'Task created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const taskDetails = await taskService.getById(req.params.id);
    if (!taskDetails) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role-based restrictions
    if (req.user && req.user.role === 'Employee') {
      const isAssigned = taskDetails.assignee && taskDetails.assignee._id.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You are only authorized to update tasks assigned to you.' });
      }
      // Force only status update
      const allowedUpdate = { status: req.body.status };
      const updatedTask = await taskService.update(req.params.id, allowedUpdate);
      return res.status(200).json({ success: true, task: updatedTask, message: 'Task progress updated successfully' });
    }

    // Team Leads, Managers, and Admins can update tasks
    const task = await taskService.update(req.params.id, req.body);
    res.status(200).json({ success: true, task, message: 'Task updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await taskService.delete(req.params.id);
    res.status(200).json({ success: true, task, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addTaskComment = async (req, res, next) => {
  try {
    const task = await taskService.addComment(req.params.id, req.body);
    res.status(200).json({ success: true, task, message: 'Comment added successfully' });
  } catch (error) {
    next(error);
  }
};
