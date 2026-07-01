let appSettings = {
  companyName: 'WorkSphere Corp',
  systemEmail: 'admin@worksphere.com',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  allowEmployeeLeaveRequests: true,
  enableGlobalNotifications: true,
  themePreference: 'light'
};

export const getSettings = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, settings: appSettings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    appSettings = { ...appSettings, ...req.body };
    res.status(200).json({ success: true, settings: appSettings, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPersonalSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      settings: {
        theme: req.user.theme || 'light',
        emailNotifications: req.user.emailNotifications !== false,
        pushNotifications: req.user.pushNotifications !== false,
        smsAlerts: req.user.smsAlerts === true
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePersonalSettings = async (req, res, next) => {
  try {
    const Employee = (await import('../models/Employee.js')).default;
    const updateData = {};
    if (req.body.theme !== undefined) updateData.theme = req.body.theme;
    if (req.body.emailNotifications !== undefined) updateData.emailNotifications = req.body.emailNotifications;
    if (req.body.pushNotifications !== undefined) updateData.pushNotifications = req.body.pushNotifications;
    if (req.body.smsAlerts !== undefined) updateData.smsAlerts = req.body.smsAlerts;

    const updated = await Employee.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true });
    res.status(200).json({
      success: true,
      settings: {
        theme: updated.theme || 'light',
        emailNotifications: updated.emailNotifications !== false,
        pushNotifications: updated.pushNotifications !== false,
        smsAlerts: updated.smsAlerts === true
      },
      message: 'Personal settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
