import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { logActivity } from '../utils/activityLogger.js';

class EmployeeService {
  async getAll({ search, department, designation, sort, page = 1, limit = 10, filter = {} }) {
    const query = { ...filter };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (designation) {
      query.designation = designation;
    }

    const sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.name = 1;
    }

    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('department', 'name code')
        .populate('manager', 'name email designation')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Employee.countDocuments(query)
    ]);

    return {
      employees,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const employee = await Employee.findById(id)
      .populate('department', 'name code description')
      .populate('manager', 'name email designation phone');
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }
    return employee;
  }

  async create(data) {
    const existing = await Employee.findOne({ email: data.email });
    if (existing) {
      const error = new Error('Employee with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    const employee = new Employee(data);
    await employee.save();

    await logActivity({
      action: 'Created',
      entity: 'Employee',
      entityId: employee._id,
      description: `Created employee: ${employee.name} (${employee.designation})`
    });

    return employee;
  }

  async update(id, data, requestingUser) {
    const employee = await Employee.findById(id);
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.email && data.email !== employee.email) {
      const existing = await Employee.findOne({ email: data.email });
      if (existing) {
        const error = new Error('Employee with this email already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    const roleChanged = data.role && data.role !== employee.role;
    const oldRole = employee.role;
    const newRole = data.role;

    if (roleChanged) {
      if (!requestingUser || requestingUser.role !== 'Admin') {
        const error = new Error('Forbidden: Only Administrators can modify employee roles');
        error.statusCode = 403;
        throw error;
      }
    }

    const statusChanged = data.status && data.status !== employee.status;
    const oldStatus = employee.status;
    const newStatus = data.status;

    Object.assign(employee, data);
    await employee.save();

    // Trigger decoupled notifications & logs
    const notificationService = (await import('./notification.service.js')).default;

    if (roleChanged) {
      await notificationService.notifyRoleChange(employee._id, newRole);
      await logActivity({
        action: 'Updated',
        entity: 'Employee',
        entityId: employee._id,
        description: `Admin changed role of ${employee.name}: ${oldRole} → ${newRole}`
      });
    }

    if (statusChanged) {
      await notificationService.notifyStatusChange(employee._id, newStatus);
      const actionLabel = newStatus === 'Suspended' ? 'Suspend' : newStatus === 'Active' ? 'Activate' : 'Updated Status';
      await logActivity({
        action: 'Updated',
        entity: 'Employee',
        entityId: employee._id,
        description: `Admin updated account status of ${employee.name} to ${newStatus}`
      });
    }

    if (!roleChanged && !statusChanged) {
      await logActivity({
        action: 'Updated',
        entity: 'Employee',
        entityId: employee._id,
        description: `Updated employee details for: ${employee.name}`
      });
    }

    return employee;
  }

  async delete(id) {
    const employee = await Employee.findById(id);
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    await Employee.findByIdAndDelete(id);

    await logActivity({
      action: 'Deleted',
      entity: 'Employee',
      entityId: id,
      description: `Deleted employee: ${employee.name}`
    });

    return employee;
  }

  async resetPassword(id) {
    const employee = await Employee.findById(id);
    if (!employee) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    const tempPassword = 'WS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    employee.password = tempPassword;
    await employee.save();

    const notificationService = (await import('./notification.service.js')).default;
    await notificationService.notifyPasswordReset(employee._id);

    await logActivity({
      action: 'Updated',
      entity: 'Employee',
      entityId: employee._id,
      description: `Admin reset password for employee: ${employee.name}`
    });

    return tempPassword;
  }
}

export default new EmployeeService();
