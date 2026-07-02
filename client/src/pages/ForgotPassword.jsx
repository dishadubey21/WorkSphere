import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';
import apiClient from '../api/client.js';
import AuthLeftPane from '../components/AuthLeftPane.jsx';
import Button from '../design-system/Button.jsx';
import Input from '../design-system/Input.jsx';
import Icons from '../design-system/Icons.jsx';

export const ForgotPassword = () => {
  const { showToast } = useUI();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      showToast('Reset request processed successfully.', 'success');
      setIsSubmitted(true);
    } catch (err) {
      const errorMsg = err.message || 'Failed to submit reset request';
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
            <span className="visually-hidden">Sending...</span>
          </div>
          <p className="font-heading fw-semibold text-ws-primary mt-3 fs-7 animate-pulse">Generating token link...</p>
        </div>
      )}

      {/* Left Pane - Premium Branding */}
      <AuthLeftPane subtitle="Forgot your credentials? Provide your registered email and we will send a temporary password reset link to your inbox." />

      {/* Right Pane - Form Card */}
      <div className="col-12 col-md-7 col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5 bg-white">
        <div className="w-100 max-w-sm my-auto animate-slideUp">
          {!isSubmitted ? (
            <>
              <div className="mb-4">
                <h2 className="font-heading fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Reset Password</h2>
                <p className="text-muted fs-8">Provide your registered email address below, and we'll generate a reset link.</p>
              </div>

              {apiError && (
                <div className="alert alert-danger py-2.5 px-3 fs-8 rounded-3 mb-4 d-flex align-items-center gap-2 border-0 bg-danger-light text-danger">
                  <Icons.Alert size={16} />
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="d-flex flex-column gap-4">
                <Input
                  label="Enterprise Email Address"
                  name="email"
                  type="email"
                  placeholder="sarah.jenkins@worksphere.com"
                  required
                  aria-label="Enterprise Email Address"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                  })}
                />

                <Button type="submit" loading={isLoading} className="w-100 py-2.5 fs-7 fw-bold shadow-sm">
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="bg-ws-success-light rounded-circle p-3 mb-3.5 d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                <Icons.Check size={28} className="text-ws-success" />
              </div>
              <h3 className="font-heading fw-bold text-dark mb-2">Check Your Inbox</h3>
              <p className="text-muted fs-8 mb-4">
                If an account with this email exists, a password reset link has been sent.
              </p>
              <Button onClick={() => navigate('/login')} className="w-100 py-2 fs-7 fw-bold" variant="light">
                Return to Login
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

export default ForgotPassword;
