import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, ChevronsUpDown, 
  Search, Filter, Columns, Download,
  Eye, Edit, Trash2, MoreHorizontal 
} from 'lucide-react';
import './EnhancedDataTable.css';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
  avatar?: (row: T) => string | null;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  show?: (row: T) => boolean;
}

interface EnhancedDataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  keyField?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  stickyHeader?: boolean;
}

function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  keyField = 'id',
  searchable = true,
  searchPlaceholder = 'Search...',
  selectable = false,
  onSelectionChange,
  pageSize = 50,
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
  rowClassName,
  stickyHeader = true
}: EnhancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key))
  );

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row => {
      return columns.some(col => {
        if (!col.filterable && col.filterable !== undefined) return false;
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(row => row[keyField])));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowId: any, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
    
    if (onSelectionChange) {
      const selectedData = data.filter(row => newSelected.has(row[keyField]));
      onSelectionChange(selectedData);
    }
  };

  const allSelected = paginatedData.length > 0 && 
    paginatedData.every(row => selectedRows.has(row[keyField]));

  return (
    <div className="enhanced-table-container">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          {searchable && (
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          
          {selectedRows.size > 0 && (
            <div className="selection-indicator">
              {selectedRows.size} selected
              <button onClick={() => setSelectedRows(new Set())}>Clear</button>
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn" title="Filter">
            <Filter size={18} />
          </button>
          <button className="toolbar-btn" title="Columns">
            <Columns size={18} />
          </button>
          <button className="toolbar-btn" title="Export">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className={`enhanced-table ${stickyHeader ? 'sticky-header' : ''}`}>
          <thead>
            <tr>
              {selectable && (
                <th className="select-column">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              
              {columns.filter(col => visibleColumns.has(col.key)).map(column => (
                <th
                  key={column.key}
                  style={{ 
                    width: column.width,
                    textAlign: column.align || 'left'
                  }}
                  className={column.sortable !== false ? 'sortable' : ''}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="th-content">
                    <span>{column.label}</span>
                    {column.sortable !== false && (
                      <span className="sort-icon">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUp size={16} /> : 
                            <ChevronDown size={16} />
                        ) : (
                          <ChevronsUpDown size={16} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {actions && actions.length > 0 && (
                <th className="actions-column">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                  <div className="table-loading">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                  <div className="table-empty">
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row[keyField] || index}
                  className={`
                    ${selectedRows.has(row[keyField]) ? 'row-selected' : ''}
                    ${onRowClick ? 'row-clickable' : ''}
                    ${rowClassName ? rowClassName(row) : ''}
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="select-column" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row[keyField])}
                        onChange={(e) => handleSelectRow(row[keyField], e.target.checked)}
                      />
                    </td>
                  )}

                  {columns.filter(col => visibleColumns.has(col.key)).map(column => (
                    <td
                      key={column.key}
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {column.render ? (
                        column.render(row[column.key], row)
                      ) : (
                        <span>{row[column.key]}</span>
                      )}
                    </td>
                  ))}

                  {actions && actions.length > 0 && (
                    <td className="actions-column" onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions">
                        {actions
                          .filter(action => !action.show || action.show(row))
                          .slice(0, 2)
                          .map((action, i) => (
                            <button
                              key={i}
                              className={`action-btn action-${action.variant || 'secondary'}`}
                              onClick={() => action.onClick(row)}
                              title={action.label}
                            >
                              {action.icon || action.label}
                            </button>
                          ))}
                        {actions.length > 2 && (
                          <button className="action-btn action-secondary">
                            <MoreHorizontal size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? 'active' : ''}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedDataTable;
