'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import styles from './page.module.scss';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Dashboard</h1>
          <div className={styles.headerActions}>
            <span className={styles.welcomeText}>Welcome, {user?.name}!</span>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.successBadge}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Login Successful!</span>
          </div>
          <h2 className={styles.heroTitle}>Welcome to Your Dashboard</h2>
          <p className={styles.heroSubtitle}>
            You have successfully signed in. This is your dashboard where you can manage your account and access your data.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>User Information</h3>
            <div className={styles.info}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Name:</span>
                <span className={styles.infoValue}>{user?.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{user?.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>User ID:</span>
                <span className={styles.infoValue}>{user?.id}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Quick Actions</h3>
            <p className={styles.description}>
              Your authentication is working correctly! You can now build out your dashboard with additional features and content.
            </p>
            <div className={styles.actions}>
              <Button variant="primary" onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

