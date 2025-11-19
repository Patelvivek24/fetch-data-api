'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Table, { TableColumn } from '@/components/Table';
import Modal from '@/components/Modal';
import InputField from '@/components/InputField';
import Select from '@/components/Select';
import { marketingStatisticsApi, MarketingStatistic, ApiError, customersApi, Customer } from '@/lib/api';
import ProductInventoryChart from '@/components/ProductInventoryChart';
import styles from './page.module.scss';

export default function DataPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [marketingData, setMarketingData] = useState<MarketingStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketingStatistic | null>(null);
  const [deletingItem, setDeletingItem] = useState<MarketingStatistic | null>(null);
  const [formData, setFormData] = useState<Omit<MarketingStatistic, 'id'>>({
    productId: '',
    productName: '',
    totalStock: 0,
    availableStock: 0,
    soldQuantity: 0,
    date: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownProduct, setBreakdownProduct] = useState<MarketingStatistic | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMarketingData();
      fetchCustomers();
    }
  }, [isAuthenticated]);

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchMarketingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketingStatisticsApi.getMarketingStatistics();
      setMarketingData(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to fetch marketing statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      productId: '',
      productName: '',
      totalStock: 0,
      availableStock: 0,
      soldQuantity: 0,
      date: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (item: MarketingStatistic) => {
    setEditingItem(item);
    // Recalculate soldQuantity based on totalStock and availableStock
    const calculatedSoldQuantity = Math.max(0, item.totalStock - item.availableStock);
    setFormData({
      productId: item.productId,
      productName: item.productName,
      totalStock: item.totalStock,
      availableStock: item.availableStock,
      soldQuantity: calculatedSoldQuantity,
      date: item.date,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (item: MarketingStatistic) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleViewBreakdown = (item: MarketingStatistic) => {
    setBreakdownProduct(item);
    setIsBreakdownModalOpen(true);
  };

  const getPurchaseBreakdown = (productId: string) => {
    const breakdown: Array<{ customerName: string; quantity: number; purchaseDate: string }> = [];
    
    customers.forEach(customer => {
      if (customer.purchases && customer.purchases.length > 0) {
        customer.purchases.forEach(purchase => {
          if (purchase.productId === productId) {
            breakdown.push({
              customerName: customer.name,
              quantity: purchase.quantity,
              purchaseDate: purchase.purchaseDate,
            });
          }
        });
      }
    });

    return breakdown.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  };

  const syncSoldQuantities = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Calculate sold quantities from customer purchases for each product
      const updates: Array<{ item: MarketingStatistic; soldQuantity: number; availableStock: number }> = [];

      marketingData.forEach((item) => {
        const breakdown = getPurchaseBreakdown(item.productId);
        const calculatedSoldQuantity = breakdown.reduce((sum, purchase) => sum + purchase.quantity, 0);
        
        // Calculate new availableStock: totalStock - soldQuantity
        const newAvailableStock = Math.max(0, item.totalStock - calculatedSoldQuantity);
        
        updates.push({
          item,
          soldQuantity: calculatedSoldQuantity,
          availableStock: newAvailableStock,
        });
      });

      // Update all items
      await Promise.all(
        updates.map((update) =>
          marketingStatisticsApi.updateMarketingStatistic(update.item.id, {
            productId: update.item.productId,
            productName: update.item.productName,
            totalStock: update.item.totalStock,
            availableStock: update.availableStock,
            soldQuantity: update.soldQuantity,
            date: update.item.date,
          })
        )
      );

      // Refresh the data
      await fetchMarketingData();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to sync sold quantities');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem || !deletingItem.id) return;

    try {
      setSubmitting(true);
      await marketingStatisticsApi.deleteMarketingStatistic(deletingItem.id);
      await fetchMarketingData();
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete marketing statistic');
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.productId.trim()) {
      errors.productId = 'Product ID is required';
    }
    if (!formData.productName.trim()) {
      errors.productName = 'Product Name is required';
    }
    if (formData.totalStock < 0) {
      errors.totalStock = 'Total Stock must be a positive number';
    }
    if (formData.availableStock < 0) {
      errors.availableStock = 'Available Stock must be a positive number';
    }
    if (formData.soldQuantity < 0) {
      errors.soldQuantity = 'Sold Quantity must be a positive number';
    }
    if (formData.availableStock > formData.totalStock) {
      errors.availableStock = 'Available Stock cannot exceed Total Stock';
    }
    if (formData.soldQuantity + formData.availableStock > formData.totalStock) {
      errors.soldQuantity = 'Sold Quantity + Available Stock cannot exceed Total Stock';
    }
    if (!formData.date) {
      errors.date = 'Date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingItem && editingItem.id) {
        await marketingStatisticsApi.updateMarketingStatistic(editingItem.id, formData);
      } else {
        await marketingStatisticsApi.createMarketingStatistic(formData);
      }

      await fetchMarketingData();
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        productId: '',
        productName: '',
        totalStock: 0,
        availableStock: 0,
        soldQuantity: 0,
        date: '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to save marketing statistic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // Auto-calculate soldQuantity when totalStock or availableStock changes
      if (field === 'totalStock' || field === 'availableStock') {
        const totalStock = field === 'totalStock' 
          ? (typeof value === 'number' ? value : parseInt(String(value)) || 0) 
          : (typeof prev.totalStock === 'number' ? prev.totalStock : parseInt(String(prev.totalStock)) || 0);
        const availableStock = field === 'availableStock' 
          ? (typeof value === 'number' ? value : parseInt(String(value)) || 0) 
          : (typeof prev.availableStock === 'number' ? prev.availableStock : parseInt(String(prev.availableStock)) || 0);
        
        // Calculate soldQuantity: Total Stock - Available Stock
        updated.soldQuantity = Math.max(0, totalStock - availableStock);
      }
      
      return updated;
    });
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear soldQuantity error when totalStock or availableStock changes
    if ((field === 'totalStock' || field === 'availableStock') && formErrors.soldQuantity) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.soldQuantity;
        return newErrors;
      });
    }
  };

  const columns: TableColumn<MarketingStatistic>[] = [
    {
      key: 'productId',
      header: 'Product ID',
      width: '11%',
    },
    {
      key: 'productName',
      header: 'Product Name',
      width: '22%',
    },
    {
      key: 'totalStock',
      header: 'Total Stock',
      align: 'right',
      width: '12%',
      render: (value) => (value as number).toLocaleString(),
    },
    {
      key: 'availableStock',
      header: 'Available Stock',
      align: 'right',
      width: '14%',
      render: (value) => (value as number).toLocaleString(),
    },
    {
      key: 'soldQuantity',
      header: 'Sold Quantity',
      align: 'right',
      width: '12%',
      render: (value) => (value as number).toLocaleString(),
    },
    {
      key: 'date',
      header: 'Date',
      width: '11%',
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '12%',
      render: (_, row) => {
        const rowData = row as MarketingStatistic;
        return (
          <div className={styles.actionButtons}>
            <button
              className={styles.editButton}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(rowData);
              }}
              aria-label={`Edit ${rowData.productName}`}
              title="Edit"
            >
              <svg
                width="14"
                height="14"
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
                handleDelete(rowData);
              }}
              aria-label={`Delete ${rowData.productName}`}
              title="Delete"
            >
              <svg
                width="14"
                height="14"
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
        );
      },
    },
  ];

  // Extract unique years and product names from data
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    marketingData.forEach((item) => {
      if (item.date) {
        const year = item.date.split('-')[0];
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [marketingData]);

  const uniqueProductNames = useMemo(() => {
    const productNames = new Set<string>();
    marketingData.forEach((item) => {
      if (item.productName) {
        productNames.add(item.productName);
      }
    });
    return Array.from(productNames).sort();
  }, [marketingData]);

  // Filter data based on selected year and product name
  const filteredData = useMemo(() => {
    return marketingData.filter((item) => {
      const yearMatch = !selectedYear || (item.date && item.date.split('-')[0] === selectedYear);
      const productMatch = !selectedProductName || item.productName === selectedProductName;
      return yearMatch && productMatch;
    });
  }, [marketingData, selectedYear, selectedProductName]);

  // Calculate totals from filtered data
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        totalStock: acc.totalStock + item.totalStock,
        availableStock: acc.availableStock + item.availableStock,
        soldQuantity: acc.soldQuantity + item.soldQuantity,
      }),
      { totalStock: 0, availableStock: 0, soldQuantity: 0 }
    );
  }, [filteredData]);

  const totalProducts = filteredData.length;
  const stockUtilization = totals.totalStock > 0 
    ? ((totals.soldQuantity / totals.totalStock) * 100).toFixed(1) 
    : '0.0';

  if (isLoading || loading) {
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
      <Header />

      <main className={styles.main}>
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>Product Inventory</h2>
          <p className={styles.heroSubtitle}>
            Comprehensive overview of product stock and sales metrics
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={() => setError(null)} className={styles.errorClose}>
              ×
            </button>
          </div>
        )}

        <div className={styles.filtersSection}>
          <div className={styles.filtersContainer}>
            <Select
              label="Filter by Year"
              options={[
                { value: '', label: 'All Years' },
                ...uniqueYears.map((year) => ({ value: year, label: year })),
              ]}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="Select Year"
            />
            <Select
              label="Filter by Product Name"
              options={[
                { value: '', label: 'All Products' },
                ...uniqueProductNames.map((name) => ({ value: name, label: name })),
              ]}
              value={selectedProductName}
              onChange={(e) => setSelectedProductName(e.target.value)}
              placeholder="Select Product"
            />
            {(selectedYear || selectedProductName) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedYear('');
                  setSelectedProductName('');
                }}
                className={styles.clearFiltersButton}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Products</div>
            <div className={styles.summaryValue}>{totalProducts}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Stock</div>
            <div className={styles.summaryValue}>{totals.totalStock.toLocaleString()}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Available Stock</div>
            <div className={styles.summaryValue}>{totals.availableStock.toLocaleString()}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Sold Quantity</div>
            <div className={styles.summaryValue}>{totals.soldQuantity.toLocaleString()}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Stock Utilization</div>
            <div className={styles.summaryValue}>{stockUtilization}%</div>
          </div>
        </div>

        <div className={styles.chartSection}>
          <ProductInventoryChart data={filteredData} />
        </div>

        <div className={styles.tableSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Product Inventory Details</h3>
              <div className={styles.cardHeaderActions}>
                <Button onClick={syncSoldQuantities} variant="outline" title="Sync sold quantities from customer purchases">
                  Sync Sold Qty
                </Button>
                <Button onClick={handleAddNew} variant="primary">
                  Add New Record
                </Button>
              </div>
            </div>
            <Table
              columns={columns as unknown as TableColumn<Record<string, unknown>>[]}
              data={filteredData as unknown as Record<string, unknown>[]}
              pagination={true}
              itemsPerPage={5}
              striped={true}
              hoverable={true}
            />
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setFormErrors({});
        }}
        title={editingItem ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <InputField
              label="Product ID"
              value={formData.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              error={formErrors.productId}
              required
            />
            <InputField
              label="Product Name"
              value={formData.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              error={formErrors.productName}
              required
            />
            <InputField
              label="Total Stock"
              type="number"
              value={formData.totalStock}
              onChange={(e) => handleInputChange('totalStock', parseInt(e.target.value) || 0)}
              error={formErrors.totalStock}
              required
              min="0"
            />
            <InputField
              label="Available Stock"
              type="number"
              value={formData.availableStock}
              onChange={(e) => handleInputChange('availableStock', parseInt(e.target.value) || 0)}
              error={formErrors.availableStock}
              required
              min="0"
            />
            <InputField
              label="Sold Quantity (Auto-calculated)"
              type="number"
              value={formData.soldQuantity}
              onChange={(e) => handleInputChange('soldQuantity', parseInt(e.target.value) || 0)}
              error={formErrors.soldQuantity}
              required
              min="0"
              readOnly
              title="This value is automatically calculated from Total Stock - Available Stock"
            />
            <InputField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              error={formErrors.date}
              required
            />
          </div>
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
                setFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        title="Delete Product"
      >
        <div className={styles.deleteModalContent}>
          <p>
            Are you sure you want to delete the product &quot;{deletingItem?.productName}&quot;? This
            action cannot be undone.
          </p>
          <div className={styles.deleteModalActions}>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmDelete} isLoading={submitting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Purchase Breakdown Modal */}
      <Modal
        isOpen={isBreakdownModalOpen}
        onClose={() => {
          setIsBreakdownModalOpen(false);
          setBreakdownProduct(null);
        }}
        title={breakdownProduct ? `Purchase Breakdown: ${breakdownProduct.productName}` : 'Purchase Breakdown'}
      >
        {breakdownProduct && (
          <div className={styles.breakdownContent}>
            <div className={styles.breakdownSummary}>
              <div className={styles.breakdownSummaryItem}>
                <span className={styles.breakdownLabel}>Total Sold Quantity:</span>
                <span className={styles.breakdownValue}>{breakdownProduct.soldQuantity.toLocaleString()}</span>
              </div>
              <div className={styles.breakdownSummaryItem}>
                <span className={styles.breakdownLabel}>Product ID:</span>
                <span className={styles.breakdownValue}>{breakdownProduct.productId}</span>
              </div>
            </div>
            
            {breakdownProduct.soldQuantity > 0 ? (
              <>
                <h4 className={styles.breakdownTitle}>Customer Purchases:</h4>
                <div className={styles.breakdownList}>
                  {getPurchaseBreakdown(breakdownProduct.productId).map((item, index) => (
                    <div key={index} className={styles.breakdownItem}>
                      <div className={styles.breakdownItemInfo}>
                        <span className={styles.breakdownCustomerName}>{item.customerName}</span>
                        <span className={styles.breakdownDate}>
                          {new Date(item.purchaseDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className={styles.breakdownQuantity}>
                        <strong>Qty: {item.quantity}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.breakdownTotal}>
                  <strong>Total: {getPurchaseBreakdown(breakdownProduct.productId).reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} units</strong>
                </div>
              </>
            ) : (
              <div className={styles.breakdownEmpty}>
                <p>No customer purchases found for this product.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
