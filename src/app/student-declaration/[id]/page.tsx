'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { studentDeclarationApi, StudentDeclarationFormData } from '@/lib/api';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './page.module.scss';

export default function StudentDeclarationPDFView() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [declaration, setDeclaration] = useState<StudentDeclarationFormData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id as string;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchDeclaration = async () => {
      if (!id) return;

      try {
        setIsLoadingData(true);
        setError(null);
        const declarations = await studentDeclarationApi.getStudentDeclarationForms();
        const found = declarations.find(d => String(d.id) === String(id));
        
        if (!found) {
          setError('Student declaration not found');
          return;
        }
        
        setDeclaration(found);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to load student declaration');
        } else {
          setError('Failed to load student declaration');
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAuthenticated && id) {
      fetchDeclaration();
    }
  }, [id, isAuthenticated]);

  const handleBack = () => {
    router.push('/');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || isLoadingData) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p>Loading student declaration...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <Button onClick={handleBack} variant="primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Student declaration not found</p>
          <Button onClick={handleBack} variant="primary">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { membershipNumber, primaryMemberDetails } = declaration;
  const { name, address, birthDate, email, phone } = primaryMemberDetails;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Student Declaration</h1>
          <div className={styles.headerActions}>
            <Button onClick={handlePrint} variant="outline">
              Print
            </Button>
            <Button onClick={handleBack} variant="primary">
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.pdfContainer}>
        <div className={styles.pdfContent}>
          <div className={styles.pdfHeader}>
            <h2 className={styles.pdfTitle}>Student Declaration Form</h2>
            <div className={styles.membershipNumber}>
              <span className={styles.membershipLabel}>Membership Number:</span>
              <span className={styles.membershipValue}>{membershipNumber}</span>
            </div>
          </div>

          <div className={styles.pdfBody}>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Title:</span>
                  <span className={styles.infoValue}>{name.title}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>First Name:</span>
                  <span className={styles.infoValue}>{name.firstName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Last Name:</span>
                  <span className={styles.infoValue}>{name.lastName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Full Name:</span>
                  <span className={styles.infoValue}>
                    {name.title} {name.firstName} {name.lastName}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Birth Date:</span>
                  <span className={styles.infoValue}>{birthDate}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{email}</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Address</h3>
              <div className={styles.addressGrid}>
                <div className={styles.addressRow}>
                  <span className={styles.infoLabel}>Street Address:</span>
                  <span className={styles.infoValue}>{address.streetAddress}</span>
                </div>
                <div className={styles.addressRow}>
                  <span className={styles.infoLabel}>City:</span>
                  <span className={styles.infoValue}>{address.city}</span>
                </div>
                <div className={styles.addressRow}>
                  <span className={styles.infoLabel}>State:</span>
                  <span className={styles.infoValue}>{address.state}</span>
                </div>
                <div className={styles.addressRow}>
                  <span className={styles.infoLabel}>Postal Code:</span>
                  <span className={styles.infoValue}>{address.postalCode}</span>
                </div>
              </div>
              <div className={styles.fullAddress}>
                <span className={styles.infoLabel}>Full Address:</span>
                <span className={styles.infoValue}>
                  {address.streetAddress}, {address.city}, {address.state} {address.postalCode}
                </span>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.phoneSection}>
                {phone.homePhone && (
                  <div className={styles.phoneRow}>
                    <span className={styles.infoLabel}>Home Phone:</span>
                    <span className={styles.infoValue}>{phone.homePhone}</span>
                  </div>
                )}
                {phone.workPhone && (
                  <div className={styles.phoneRow}>
                    <span className={styles.infoLabel}>Work Phone:</span>
                    <span className={styles.infoValue}>{phone.workPhone}</span>
                  </div>
                )}
                {phone.mobile && (
                  <div className={styles.phoneRow}>
                    <span className={styles.infoLabel}>Mobile:</span>
                    <span className={styles.infoValue}>{phone.mobile}</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className={styles.pdfFooter}>
            <div className={styles.footerNote}>
              <p>This is an official student declaration document.</p>
              <p>Generated on: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

