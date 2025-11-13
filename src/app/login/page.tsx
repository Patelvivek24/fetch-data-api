'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import FormError from '@/components/FormError';
import styles from './page.module.scss';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [apiError, setApiError] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  // Check for signup success message
  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSignupSuccess(true);
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setApiError('');
      await login(data.email, data.password, data.rememberMe);
    } catch (error) {
      // Handle ApiError objects
      if (error && typeof error === 'object' && 'message' in error) {
        setApiError((error as { message: string }).message || 'Login failed. Please try again.');
      } else if (error instanceof Error) {
        setApiError(error.message || 'Login failed. Please try again.');
      } else {
        setApiError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
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
          <h1 className={styles.welcomeTitle}>Welcome back!</h1>
          <p className={styles.welcomeText}>
            You can sign in to access with your existing account.
          </p>
        </div>
      </div>

      {/* Right Section - Sign In Form */}
      <div className={styles.rightSection}>
        <div className={styles.card}>
          <h2 className={styles.title}>Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {signupSuccess && (
              <div className={styles.successMessage}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={styles.successIcon}
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Account created successfully! Please sign in to continue.</span>
              </div>
            )}
            <FormError message={apiError} />

            {/* Email Input */}
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="email"
                  placeholder="Username or email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <span className={styles.errorText}>{errors.email.message}</span>
              )}
            </div>

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
                  placeholder="Password"
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

            {/* Remember Me and Forgot Password */}
            <div className={styles.optionsRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className={styles.checkbox}
                />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles.buttonSpinner}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              New here?{' '}
              <a href="/signup" className={styles.link}>
                Create an Account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
