'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import FormError from '@/components/FormError';
import styles from './page.module.scss';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setApiError('');
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      setApiError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className={styles.welcomeTitle}>Forgot Password?</h1>
          <p className={styles.welcomeText}>
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>
      </div>

      {/* Right Section - Forgot Password Form */}
      <div className={styles.rightSection}>
        <div className={styles.card}>
          <h2 className={styles.title}>Reset Password</h2>

          {isSuccess ? (
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
              <h3 className={styles.successTitle}>Check your email</h3>
              <p className={styles.successText}>
                We've sent password reset instructions to your email address.
                Please check your inbox and follow the link to reset your password.
              </p>
              <button
                onClick={() => router.push('/login')}
                className={styles.backButton}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <FormError message={apiError} />

              <p className={styles.description}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

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
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    placeholder="Email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <span className={styles.errorText}>{errors.email.message}</span>
                )}
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
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

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

