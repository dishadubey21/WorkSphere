import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Leave from '../models/Leave.js';
import Team from '../models/Team.js';
import Department from '../models/Department.js';
import ActivityLog from '../models/ActivityLog.js';

class AnalyticsService {
  async getDashboardStats(user) {
    let employeeQuery = {};
    let leaveQuery = { status: 'Pending' };
    let taskQuery = {};
    let projectQuery = { status: 'Active' };
    let teamQuery = {};

    if (user && user.role === 'Manager') {
      const Department = (await import('../models/Department.js')).default;
      const myDepts = await Department.find({ head: user._id });
      const deptIds = myDepts.map(d => d._id);

      const reportingEmployees = await Employee.find({
        $or: [
          { _id: user._id },
          { manager: user._id },
          { department: { $in: deptIds } }
        ]
      }).select('_id');
      const reportingEmployeeIds = reportingEmployees.map(e => e._id);

      employeeQuery = { _id: { $in: reportingEmployeeIds } };
      leaveQuery.employee = { $in: reportingEmployeeIds };
      taskQuery.assignee = { $in: reportingEmployeeIds };
      
      projectQuery.$or = [
        { manager: user._id },
        { createdBy: user._id },
        { members: { $in: reportingEmployeeIds } }
      ];
    }

    const [
      employeeCount,
      activeProjectsCount,
      openTasksCount,
      completedTasksCount,
      pendingLeavesCount,
      teamCount
    ] = await Promise.all([
      Employee.countDocuments(employeeQuery),
      Project.countDocuments(projectQuery),
      Task.countDocuments({ ...taskQuery, status: { $in: ['Todo', 'In Progress', 'Review'] } }),
      Task.countDocuments({ ...taskQuery, status: 'Done' }),
      Leave.countDocuments(leaveQuery),
      Team.countDocuments(teamQuery)
    ]);

    return {
      employees: employeeCount,
      activeProjects: activeProjectsCount,
      openTasks: openTasksCount,
      completedTasks: completedTasksCount,
      pendingLeaves: pendingLeavesCount,
      teams: teamCount
    };
  }

  async getDashboardAnalytics(user) {
    let reportingEmployeeIds = null;
    let projectFilter = {};
    let taskFilter = {};
    let employeeFilter = {};
    let activityFilter = {};
    
    if (user && user.role === 'Manager') {
      const Department = (await import('../models/Department.js')).default;
      const myDepts = await Department.find({ head: user._id });
      const deptIds = myDepts.map(d => d._id);

      const reportingEmployees = await Employee.find({
        $or: [
          { _id: user._id },
          { manager: user._id },
          { department: { $in: deptIds } }
        ]
      }).select('_id name');
      reportingEmployeeIds = reportingEmployees.map(e => e._id);
      const reportingEmployeeNames = reportingEmployees.map(e => e.name);
      
      projectFilter.$or = [
        { manager: user._id },
        { createdBy: user._id },
        { members: { $in: reportingEmployeeIds } }
      ];
      
      taskFilter.assignee = { $in: reportingEmployeeIds };
      employeeFilter = { _id: { $in: reportingEmployeeIds } };
      activityFilter = { user: { $in: reportingEmployeeNames } };
    }

    // 1. Project Progress
    const projects = await Project.find(projectFilter).limit(10).select('name status progress');

    // 2. Task Distribution by Status
    const taskStatusPipeline = [];
    if (user && user.role === 'Manager') {
      taskStatusPipeline.push({ $match: taskFilter });
    }
    taskStatusPipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } });
    const taskStatusCounts = await Task.aggregate(taskStatusPipeline);
    
    const taskStatus = { Todo: 0, 'In Progress': 0, Review: 0, Done: 0 };
    taskStatusCounts.forEach(item => {
      if (taskStatus[item._id] !== undefined) {
        taskStatus[item._id] = item.count;
      }
    });

    // 3. Task Distribution by Priority
    const taskPriorityPipeline = [];
    if (user && user.role === 'Manager') {
      taskPriorityPipeline.push({ $match: taskFilter });
    }
    taskPriorityPipeline.push({ $group: { _id: '$priority', count: { $sum: 1 } } });
    const taskPriorityCounts = await Task.aggregate(taskPriorityPipeline);
    
    const taskPriority = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
    taskPriorityCounts.forEach(item => {
      if (taskPriority[item._id] !== undefined) {
        taskPriority[item._id] = item.count;
      }
    });

    // 4. Department Distribution
    const depts = await Department.find().select('name');
    const departmentDistribution = await Promise.all(depts.map(async (dept) => {
      const count = await Employee.countDocuments({ ...employeeFilter, department: dept._id });
      return {
        name: dept.name,
        value: count
      };
    }));

    // 5. Weekly Activity (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      last7Days.push(d);
    }

    const weeklyActivity = await Promise.all(last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await ActivityLog.countDocuments({
        ...activityFilter,
        timestamp: { $gte: date, $lt: nextDay }
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        day: dayNames[date.getDay()],
        activities: count
      };
    }));

    // 6. Upcoming Deadlines (Tasks due in the future)
    const upcomingDeadlines = await Task.find({
      ...taskFilter,
      dueDate: { $gte: new Date() },
      status: { $ne: 'Done' }
    })
      .populate('assignee', 'name avatar')
      .populate('project', 'name')
      .sort({ dueDate: 1 })
      .limit(5)
      .select('title dueDate project assignee priority');

    // 7. Recent Activities
    const recentActivities = await ActivityLog.find(activityFilter)
      .sort({ timestamp: -1 })
      .limit(10);

    return {
      projectProgress: projects,
      taskDistribution: Object.keys(taskStatus).map(key => ({ name: key, value: taskStatus[key] })),
      taskPriority: Object.keys(taskPriority).map(key => ({ name: key, value: taskPriority[key] })),
      departmentDistribution: departmentDistribution.filter(d => d.value > 0),
      weeklyActivity,
      upcomingDeadlines,
      recentActivities
    };
  }
}

export default new AnalyticsService();
