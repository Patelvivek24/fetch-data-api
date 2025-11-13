'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import FormError from '@/components/FormError';
import styles from './page.module.scss';

// Validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setApiError('Invalid or missing reset token. Please request a new password reset link.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setApiError('Invalid reset token');
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError('');
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (error: any) {
      setApiError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <div className={styles.artwork}>
            <div className={styles.artLine1}></div>
            <div className={styles.artLine2}></div>
            <div className={styles.artLine3}></div>
            <div className={styles.artPlus1}>+</div>
            <div className={styles.artPlus2}>+</div>
            <div className={styles.artPlus3}>+</div>
            <div className={styles.artCircle1}>o</div>
            <div className={styles.artCircle2}>o</div>
            <div className={styles.artDots}></div>
          </div>
          <div className={styles.leftContent}>
            <h1 className={styles.welcomeTitle}>Password Reset!</h1>
            <p className={styles.welcomeText}>
              Your password has been successfully reset.
            </p>
          </div>
        </div>
        <div className={styles.rightSection}>
          <div className={styles.card}>
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className={styles.successTitle}>Password Reset Successful</h3>
              <p className={styles.successText}>
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push('/login')}
                className={styles.backButton}
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Left Section - Purple Gradient with Art */}
      <div className={styles.leftSection}>
        <div className={styles.artwork}>
          <div className={styles.artLine1}></div>
          <div className={styles.artLine2}></div>
          <div className={styles.artLine3}></div>
          <div className={styles.artPlus1}>+</div>
          <div className={styles.artPlus2}>+</div>
          <div className={styles.artPlus3}>+</div>
          <div className={styles.artCircle1}>o</div>
          <div className={styles.artCircle2}>o</div>
          <div className={styles.artDots}></div>
        </div>
        <div className={styles.leftContent}>
          <h1 className={styles.welcomeTitle}>Reset Password</h1>
          <p className={styles.welcomeText}>
            Enter your new password below to complete the reset process.
          </p>
        </div>
      </div>

      {/* Right Section - Reset Password Form */}
      <div className={styles.rightSection}>
        <div className={styles.card}>
          <h2 className={styles.title}>New Password</h2>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <FormError message={apiError} />

            {/* Password Input */}
            <div className={styles.inputWrapper}>
              <div className={styles.inputContainer}>
                <svg
                  className={styles.inputIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className={styles.errorText}>{errors.password.message}</span>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className={styles.inputWrapper}>
              <div className={styles.inputContainer}>
                <svg
                  className={styles.inputIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className={styles.errorText}>{errors.confirmPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? (
                <span className={styles.buttonSpinner}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              Remember your password?{' '}
              <a href="/login" className={styles.link}>
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

