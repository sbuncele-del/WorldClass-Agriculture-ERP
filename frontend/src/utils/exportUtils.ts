/**
 * Export Utilities for WorldClass ERP
 * Provides CSV and PDF export functionality for all modules
 */

import { message } from 'antd';

export interface ExportColumn {
  header: string;
  key: string;
  formatter?: (value: any) => string;
}

/**
 * Export data to CSV file
 */
export const exportToCSV = (
  data: any[],
  columns: ExportColumn[],
  filename: string
): void => {
  try {
    if (!data || data.length === 0) {
      message.warning('No data to export');
      return;
    }

    // Create header row
    const headers = columns.map(col => `"${col.header}"`).join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return columns.map(col => {
        const value = item[col.key];
        const formatted = col.formatter ? col.formatter(value) : value;
        // Escape quotes and wrap in quotes
        const escaped = String(formatted ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    message.success(`Exported ${filename} successfully!`);
  } catch (err) {
    console.error('Export failed:', err);
    message.error('Failed to export data');
  }
};

/**
 * Export simple key-value summary to CSV
 */
export const exportSummaryToCSV = (
  data: Record<string, any>,
  filename: string
): void => {
  try {
    let csvContent = 'Metric,Value\n';
    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      csvContent += `"${formattedKey}","${value}"\n`;
    });
    
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    message.success(`Exported ${filename} successfully!`);
  } catch (err) {
    console.error('Export failed:', err);
    message.error('Failed to export data');
  }
};

/**
 * Generic table export - extracts visible columns and data
 */
export const exportTableData = (
  data: any[],
  moduleName: string,
  customColumns?: ExportColumn[]
): void => {
  if (!data || data.length === 0) {
    message.warning('No data available to export');
    return;
  }

  const now = new Date().toISOString().split('T')[0];
  const filename = `${moduleName.toLowerCase().replace(/\s+/g, '-')}-${now}.csv`;

  // If custom columns provided, use them
  if (customColumns) {
    exportToCSV(data, customColumns, filename);
    return;
  }

  // Auto-detect columns from first item
  const firstItem = data[0];
  const columns: ExportColumn[] = Object.keys(firstItem)
    .filter(key => !key.startsWith('_') && key !== 'key') // Skip internal keys
    .map(key => ({
      header: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      key,
      formatter: (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      }
    }));

  exportToCSV(data, columns, filename);
};

/**
 * Download file helper
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format currency for export
 */
export const formatCurrencyForExport = (value: number): string => {
  return `R ${(value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
};

/**
 * Format date for export
 */
export const formatDateForExport = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-ZA');
};

/**
 * Format percentage for export
 */
export const formatPercentForExport = (value: number): string => {
  return `${(value || 0).toFixed(2)}%`;
};

export default {
  exportToCSV,
  exportSummaryToCSV,
  exportTableData,
  formatCurrencyForExport,
  formatDateForExport,
  formatPercentForExport,
};
