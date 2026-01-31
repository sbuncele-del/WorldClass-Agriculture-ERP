import React from 'react';
import GlassCard from './GlassCard';
import './DataTable.css';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title?: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  emptyMessage?: string;
  actions?: React.ReactNode;
  maxHeight?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  subtitle,
  columns,
  data,
  emptyMessage = 'No data available',
  actions,
  maxHeight
}) => {
  return (
    <GlassCard padding="lg">
      {(title || actions) && (
        <div className="dt-header">
          <div className="dt-header-left">
            {title && <h3 className="dt-title">{title}</h3>}
            {subtitle && <p className="dt-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="dt-header-actions">{actions}</div>}
        </div>
      )}

      <div className="dt-container" style={{ maxHeight }}>
        <table className="dt-table">
          <thead className="dt-thead">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`dt-th dt-align-${column.align || 'left'}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="dt-tbody">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="dt-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="dt-row">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`dt-td dt-align-${column.align || 'left'}`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

export default DataTable;
