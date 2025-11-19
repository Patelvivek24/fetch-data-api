'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.scss';
import Button from '../Button';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsResourcesOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.logo} onClick={closeMobileMenu}>
            EZFolio.
          </Link>
          <button
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={styles.mobileMenuIcon}>
              {isMobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </span>
          </button>
        </div>
        
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink} onClick={closeMobileMenu}>
            Home
          </Link>
          <Link href="/product" className={styles.navLink} onClick={closeMobileMenu}>
            Product
          </Link>
          <Link href="/data" className={styles.navLink} onClick={closeMobileMenu}>
            Inventory
          </Link>
          <div 
            className={styles.dropdown}
            onMouseEnter={() => setIsResourcesOpen(true)}
            onMouseLeave={() => setIsResourcesOpen(false)}
            onClick={() => setIsResourcesOpen(!isResourcesOpen)}
          >
            <Link href="/resources" className={styles.navLink}>
              Resources
              <svg 
                className={styles.caret} 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none"
              >
                <path 
                  d="M3 4.5L6 7.5L9 4.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            {isResourcesOpen && (
              <div className={styles.dropdownMenu}>
                <Link href="/resources/docs" className={styles.dropdownItem} onClick={closeMobileMenu}>
                  Documentation
                </Link>
                <Link href="/resources/guides" className={styles.dropdownItem} onClick={closeMobileMenu}>
                  Guides
                </Link>
                <Link href="/resources/api" className={styles.dropdownItem} onClick={closeMobileMenu}>
                  API Reference
                </Link>
              </div>
            )}
          </div>
          <Link href="/pricing" className={styles.navLink} onClick={closeMobileMenu}>
            Pricing
          </Link>
        </nav>

        <div className={`${styles.headerActions} ${isMobileMenuOpen ? styles.headerActionsOpen : ''}`}>
          {isAuthenticated ? (
            <>
              <span className={styles.welcomeText}>Welcome, {user?.name}!</span>
              <Button variant="outline" onClick={logout} className={styles.logoutButton}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.loginLink} onClick={closeMobileMenu}>
                Log in
              </Link>
              <Link href="/signup" onClick={closeMobileMenu}>
                <Button variant="outline" className={styles.signUpButton}>
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

