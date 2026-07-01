import analyticsService from '../services/analytics.service.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics(req.user);
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
};
