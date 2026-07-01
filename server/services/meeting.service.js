import Meeting from '../models/Meeting.js';

class MeetingService {
  async getAll({ date, createdBy }) {
    const query = {};
    if (createdBy) {
      query.createdBy = createdBy;
    }
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    return await Meeting.find(query).populate('createdBy', 'name avatar').sort({ startTime: 1 });
  }

  async getById(id) {
    return await Meeting.findById(id);
  }

  async create(data) {
    const meeting = new Meeting(data);
    return await meeting.save();
  }

  async update(id, data) {
    return await Meeting.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Meeting.findByIdAndDelete(id);
  }
}

export default new MeetingService();
