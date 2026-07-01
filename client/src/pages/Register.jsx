import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import apiClient from '../api/client.js';
import AuthLeftPane from '../components/AuthLeftPane.jsx';
import Button from '../design-system/Button.jsx';
import Input from '../design-system/Input.jsx';
import Icons from '../design-system/Icons.jsx';

// Premium Preset Avatars
const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lilly',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Cookie'
];

export const Register = () => {
  const { register: signup } = useAuth();
  const { showToast } = useUI();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength states
  const [passStrength, setPassStrength] = useState({ score: 0, label: 'Weak', color: 'bg-danger' });

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: ''
    }
  });

  const passwordVal = watch('password');

  // Calculate password strength
  useEffect(() => {
    if (!passwordVal) {
      setPassStrength({ score: 0, label: 'Weak', color: 'bg-danger' });
      return;
    }

    let score = 0;
    if (passwordVal.length >= 8) score++;
    if (/[A-Z]/.test(passwordVal) && /[a-z]/.test(passwordVal)) score++;
    if (/[0-9]/.test(passwordVal)) score++;
    if (/[^A-Za-z0-9]/.test(passwordVal)) score++;

    let label = 'Weak';
    let color = 'bg-danger';

    if (score === 2) {
      label = 'Fair';
      color = 'bg-warning';
    } else if (score === 3) {
      label = 'Good';
      color = 'bg-info';
    } else if (score === 4) {
      label = 'Strong';
      color = 'bg-success';
    }

    setPassStrength({ score, label, color });
  }, [passwordVal]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password
      };
      
      await signup(payload);
      showToast('Registration successful! Welcome to WorkSphere.', 'success');
      navigate('/');
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setApiError(errorMsg);
      showToast(errorMsg, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column flex-md-row bg-light overflow-hidden animate-fadeIn">
      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75 z-3"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="spinner-border text-ws-primary" role="status" style={{ width: '40px', height: '40px' }}>
            <span className="visually-hidden">Creating account...</span>
          </div>
          <p className="font-heading fw-semibold text-ws-primary mt-3 fs-7 animate-pulse">Building your profile...</p>
        </div>
      )}

      {/* Left Pane - Premium Branding */}
      <AuthLeftPane subtitle="Join thousands of professionals managing their corporate workload with modern interface standards." />

      {/* Right Pane - Registration Form */}
      <div className="col-12 col-md-7 col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5 bg-white overflow-auto" style={{ maxHeight: '100vh' }}>
        <div className="w-100 max-w-sm my-auto animate-slideUp">
          <div className="mb-4">
            <h2 className="font-heading fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Create Account</h2>
            <p className="text-muted fs-8">Provide details to register with your enterprise workspace directory.</p>
          </div>

          {apiError && (
            <div className="alert alert-danger py-2.5 px-3 fs-8 rounded-3 mb-4 d-flex align-items-center gap-2 border-0 bg-danger-light text-danger">
              <Icons.Alert size={16} />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3.5">
            
            <Input
              label="Full Name"
              name="name"
              placeholder="Disha Dubey"
              required
              aria-label="Full Name"
              error={errors.name?.message}
              {...register('name', { required: 'Full name is required' })}
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="disha.dubey@worksphere.com"
              required
              aria-label="Email Address"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
              })}
            />

            {/* Passwords Input Fields */}
            <div className="row g-3">
              <div className="col-12 col-sm-6 position-relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  aria-label="Password"
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-link p-0 text-muted position-absolute border-0 bg-transparent"
                  style={{ top: '36px', right: '14px', zIndex: 10, textDecoration: 'none' }}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Icons.Close size={16} /> : <Icons.Menu size={16} style={{ opacity: 0.5 }} />}
                </button>
              </div>

              <div className="col-12 col-sm-6 position-relative">
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  aria-label="Confirm Password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: value => value === passwordVal || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="btn btn-link p-0 text-muted position-absolute border-0 bg-transparent"
                  style={{ top: '36px', right: '14px', zIndex: 10, textDecoration: 'none' }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <Icons.Close size={16} /> : <Icons.Menu size={16} style={{ opacity: 0.5 }} />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {passwordVal && (
              <div className="p-2 rounded-3 bg-light border border-light">
                <div className="d-flex align-items-center justify-content-between mb-1.5 fs-9 text-muted fw-semibold">
                  <span>Password Security:</span>
                  <span className={`fw-bold text-capitalize ${passStrength.color.replace('bg-', 'text-')}`}>
                    {passStrength.label}
                  </span>
                </div>
                <div className="progress" style={{ height: '4px', borderRadius: '2px' }}>
                  <div 
                    className={`progress-bar transition-all ${passStrength.color}`}
                    role="progressbar" 
                    style={{ width: `${(passStrength.score / 4) * 100}%` }}
                    aria-valuenow={(passStrength.score / 4) * 100} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  />
                </div>
              </div>
            )}

            <Button type="submit" loading={isLoading} className="w-100 py-2.5 fs-7 fw-bold shadow-sm mt-1">
              Create Account
            </Button>
          </form>
          
          <div className="text-center mt-4 border-top border-light pt-3">
            <span className="fs-8 text-muted">Already have an account? </span>
            <Link to="/login" className="fs-8 text-ws-primary text-decoration-none fw-bold hover-underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
