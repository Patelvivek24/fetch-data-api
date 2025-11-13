'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Table, { TableColumn } from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { tableApi, TableDataItem } from '@/lib/api';
import styles from './page.module.scss';

export default function Home() {
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

  // State for table data
  const [tableData, setTableData] = useState<TableDataItem[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  // Fetch table data from API
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setIsTableLoading(true);
        setTableError(null);
        const data = await tableApi.getTableData();
        // Add id to each item if not present (for React keys)
        const dataWithIds = data.map((item, index) => ({
          ...item,
          id: item.id || index + 1,
        }));
        setTableData(dataWithIds);
      } catch (error) {
        if (error instanceof Error) {
          setTableError(error.message || 'Failed to load table data');
        } else {
          setTableError('Failed to load table data');
        }
        setTableData([]);
      } finally {
        setIsTableLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTableData();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await tableApi.deleteTableItem(id);
        // Refresh table data after deletion
        const data = await tableApi.getTableData();
        const dataWithIds = data.map((item, index) => ({
          ...item,
          id: item.id || index + 1,
        }));
        setTableData(dataWithIds);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Failed to delete item: ${error.message}`);
        } else {
          alert('Failed to delete item');
        }
      }
    }
  };

  const handleEdit = (item: TableDataItem) => {
    // For now, just show an alert. You can implement a modal or form later
    alert(`Edit functionality for ${item.name} - To be implemented`);
    // TODO: Implement edit modal/form
  };

  const tableColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: '20%',
      },
      {
        key: 'email',
        header: 'Email',
        width: '25%',
      },
      {
        key: 'role',
        header: 'Role',
        width: '12%',
        render: (value: string) => (
          <span className={styles.badge}>{value}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '12%',
        render: (value: string) => {
          const statusClass =
            value === 'Active'
              ? styles.active
              : value === 'Pending'
                ? styles.pending
                : styles.inactive;
          return (
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {value}
            </span>
          );
        },
      },
      {
        key: 'joinDate',
        header: 'Join Date',
        width: '12%',
        render: (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '19%',
        align: 'center',
        render: (_value: unknown, row: TableDataItem) => (
          <div className={styles.actionButtons}>
            <button
              className={styles.editButton}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              aria-label={`Edit ${row.name}`}
              title="Edit"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                if (row.id) {
                  handleDelete(row.id);
                }
              }}
              aria-label={`Delete ${row.name}`}
              title="Delete"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    []
  );

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
          <h1 className={styles.logo}>Your App</h1>
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
          <h2 className={styles.heroTitle}>Welcome to Your Home Page</h2>
          <p className={styles.heroSubtitle}>
            You have successfully signed in. This is your home page where you can build out your application.
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
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Quick Actions</h3>
            <p className={styles.description}>
              Your authentication is working correctly! You can now build out your home page with additional features and content.
            </p>
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Users Table</h3>
            {isTableLoading ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p>Loading table data...</p>
              </div>
            ) : tableError ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{tableError}</p>
                <Button
                  onClick={() => {
                    setTableError(null);
                    setIsTableLoading(true);
                    tableApi.getTableData()
                      .then((data) => {
                        const dataWithIds = data.map((item, index) => ({
                          ...item,
                          id: item.id || index + 1,
                        }));
                        setTableData(dataWithIds);
                        setIsTableLoading(false);
                      })
                      .catch((error: unknown) => {
                        if (error instanceof Error) {
                          setTableError(error.message);
                        } else {
                          setTableError('Failed to load table data');
                        }
                        setIsTableLoading(false);
                      });
                  }}
                  variant="primary"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Table
                columns={tableColumns}
                data={tableData}
                striped={true}
                hoverable={true}
                pagination={true}
                itemsPerPage={5}
                showPageInfo={true}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
