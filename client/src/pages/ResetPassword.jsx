import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';
import apiClient from '../api/client.js';
import AuthLeftPane from '../components/AuthLeftPane.jsx';
import Button from '../design-system/Button.jsx';
import Input from '../design-system/Input.jsx';
import Icons from '../design-system/Icons.jsx';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { token } = useParams();

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [countdown, setCountdown] = useState(3);
  
  // Password strength states
  const [passStrength, setPassStrength] = useState({ score: 0, label: 'Weak', color: 'bg-danger' });

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange'
  });

  const passwordVal = watch('password');

  // Calculate password strength & updates checklist validation
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

  // Automatic countdown and redirection flow after successful password reset
  useEffect(() => {
    if (!isSuccess) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess, navigate]);

  const onSubmit = async (data) => {
    if (!token) {
      setApiError('Missing password reset token. Please check your reset link.');
      showToast('Missing reset token!', 'danger');
      return;
    }

    setIsLoading(true);
    setApiError('');
    try {
      await apiClient.post(`/auth/reset-password/${token}`, { password: data.password });
      showToast('Password updated successfully!', 'success');
      setIsSuccess(true);
    } catch (err) {
      const errorMsg = err.message || 'Failed to reset password';
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
            <span className="visually-hidden">Updating...</span>
          </div>
          <p className="font-heading fw-semibold text-ws-primary mt-3 fs-7 animate-pulse">Saving new credentials...</p>
        </div>
      )}

      {/* Left Pane - Premium Branding */}
      <AuthLeftPane subtitle="Set up a strong password utilizing uppercase letters, numbers, and symbols to ensure maximum defense." />

      {/* Right Pane - Form Card */}
      <div className="col-12 col-md-7 col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5 bg-white">
        <div className="w-100 max-w-sm my-auto animate-slideUp">
          {!isSuccess ? (
            <>
              <div className="mb-4">
                <h2 className="font-heading fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>New Password</h2>
                <p className="text-muted fs-8">Specify a strong new password to unlock your account access.</p>
              </div>

              {!token && (
                <div className="alert alert-warning py-2.5 px-3 fs-8 rounded-3 mb-4 d-flex align-items-center gap-2 border-0 bg-warning-light text-warning">
                  <Icons.Alert size={16} />
                  <span>Warning: No reset token detected in URL parameter.</span>
                </div>
              )}

              {apiError && (
                <div className="alert alert-danger py-2.5 px-3 fs-8 rounded-3 mb-4 d-flex align-items-center gap-2 border-0 bg-danger-light text-danger">
                  <Icons.Alert size={16} />
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-3.5">
                <div className="position-relative">
                  <Input
                    label="New Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    aria-label="New Password"
                    error={errors.password?.message}
                    {...register('password', {
                      required: 'Password is required',
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                        message: 'Must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.'
                      }
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

                <div className="position-relative">
                  <Input
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    aria-label="Confirm New Password"
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

                {/* Password Strength Indicator */}
                {passwordVal && (
                  <div className="p-2.5 rounded-3 bg-light border border-light mt-1">
                    <div className="d-flex align-items-center justify-content-between mb-1.5 fs-8 text-muted fw-semibold">
                      <span>Password Strength:</span>
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

                <Button type="submit" loading={isLoading} disabled={!isValid} className="w-100 py-2.5 fs-7 fw-bold shadow-sm mt-1">
                  Update Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="bg-ws-success-light rounded-circle p-3 mb-3.5 d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                <Icons.Check size={28} className="text-ws-success" />
              </div>
              <h3 className="font-heading fw-bold text-dark mb-2">Password Restored</h3>
              <p className="text-muted fs-8 mb-4">
                Your password has been successfully updated. Redirecting you to the sign in page in <strong>{countdown}</strong> seconds...
              </p>
              <Button onClick={() => navigate('/login')} className="w-100 py-2 fs-7 fw-bold">
                Go to Sign In Now
              </Button>
            </div>
          )}

          <div className="text-center mt-4.5 border-top border-light pt-3.5">
            <Link to="/login" className="fs-8 text-ws-primary text-decoration-none fw-semibold d-flex align-items-center justify-content-center gap-1.5 hover-underline">
              <Icons.ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
