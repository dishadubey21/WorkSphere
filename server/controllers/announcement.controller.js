import announcementService from '../services/announcement.service.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const announcements = await announcementService.getAll({ category, search });
    res.status(200).json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await announcementService.getById(req.params.id);
    res.status(200).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      publishedBy: req.user._id,
      createdBy: req.user._id,
      publisherName: req.user.name,
      publisherEmail: req.user.email
    };
    const announcement = await announcementService.create(data);

    // Trigger notification
    const notificationService = (await import('../services/notification.service.js')).default;
    await notificationService.notifyAnnouncementPublished(announcement.title, announcement.category, req.user.name);

    res.status(201).json({ success: true, announcement, message: 'Announcement published successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await announcementService.getById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.user.role !== 'Admin') {
      const createdById = announcement.createdBy || announcement.publishedBy;
      if (!createdById || createdById.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to update this announcement' });
      }
    }

    const updated = await announcementService.update(req.params.id, req.body);
    res.status(200).json({ success: true, announcement: updated, message: 'Announcement updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await announcementService.getById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.user.role !== 'Admin') {
      const createdById = announcement.createdBy || announcement.publishedBy;
      if (!createdById || createdById.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this announcement' });
      }
    }

    await announcementService.delete(req.params.id);
    res.status(200).json({ success: true, announcement, message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};
