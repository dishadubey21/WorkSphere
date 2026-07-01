import meetingService from '../services/meeting.service.js';

export const getMeetings = async (req, res, next) => {
  try {
    // If not Admin, they only view their own meetings
    const createdBy = req.user.role === 'Admin' ? req.query.createdBy : req.user._id;
    const date = req.query.date;
    const meetings = await meetingService.getAll({ date, createdBy });
    res.status(200).json({ success: true, meetings });
  } catch (error) {
    next(error);
  }
};

export const createMeeting = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const meeting = await meetingService.create(data);
    res.status(201).json({ success: true, meeting, message: 'Meeting scheduled successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.getById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    if (meeting.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this meeting' });
    }
    const updated = await meetingService.update(req.params.id, req.body);
    res.status(200).json({ success: true, meeting: updated, message: 'Meeting updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await meetingService.getById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    if (meeting.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this meeting' });
    }
    await meetingService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    next(error);
  }
};
