import Notification from '../models/Notification.js';

class NotificationService {
  async getAll(recipientId) {
    const query = {
      $or: [
        { recipient: null }, // Global notifications
      ]
    };
    
    if (recipientId) {
      query.$or.push({ recipient: recipientId });
    }

    return await Notification.find(query).sort({ createdAt: -1 });
  }

  async markAsRead(id) {
    const notification = await Notification.findById(id);
    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async markAllAsRead(recipientId) {
    const query = { isRead: false };
    
    if (recipientId) {
      query.$or = [
        { recipient: null },
        { recipient: recipientId }
      ];
    } else {
      query.recipient = null;
    }

    await Notification.updateMany(query, { $set: { isRead: true } });
    return { success: true };
  }

  async create(data) {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  }

  async notifyRoleChange(employeeId, newRole) {
    let message = '';
    if (newRole === 'Manager') {
      message = 'Congratulations! You have been promoted to Manager. Please logout and login again to access your new dashboard.';
    } else if (newRole === 'Team Lead') {
      message = 'Congratulations! You have been promoted to Team Lead. Please logout and login again to access your new dashboard.';
    } else if (newRole === 'Employee') {
      message = 'Your role has been updated to Employee. Please logout and login again.';
    } else {
      message = `Your role has been updated to ${newRole}. Please logout and login again.`;
    }

    return await this.create({
      title: 'Role Updated',
      message,
      category: 'Announcement',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyStatusChange(employeeId, newStatus) {
    return await this.create({
      title: 'Account Status Updated',
      message: `Your account status has been updated to ${newStatus}.`,
      category: 'Announcement',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyLeaveApplied(employeeName, leaveId) {
    const Employee = (await import('../models/Employee.js')).default;
    const admin = await Employee.findOne({ role: 'Admin' });
    const adminId = admin ? admin._id : null;
    return await this.create({
      title: 'New Leave Request',
      message: `${employeeName} has applied for leave. Please review it.`,
      category: 'Leave',
      recipient: adminId,
      isRead: false
    });
  }

  async notifyLeaveDecided(employeeId, status) {
    return await this.create({
      title: `Leave Request ${status}`,
      message: `Your leave request has been ${status}.`,
      category: 'Leave',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyTaskAssignment(employeeId, taskTitle) {
    return await this.create({
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${taskTitle}.`,
      category: 'Task',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyTaskCompleted(managerId, employeeName, taskTitle) {
    return await this.create({
      title: 'Task Completed',
      message: `Task '${taskTitle}' has been completed by ${employeeName}.`,
      category: 'Task',
      recipient: managerId,
      isRead: false
    });
  }

  async notifyPasswordReset(employeeId) {
    return await this.create({
      title: 'Password Reset',
      message: 'Your password has been reset. Please contact your administrator for the temporary password.',
      category: 'Announcement',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyProjectAssignment(employeeId, projectName) {
    return await this.create({
      title: 'Added to Project',
      message: `You have been added as a member to the project: ${projectName}.`,
      category: 'Project',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyProjectRemoval(employeeId, projectName) {
    return await this.create({
      title: 'Removed from Project',
      message: `You have been removed from the project: ${projectName}.`,
      category: 'Project',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyTaskRemoval(employeeId, taskTitle) {
    return await this.create({
      title: 'Removed from Task',
      message: `You have been unassigned from the task: ${taskTitle}.`,
      category: 'Task',
      recipient: employeeId,
      isRead: false
    });
  }

  async notifyDocumentUploaded(documentName, categoryName) {
    return await this.create({
      title: 'New Document Uploaded',
      message: `A new document (${documentName}) has been uploaded in ${categoryName}.`,
      category: 'Announcement',
      recipient: null, // Global
      isRead: false
    });
  }

  async notifyAnnouncementPublished(title, category, publisherName) {
    const Employee = (await import('../models/Employee.js')).default;
    const activeEmployees = await Employee.find({ status: 'Active' });
    
    const notifications = activeEmployees.map(emp => ({
      title: 'New Announcement',
      message: `${title} - Published by ${publisherName}`,
      category: 'Announcement',
      recipient: emp._id,
      isRead: false
    }));
    
    const Notification = (await import('../models/Notification.js')).default;
    await Notification.insertMany(notifications);
  }
}

export default new NotificationService();
