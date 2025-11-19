'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { marketingStatisticsApi, MarketingStatistic, ApiError } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './page.module.scss';

export default function ProductPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [products, setProducts] = useState<MarketingStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYearByProduct, setSelectedYearByProduct] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketingStatisticsApi.getMarketingStatistics();
      setProducts(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Group products by productName to combine duplicate products with aggregated data
  const uniqueProducts = useMemo(() => {
    const productMap = new Map<string, MarketingStatistic & { productIds: string[]; years: Set<string> }>();
    
    products.forEach((product) => {
      const productName = product.productName.trim();
      const existing = productMap.get(productName);
      
      // Extract year from date (format: YYYY-MM-DD)
      const year = product.date ? product.date.split('-')[0] : null;
      
      if (!existing) {
        // First occurrence of this product name
        const yearsSet = new Set<string>();
        if (year) yearsSet.add(year);
        
        productMap.set(productName, {
          ...product,
          productIds: [product.productId],
          years: yearsSet,
        });
      } else {
        // Aggregate stock data for products with the same name
        existing.totalStock += product.totalStock;
        existing.availableStock += product.availableStock;
        existing.soldQuantity += product.soldQuantity;
        
        // Track all product IDs for this product name
        if (!existing.productIds.includes(product.productId)) {
          existing.productIds.push(product.productId);
        }
        
        // Add year to the set
        if (year) {
          existing.years.add(year);
        }
      }
    });
    
    // Convert to array and use the first productId as the display ID
    return Array.from(productMap.values()).map((product) => ({
      ...product,
      productId: product.productIds[0], // Use first productId for display
      years: Array.from(product.years).sort((a, b) => b.localeCompare(a)), // Sort years descending
    }));
  }, [products]);

  // Get filtered product data based on selected year
  const getProductDataForYear = (productName: string, year: string | null) => {
    if (!year) {
      // Return aggregated data for all years
      const product = uniqueProducts.find((p) => p.productName.trim() === productName);
      return product || null;
    }
    
    // Filter products by year for this specific product name
    const filteredProducts = products.filter(
      (p) => p.productName.trim() === productName && p.date && p.date.split('-')[0] === year
    );
    
    if (filteredProducts.length === 0) return null;
    
    // Aggregate the filtered products
    const aggregated = filteredProducts.reduce(
      (acc, product) => ({
        ...acc,
        totalStock: acc.totalStock + product.totalStock,
        availableStock: acc.availableStock + product.availableStock,
        soldQuantity: acc.soldQuantity + product.soldQuantity,
      }),
      {
        ...filteredProducts[0],
        totalStock: 0,
        availableStock: 0,
        soldQuantity: 0,
      }
    );
    
    return aggregated;
  };

  const handleYearClick = (productName: string, year: string) => {
    setSelectedYearByProduct((prev) => {
      // Toggle: if same year is clicked, deselect it
      if (prev[productName] === year) {
        const newState = { ...prev };
        delete newState[productName];
        return newState;
      }
      // Otherwise, select the new year
      return { ...prev, [productName]: year };
    });
  };

  // Calculate overall statistics
  const statistics = useMemo(() => {
    return uniqueProducts.reduce(
      (acc, product) => ({
        totalProducts: acc.totalProducts + 1,
        totalStock: acc.totalStock + product.totalStock,
        availableStock: acc.availableStock + product.availableStock,
        soldQuantity: acc.soldQuantity + product.soldQuantity,
      }),
      { totalProducts: 0, totalStock: 0, availableStock: 0, soldQuantity: 0 }
    );
  }, [uniqueProducts]);

  if (isLoading || loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
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
          <h1 className={styles.heroTitle}>Products</h1>
          <p className={styles.heroSubtitle}>
            Browse all products currently in inventory
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

        <div className={styles.statisticsSection}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Products</div>
            <div className={styles.statValue}>{statistics.totalProducts}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Stock</div>
            <div className={styles.statValue}>{statistics.totalStock.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Available Stock</div>
            <div className={styles.statValue}>{statistics.availableStock.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Sold Quantity</div>
            <div className={styles.statValue}>{statistics.soldQuantity.toLocaleString()}</div>
          </div>
        </div>

        {uniqueProducts.length === 0 ? (
          <div className={styles.emptyContainer}>
            <svg
              className={styles.emptyIcon}
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <p className={styles.emptyText}>No products found in inventory</p>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {uniqueProducts.map((product) => {
              const productName = product.productName.trim();
              const selectedYear = selectedYearByProduct[productName] || null;
              const displayProduct = getProductDataForYear(productName, selectedYear) || product;
              
              const stockPercentage = displayProduct.totalStock > 0
                ? ((displayProduct.availableStock / displayProduct.totalStock) * 100).toFixed(1)
                : '0';
              const isLowStock = displayProduct.availableStock < displayProduct.totalStock * 0.2;

              return (
                <div key={product.productName} className={styles.productCard}>
                  <h3 className={styles.productName}>{product.productName}</h3>
                  
                  {((product.years && product.years.length > 0) || isLowStock) && (
                    <div className={styles.productYears}>
                      {(product.years && product.years.length > 0) ? (
                        <div className={styles.yearsContent}>
                          <span className={styles.yearsLabel}>Years:</span>
                          <div className={styles.yearsList}>
                            {product.years.map((year) => {
                              const isSelected = selectedYear === year;
                              return (
                                <button
                                  key={year}
                                  type="button"
                                  className={`${styles.yearBadge} ${isSelected ? styles.yearBadgeSelected : ''}`}
                                  onClick={() => handleYearClick(productName, year)}
                                  aria-label={`Filter by year ${year}`}
                                  aria-pressed={isSelected}
                                >
                                  {year}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.yearsContent}></div>
                      )}
                      {isLowStock && (
                        <span className={styles.lowStockBadge}>Low Stock</span>
                      )}
                    </div>
                  )}
                  
                  {selectedYear && (
                    <div className={styles.selectedYearIndicator}>
                      Showing data for <strong>{selectedYear}</strong>
                    </div>
                  )}
                  
                  <div className={styles.productStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statItemLabel}>Total Stock</span>
                      <span className={styles.statItemValue}>{displayProduct.totalStock.toLocaleString()}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statItemLabel}>Available</span>
                      <span className={styles.statItemValue}>{displayProduct.availableStock.toLocaleString()}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statItemLabel}>Sold</span>
                      <span className={styles.statItemValue}>{displayProduct.soldQuantity.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={styles.stockBarContainer}>
                    <div className={styles.stockBarLabel}>
                      <span>Stock Level</span>
                      <span className={styles.stockPercentage}>{stockPercentage}%</span>
                    </div>
                    <div className={styles.stockBar}>
                      <div
                        className={`${styles.stockBarFill} ${isLowStock ? styles.lowStock : ''}`}
                        style={{ width: `${stockPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

