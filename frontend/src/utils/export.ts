/**
 * Export utilities for CSV/Excel download
 */

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any, row: any) => string;
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Build header row
  const headers = columns.map(col => `"${col.header}"`).join(',');

  // Build data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      
      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value, row);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '""';
      }
      
      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  // Combine into CSV content
  const csvContent = [headers, ...rows].join('\n');

  // Create blob and trigger download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-ZA');
}

/**
 * Format currency for export
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R 0.00';
  return `R ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format number for export
 */
export function formatNumber(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined) return '0';
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
