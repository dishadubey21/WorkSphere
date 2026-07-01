import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  designation: {
    type: String,
    trim: true,
    default: 'Employee'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  address: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Team Lead', 'Employee'],
    default: 'Employee'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Resigned', 'On Notice', 'Archived'],
    default: 'Active'
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  theme: {
    type: String,
    default: 'light'
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  smsAlerts: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Pre-save hook to hash password before saving to DB
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

employeeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
