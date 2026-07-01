import employeeService from '../services/employee.service.js';

export const getEmployees = async (req, res, next) => {
  try {
    const { search, department, designation, sort, page, limit } = req.query;
    
    let filter = {};
    if (req.user && (req.user.role === 'Manager' || req.user.role === 'Team Lead')) {
      const Team = (await import('../models/Team.js')).default;
      const myTeams = await Team.find({ lead: req.user._id });
      const memberIds = myTeams.flatMap(t => t.members.map(m => m.toString()));
      // Always include themselves
      memberIds.push(req.user._id.toString());
      filter._id = { $in: memberIds };
    }

    const result = await employeeService.getAll({ search, department, designation, sort, page, limit, filter });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getById(req.params.id);
    res.status(200).json({ success: true, employee });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.create(req.body);
    res.status(201).json({ success: true, employee, message: 'Employee created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.update(req.params.id, req.body);
    res.status(200).json({ success: true, employee, message: 'Employee updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.delete(req.params.id);
    res.status(200).json({ success: true, employee, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const resetEmployeePassword = async (req, res, next) => {
  try {
    const tempPassword = await employeeService.resetPassword(req.params.id);
    res.status(200).json({ success: true, tempPassword, message: 'Temporary password generated successfully' });
  } catch (error) {
    next(error);
  }
};
