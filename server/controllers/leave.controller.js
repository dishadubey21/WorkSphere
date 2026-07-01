import leaveService from '../services/leave.service.js';

export const getLeaves = async (req, res, next) => {
  try {
    const { employee, status } = req.query;
    const leaves = await leaveService.getAll({ employee, status });
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
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Only Admin can approve or reject leaves' });
      }
      req.body.approvedBy = req.user._id;
    }

    if (req.user.role !== 'Admin') {
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
