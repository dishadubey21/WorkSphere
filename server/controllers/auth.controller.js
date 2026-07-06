import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import Employee from '../models/Employee.js';
import emailService from '../services/email.service.js';
import logger from '../utils/logger.js';

let oidcConfig = null;
const loadOidcConfig = async () => {
  if (oidcConfig) return oidcConfig;
  const discoveryUrl = process.env.AUTH_DISCOVERY_URL;
  if (!discoveryUrl) {
    throw new Error('AUTH_DISCOVERY_URL is not configured in environment variables');
  }
  let url = discoveryUrl;
  if (!url.endsWith('/.well-known/openid-configuration') && !url.includes('/.well-known/')) {
    url = url.replace(/\/$/, '') + '/.well-known/openid-configuration';
  }
  const response = await axios.get(url);
  oidcConfig = response.data;
  return oidcConfig;
};

// @desc    Get OIDC Redirect URL
// @route   GET /api/auth/ping/auth-url
// @access  Public
export const getPingAuthUrl = async (req, res, next) => {
  try {
    const { code_challenge, state } = req.query;
    if (!code_challenge || !state) {
      return res.status(400).json({ success: false, message: 'code_challenge and state are required' });
    }

    const discoveryUrl = process.env.AUTH_DISCOVERY_URL || '';
    if (!discoveryUrl || discoveryUrl.includes('..........')) {
      logger.error('Ping OIDC discovery URL is missing or contains placeholder values.');
      return res.status(400).json({ success: false, message: 'Authentication service is temporarily misconfigured. Please try again later.' });
    }

    const oidc = await loadOidcConfig();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.CLIENT_ID || '',
      redirect_uri: process.env.REDIRECT_URI || 'http://localhost:5173/callback',
      scope: process.env.OIDC_SCOPES || 'openid profile email',
      state,
      code_challenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `${oidc.authorization_endpoint}?${params.toString()}`;
    res.status(200).json({ success: true, authUrl });
  } catch (err) {
    logger.error('Failed to generate Ping auth URL:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    OIDC Callback & user sync
// @route   POST /api/auth/ping/callback
// @access  Public
export const pingCallback = async (req, res, next) => {
  try {
    const { code, codeVerifier } = req.body;
    if (!code || !codeVerifier) {
      return res.status(400).json({ success: false, message: 'code and codeVerifier are required' });
    }

    const discoveryUrl = process.env.AUTH_DISCOVERY_URL || '';
    if (!discoveryUrl || discoveryUrl.includes('..........')) {
      logger.error('Ping OIDC discovery URL is missing or contains placeholder values.');
      return res.status(400).json({ success: false, message: 'Authentication service is temporarily misconfigured. Please try again later.' });
    }

    const oidc = await loadOidcConfig();

    const clientId = process.env.CLIENT_ID || '';
    const clientSecret = process.env.CLIENT_SECRET || '';
    const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: process.env.REDIRECT_URI || 'http://localhost:5173/callback'
    });

    const tokenResponse = await axios.post(oidc.token_endpoint, tokenParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      }
    });

    const { id_token, access_token } = tokenResponse.data;

    // Parse OIDC ID Token payload
    const base64Url = id_token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const idTokenPayload = JSON.parse(Buffer.from(base64, 'base64').toString());

    // Fetch user details from OIDC userinfo endpoint as source of truth
    let profile = {};
    try {
      const userInfoResponse = await axios.get(oidc.userinfo_endpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      profile = userInfoResponse.data;
    } catch (err) {
      logger.error('OIDC userinfo fetch failed:', err.message);
    }

    // Debug logs to inspect OIDC claims in server console
    logger.info('Decoded ID Token Payload: ' + JSON.stringify(idTokenPayload));
    logger.info('Fetched Userinfo Profile: ' + JSON.stringify(profile));

    // Robust claim resolver checking multiple possible OIDC claims for a valid email
    const resolveEmail = () => {
      const candidates = [
        profile.email, idTokenPayload.email,
        profile.mail, idTokenPayload.mail,
        profile.emailAddress, idTokenPayload.emailAddress,
        profile.userName, idTokenPayload.userName,
        profile.username, idTokenPayload.username,
        profile.sub, idTokenPayload.sub,
        profile.uid, idTokenPayload.uid
      ];

      for (const candidate of candidates) {
        if (candidate && typeof candidate === 'string' && candidate.includes('@')) {
          return candidate.toLowerCase();
        }
      }
      return null;
    };

    let email = resolveEmail();

    if (!email) {
      const sub = profile.sub || idTokenPayload.sub;
      if (sub) {
        email = `ping_${sub}@worksphere.com`;
        logger.warn(`OIDC provider did not return an email address. Falling back to sub-based email: ${email}`);
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'OIDC provider did not return a valid email address or sub claim. Decoded claims: ' + JSON.stringify(idTokenPayload)
        });
      }
    }

    // Extract a readable name from email if OIDC name claims are missing or are UUIDs
    const isUuid = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
    
    let resolvedName = profile.name || idTokenPayload.name || profile.username || idTokenPayload.sub || 'New Employee';
    
    if (isUuid(resolvedName) || resolvedName === idTokenPayload.sub) {
      const emailPrefix = email.split('@')[0];
      if (emailPrefix.startsWith('ping_')) {
        resolvedName = 'Ping User';
      } else {
        resolvedName = emailPrefix
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
    }

    const name = resolvedName;

    // Lookup user in DB
    let user = await Employee.findOne({ email }).populate('department', 'name code');
    if (!user) {
      // Auto-create employee from Ping profile
      user = await Employee.create({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // satisfies Mongoose required validator
        role: 'Employee',
        status: 'Active'
      });
      user = await Employee.findById(user._id).populate('department', 'name code');
      logger.info(`Auto-created new Employee for Ping user: ${email}`);
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact your administrator.`
      });
    }

    // Issue standard cookie and token response
    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error('OIDC token exchange and login failed:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.response?.data?.error_description || err.message });
  }
};


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
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";


    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
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

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await Employee.findOne({ email });

    // Generic response to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    };

    if (!user) {
      // Simulate response time to match valid user flow
      await new Promise(resolve => setTimeout(resolve, 150));
      return res.status(200).json(genericResponse);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and save to DB
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    // Set 15 minutes expiry
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    try {
      // Send real SMTP email
      await emailService.sendPasswordReset(user.email, user.name, resetToken);
      logger.info('Password reset email sent.');
    } catch (mailError) {
      // Rollback DB changes if mail fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      logger.error('SMTP forgot password delivery failure:', mailError.stack);
      return res.status(500).json({
        success: false,
        message: 'Could not send password reset email. Please try again later.'
      });
    }

    res.status(200).json(genericResponse);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a password' });
    }

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

    // Set new password (pre-save hook will hash it) and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password successfully updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

