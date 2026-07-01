import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import { logActivity } from '../utils/activityLogger.js';

class LeaveService {
  async getAll({ employee, status }) {
    const query = {};
    if (employee) {
      query.employee = employee;
    }
    if (status) {
      query.status = status;
    }

    const results = await Leave.find(query)
      .populate('employee', 'name email designation avatar')
      .populate('approvedBy', 'name designation');

    results.sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return results;
  }

  async getById(id) {
    const leave = await Leave.findById(id)
      .populate('employee', 'name email designation avatar phone')
      .populate('approvedBy', 'name designation');
    if (!leave) {
      const error = new Error('Leave request not found');
      error.statusCode = 404;
      throw error;
    }
    return leave;
  }

  async create(data) {
    // Validate date range
    if (new Date(data.startDate) > new Date(data.endDate)) {
      const error = new Error('Start date cannot be after end date');
      error.statusCode = 400;
      throw error;
    }

    // Check for overlap
    const overlap = await Leave.findOne({
      employee: data.employee,
      status: { $ne: 'Rejected' },
      $or: [
        { startDate: { $lte: data.endDate }, endDate: { $gte: data.startDate } }
      ]
    });

    if (overlap) {
      const error = new Error('Leave request overlaps with an existing request');
      error.statusCode = 400;
      throw error;
    }

    const leave = new Leave(data);
    await leave.save();

    const employeeObj = await Employee.findById(data.employee);

    if (employeeObj) {
      const notificationService = (await import('./notification.service.js')).default;
      await notificationService.notifyLeaveApplied(employeeObj.name, leave._id);
    }

    await logActivity({
      action: 'Created',
      entity: 'Leave',
      entityId: leave._id,
      description: `Requested leave: ${employeeObj ? employeeObj.name : 'Employee'} for ${data.type} (${data.startDate} to ${data.endDate})`
    });

    return leave;
  }

  async update(id, data) {
    const leave = await Leave.findById(id).populate('employee', 'name');
    if (!leave) {
      const error = new Error('Leave request not found');
      error.statusCode = 404;
      throw error;
    }

    const oldStatus = leave.status;
    const statusChanged = data.status && data.status !== oldStatus;
    const newStatus = data.status;

    Object.assign(leave, data);
    await leave.save();

    if (statusChanged && (newStatus === 'Approved' || newStatus === 'Rejected')) {
      const notificationService = (await import('./notification.service.js')).default;
      await notificationService.notifyLeaveDecided(leave.employee._id, newStatus);
      
      await logActivity({
        action: 'Updated',
        entity: 'Leave',
        entityId: leave._id,
        description: `Admin ${newStatus.toLowerCase()} leave request for ${leave.employee ? leave.employee.name : 'Employee'}`
      });
    } else {
      await logActivity({
        action: 'Updated',
        entity: 'Leave',
        entityId: leave._id,
        description: `${data.status} leave request for ${leave.employee ? leave.employee.name : 'Employee'} (Type: ${leave.type})`
      });
    }

    return leave;
  }

  async getSummary(employeeId) {
    // Return standard balances
    // Let's assume standard allocations: Annual: 25 days, Sick: 15 days, Maternity/Paternity: 90 days
    // Let's calculate duration of approved leaves for each type
    const query = { status: 'Approved' };
    if (employeeId) {
      query.employee = employeeId;
    }

    const approvedLeaves = await Leave.find(query);

    const taken = {
      Annual: 0,
      Sick: 0,
      'Maternity/Paternity': 0,
      Unpaid: 0
    };

    approvedLeaves.forEach(leave => {
      const ms = new Date(leave.endDate) - new Date(leave.startDate);
      const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1; // inclusive
      if (taken[leave.type] !== undefined) {
        taken[leave.type] += days;
      }
    });

    const allocations = {
      Annual: 25,
      Sick: 15,
      'Maternity/Paternity': 90,
      Unpaid: 0
    };

    return {
      allocations,
      taken,
      remaining: {
        Annual: Math.max(0, allocations.Annual - taken.Annual),
        Sick: Math.max(0, allocations.Sick - taken.Sick),
        'Maternity/Paternity': Math.max(0, allocations['Maternity/Paternity'] - taken['Maternity/Paternity']),
        Unpaid: taken.Unpaid // uncapped, just tracks amount taken
      }
    };
  }
}

export default new LeaveService();
