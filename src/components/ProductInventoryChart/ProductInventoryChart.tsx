'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MarketingStatistic } from '@/lib/api';
import styles from './ProductInventoryChart.module.scss';

interface ProductInventoryChartProps {
  data: MarketingStatistic[];
}

export default function ProductInventoryChart({ data }: ProductInventoryChartProps) {
  // Group data by year
  const dataByYear = data.reduce((acc, item) => {
    // Extract year from date (format: YYYY-MM-DD)
    const year = item.date ? item.date.split('-')[0] : 'Unknown';
    
    if (!acc[year]) {
      acc[year] = {
        year,
        totalStock: 0,
        availableStock: 0,
        soldQuantity: 0,
      };
    }
    
    acc[year].totalStock += item.totalStock;
    acc[year].availableStock += item.availableStock;
    acc[year].soldQuantity += item.soldQuantity;
    
    return acc;
  }, {} as Record<string, { year: string; totalStock: number; availableStock: number; soldQuantity: number }>);

  // Transform data for the chart, sorted by year
  const chartData = Object.values(dataByYear)
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((item) => {
      return {
        name: item.year,
        totalStock: item.totalStock,
        availableStock: item.availableStock,
        soldQuantity: item.soldQuantity,
      };
    });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>Year: {data.name}</p>
          <p className={styles.tooltipItem}>
            <span className={styles.tooltipLabel}>Total Stock:</span>
            <span>{data.totalStock.toLocaleString()}</span>
          </p>
          <p className={styles.tooltipItem}>
            <span className={styles.tooltipLabel}>Available Stock:</span>
            <span>{data.availableStock.toLocaleString()}</span>
          </p>
          <p className={styles.tooltipItem}>
            <span className={styles.tooltipLabel}>Sold Quantity:</span>
            <span>{data.soldQuantity.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Product Inventory Overview</h3>
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Year', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Quantity', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#60A5FA"
            tick={{ fill: '#60A5FA', fontSize: 12 }}
            label={{ value: 'Sold Quantity', angle: 90, position: 'insideRight', fill: '#60A5FA' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: '#9CA3AF', paddingTop: '20px' }}
            iconType="rect"
            verticalAlign="bottom"
            align="center"
          />
          <Bar 
            yAxisId="left"
            dataKey="totalStock" 
            fill="#3B82F6" 
            name="Total Stock"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="left"
            dataKey="availableStock" 
            fill="#10B981" 
            name="Available Stock"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="left"
            dataKey="soldQuantity" 
            fill="#F59E0B" 
            name="Sold Quantity"
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="soldQuantity" 
            stroke="#60A5FA" 
            strokeWidth={3}
            name="Sold Quantity (Line)"
            dot={{ fill: '#60A5FA', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

