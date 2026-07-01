import leaveService from '../services/leave.service.js';

export const getLeaves = async (req, res, next) => {
  try {
    const { employee, status } = req.query;
    let employeeFilter = employee;

    if (req.user.role === 'Employee') {
      employeeFilter = req.user._id;
    } else if (req.user.role === 'Manager') {
      const Employee = (await import('../models/Employee.js')).default;
      const reporting = await Employee.find({ manager: req.user._id }).select('_id');
      const reportingIds = reporting.map(e => e._id.toString());
      
      if (employee) {
        if (reportingIds.includes(employee.toString()) || employee.toString() === req.user._id.toString()) {
          employeeFilter = employee;
        } else {
          employeeFilter = null; // force empty query
        }
      } else {
        employeeFilter = { $in: [...reportingIds, req.user._id.toString()] };
      }
    }

    const leaves = await leaveService.getAll({ employee: employeeFilter, status });
    res.status(200).json({ success: true, leaves });
  } catch (error) {
    next(error);
  }
};

export const getLeaveById = async (req, res, next) => {
  try {
    const leave = await leaveService.getById(req.params.id);
    res.status(200).json({ success: true, leave });
  } catch (error) {
    next(error);
  }
};

export const createLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.create(req.body);
    res.status(201).json({ success: true, leave, message: 'Leave request submitted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.getById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const statusChanging = req.body.status && req.body.status !== leave.status;
    if (statusChanging) {
      if (req.user.role === 'Manager') {
        const Employee = (await import('../models/Employee.js')).default;
        const employeeObj = await Employee.findById(leave.employee._id);
        if (!employeeObj || employeeObj.manager?.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'You can only approve or reject leaves for employees reporting directly to you.' });
        }
      } else if (req.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Only Admin or Manager can approve or reject leaves' });
      }
      req.body.approvedBy = req.user._id;
    }

    if (!['Admin', 'Manager'].includes(req.user.role)) {
      if (leave.employee._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to modify this leave request.' });
      }
      if (leave.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Cannot modify a finalized leave request.' });
      }
    }

    const updatedLeave = await leaveService.update(req.params.id, req.body);
    res.status(200).json({ success: true, leave: updatedLeave, message: `Leave request ${req.body.status.toLowerCase()} successfully` });
  } catch (error) {
    next(error);
  }
};

export const getLeaveSummary = async (req, res, next) => {
  try {
    const { employeeId } = req.query;
    const summary = await leaveService.getSummary(employeeId);
    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};
