import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Employee from '../models/Employee.js';

// Helper to sign JWT and generate cookie response
const sendTokenResponse = (user, statusCode, res) => {
  const secret = process.env.JWT_SECRET || 'worksphere_jwt_secret_phrase_2026';
  const token = jwt.sign({ id: user._id }, secret, {
    expiresIn: '30d'
  });

  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        role: user.role,
        avatar: user.avatar,
        department: user.department // populated department object or string
      }
    });
};

// @desc    Register a new user/employee
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if employee already exists
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    // Create employee (enforce defaults for real SaaS safety)
    const user = await Employee.create({
      name,
      email,
      password,
      role: 'Employee',
      status: 'Active'
    });

    const populatedUser = await Employee.findById(user._id).populate('department', 'name code');
    sendTokenResponse(populatedUser, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login user/employee
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for employee (explicitly select password) and populate department
    const user = await Employee.findOne({ email }).select('+password +status').populate('department', 'name code');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Enforce active status
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact your administrator.`
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Logout user / Clear HttpOnly cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/"
    });

    res.status(200).json({ success: true, message: 'Successfully logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    const user = await Employee.findById(req.user.id).populate('department', 'name code');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        role: user.role,
        avatar: user.avatar,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await Employee.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No employee found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and save to DB
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    // Create reset URL
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    // Log link to terminal console
    console.log('\n======================================');
    console.log('PASSWORD RESET LINK SIMULATION:');
    console.log(`To: ${user.email}`);
    console.log(`Link: ${resetUrl}`);
    console.log('======================================\n');

    res.status(200).json({
      success: true,
      message: 'Password reset link simulated in console. Check terminal.',
      token: resetToken // Also returning token to allow API testing
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await Employee.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    // Set new password (pre-save hook will hash it)
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
