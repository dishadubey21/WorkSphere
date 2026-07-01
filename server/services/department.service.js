import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import Team from '../models/Team.js';
import { logActivity } from '../utils/activityLogger.js';

class DepartmentService {
  async getAll({ search }) {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const depts = await Department.find(query)
      .populate('head', 'name email designation avatar')
      .sort({ name: 1 });

    // Attach dynamic employeeCount
    const results = await Promise.all(depts.map(async (dept) => {
      const employeeCount = await Employee.countDocuments({ department: dept._id });
      return {
        ...dept.toObject(),
        employeeCount
      };
    }));

    return results;
  }

  async getById(id) {
    const dept = await Department.findById(id).populate('head', 'name email designation phone avatar');
    if (!dept) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }

    const employeeCount = await Employee.countDocuments({ department: dept._id });
    const teamCount = await Team.countDocuments({ department: dept._id });
    const employees = await Employee.find({ department: dept._id }).select('name email designation avatar joiningDate');

    return {
      ...dept.toObject(),
      employeeCount,
      teamCount,
      employees
    };
  }

  async create(data) {
    const existingName = await Department.findOne({ name: data.name });
    if (existingName) {
      const error = new Error('Department with this name already exists');
      error.statusCode = 400;
      throw error;
    }

    const existingCode = await Department.findOne({ code: data.code.toUpperCase() });
    if (existingCode) {
      const error = new Error('Department with this code already exists');
      error.statusCode = 400;
      throw error;
    }

    const dept = new Department({
      ...data,
      code: data.code.toUpperCase()
    });
    await dept.save();

    await logActivity({
      action: 'Created',
      entity: 'Department',
      entityId: dept._id,
      description: `Created department: ${dept.name} (${dept.code})`
    });

    return dept;
  }

  async update(id, data) {
    const dept = await Department.findById(id);
    if (!dept) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.name && data.name !== dept.name) {
      const existingName = await Department.findOne({ name: data.name });
      if (existingName) {
        const error = new Error('Department with this name already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    if (data.code && data.code.toUpperCase() !== dept.code) {
      const existingCode = await Department.findOne({ code: data.code.toUpperCase() });
      if (existingCode) {
        const error = new Error('Department with this code already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    Object.assign(dept, data);
    if (data.code) dept.code = data.code.toUpperCase();
    await dept.save();

    await logActivity({
      action: 'Updated',
      entity: 'Department',
      entityId: dept._id,
      description: `Updated department details for: ${dept.name}`
    });

    return dept;
  }

  async delete(id) {
    const dept = await Department.findById(id);
    if (!dept) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }

    // Set employee department fields to null
    await Employee.updateMany({ department: id }, { $set: { department: null } });

    await Department.findByIdAndDelete(id);

    await logActivity({
      action: 'Deleted',
      entity: 'Department',
      entityId: id,
      description: `Deleted department: ${dept.name}`
    });

    return dept;
  }
}

export default new DepartmentService();
