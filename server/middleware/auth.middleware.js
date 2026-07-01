import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';

export const protect = async (req, res, next) => {
  let token;

  // Extract token from request cookie or auth header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        acc[parts[0]] = parts[1];
      }
      return acc;
    }, {});
    token = cookies.token;
  }

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, login required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'worksphere_jwt_secret_phrase_2026');
    
    // Find the employee in the database
    req.user = await Employee.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User record not found' });
    }
    
    // Check if account status is active
    if (req.user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${req.user.status}. Access Denied.`
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired or token invalid' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'Guest'}' lacks access permissions`
      });
    }
    next();
  };
};

export const adminOrSelf = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (req.user.role === 'Admin' || req.user.id === req.params.id || req.user._id.toString() === req.params.id) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Admin permissions or self-access required' });
  }
};

export const adminOrManagerOrSelf = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (req.user.role === 'Admin' || req.user.role === 'Manager' || req.user.id === req.params.id || req.user._id.toString() === req.params.id) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Admin/Manager permissions or self-access required' });
  }
};
