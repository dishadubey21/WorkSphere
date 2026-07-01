import notificationService from '../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const recipient = req.user.role === 'Admin' ? (req.query.recipient || req.user._id) : req.user._id;
    const notifications = await notificationService.getAll(recipient);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.status(200).json({ success: true, notification, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const recipient = req.user.role === 'Admin' ? (req.body.recipient || req.user._id) : req.user._id;
    await notificationService.markAllAsRead(recipient);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.create(req.body);
    res.status(201).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};
