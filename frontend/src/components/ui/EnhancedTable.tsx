/**
 * Enhanced Data Table Component
 * Feature-rich table with column resizing, export, saved views
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Dropdown,
  Tooltip,
  Checkbox,
  Divider,
  Modal,
  Form,
  Tag,
  Typography,
} from 'antd';
import type { TableProps, ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  DownloadOutlined,
  SettingOutlined,
  FilterOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  ColumnHeightOutlined,
  SaveOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface EnhancedTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: ColumnsType<T>;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  refreshable?: boolean;
  onRefresh?: () => void;
  title?: string;
  showColumnToggle?: boolean;
  showDensityToggle?: boolean;
  defaultDensity?: 'small' | 'middle' | 'large';
}

export function EnhancedTable<T extends object>({
  columns,
  dataSource,
  searchable = true,
  searchPlaceholder = 'Search...',
  exportable = true,
  onExport,
  refreshable = true,
  onRefresh,
  title,
  showColumnToggle = true,
  showDensityToggle = true,
  defaultDensity = 'middle',
  ...restProps
}: EnhancedTableProps<T>) {
  const [searchText, setSearchText] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((col) => (col as { key?: string }).key || '').filter(Boolean)
  );
  const [density, setDensity] = useState<'small' | 'middle' | 'large'>(defaultDensity);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter columns based on visibility
  const displayColumns = useMemo(() => {
    return columns.filter((col) => {
      const key = (col as { key?: string }).key;
      return !key || visibleColumns.includes(key);
    });
  }, [columns, visibleColumns]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchText || !dataSource) return dataSource;
    
    const lowerSearch = searchText.toLowerCase();
    return dataSource.filter((record) => {
      return Object.values(record as object).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      });
    });
  }, [dataSource, searchText]);

  // Export menu items
  const exportMenuItems = [
    { key: 'csv', label: 'Export as CSV', icon: <DownloadOutlined /> },
    { key: 'excel', label: 'Export as Excel', icon: <DownloadOutlined /> },
    { key: 'pdf', label: 'Export as PDF', icon: <DownloadOutlined /> },
  ];

  // Column toggle menu
  const columnToggleContent = (
    <div style={{ padding: 8, minWidth: 200 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>Show/Hide Columns</Text>
      <Divider style={{ margin: '8px 0' }} />
      {columns.map((col) => {
        const key = (col as { key?: string }).key;
        const title = (col as { title?: React.ReactNode }).title;
        if (!key) return null;
        
        return (
          <div key={key} style={{ padding: '4px 0' }}>
            <Checkbox
              checked={visibleColumns.includes(key)}
              onChange={(e) => {
                if (e.target.checked) {
                  setVisibleColumns([...visibleColumns, key]);
                } else {
                  setVisibleColumns(visibleColumns.filter((k) => k !== key));
                }
              }}
            >
              {typeof title === 'string' ? title : key}
            </Checkbox>
          </div>
        );
      })}
    </div>
  );

  // Density toggle menu
  const densityMenuItems = [
    { key: 'small', label: 'Compact', icon: <ColumnHeightOutlined /> },
    { key: 'middle', label: 'Default', icon: <ColumnHeightOutlined /> },
    { key: 'large', label: 'Comfortable', icon: <ColumnHeightOutlined /> },
  ];

  const tableContent = (
    <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {title && <Text strong style={{ fontSize: 16 }}>{title}</Text>}
          {filteredData && (
            <Tag>{filteredData.length} records</Tag>
          )}
        </div>

        <Space wrap>
          {/* Search */}
          {searchable && (
            <Input
              prefix={<SearchOutlined />}
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          )}

          {/* Refresh */}
          {refreshable && onRefresh && (
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={onRefresh} />
            </Tooltip>
          )}

          {/* Column Toggle */}
          {showColumnToggle && (
            <Dropdown
              dropdownRender={() => columnToggleContent}
              trigger={['click']}
            >
              <Tooltip title="Show/Hide Columns">
                <Button icon={<SettingOutlined />} />
              </Tooltip>
            </Dropdown>
          )}

          {/* Density Toggle */}
          {showDensityToggle && (
            <Dropdown
              menu={{
                items: densityMenuItems,
                onClick: ({ key }) => setDensity(key as 'small' | 'middle' | 'large'),
                selectedKeys: [density],
              }}
              trigger={['click']}
            >
              <Tooltip title="Table Density">
                <Button icon={<ColumnHeightOutlined />} />
              </Tooltip>
            </Dropdown>
          )}

          {/* Export */}
          {exportable && (
            <Dropdown
              menu={{
                items: exportMenuItems,
                onClick: ({ key }) => onExport?.(key as 'csv' | 'excel' | 'pdf'),
              }}
              trigger={['click']}
            >
              <Button icon={<DownloadOutlined />}>Export</Button>
            </Dropdown>
          )}

          {/* Fullscreen */}
          <Tooltip title="Fullscreen">
            <Button
              icon={<FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={displayColumns}
        dataSource={filteredData}
        size={density}
        scroll={{ x: 'max-content' }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        {...restProps}
      />
    </div>
  );

  if (isFullscreen) {
    return (
      <Modal
        open={isFullscreen}
        onCancel={() => setIsFullscreen(false)}
        width="100%"
        style={{ top: 0, padding: 0, maxWidth: '100vw' }}
        styles={{ body: { padding: 0 } }}
        footer={null}
        closable
      >
        {tableContent}
      </Modal>
    );
  }

  return tableContent;
}

// Simple wrapper for backward compatibility
export const DataTable = EnhancedTable;

export default EnhancedTable;
