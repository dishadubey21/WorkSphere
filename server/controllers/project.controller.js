import projectService from '../services/project.service.js';

export const getProjects = async (req, res, next) => {
  try {
    const { search, status, priority, page, limit } = req.query;
    const employeeId = req.user.role === 'Admin' ? null : req.user._id;
    const result = await projectService.getAll({ search, status, priority, page, limit, employeeId });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getById(req.params.id);
    res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, project, message: 'Project created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.update(req.params.id, req.body);
    res.status(200).json({ success: true, project, message: 'Project updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await projectService.delete(req.params.id);
    res.status(200).json({ success: true, project, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
