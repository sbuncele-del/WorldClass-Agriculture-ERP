/**
 * Global Search Component
 * Search across all modules with quick filters
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Input,
  Dropdown,
  List,
  Tag,
  Space,
  Typography,
  Spin,
  Empty,
  Divider,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  InboxOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';

const { Text, Paragraph } = Typography;

// Search result types
type SearchCategory = 'customers' | 'invoices' | 'products' | 'orders' | 'employees' | 'all';

interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle?: string;
  url: string;
  icon?: React.ReactNode;
  tags?: string[];
}

// Mock search function - replace with actual API call
async function performSearch(query: string, category: SearchCategory): Promise<SearchResult[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!query.trim()) return [];

  // Mock results based on category
  const results: SearchResult[] = [
    {
      id: '1',
      type: 'customers',
      title: `Customer: ${query}`,
      subtitle: 'john@example.com • Active',
      url: '/sales/customers/1',
      icon: <UserOutlined />,
      tags: ['Premium'],
    },
    {
      id: '2',
      type: 'invoices',
      title: `Invoice INV-${query.toUpperCase()}`,
      subtitle: '$1,250.00 • Due Jan 15',
      url: '/sales/invoices/2',
      icon: <FileTextOutlined />,
      tags: ['Pending'],
    },
    {
      id: '3',
      type: 'products',
      title: `Product: ${query}`,
      subtitle: 'SKU-123 • 45 in stock',
      url: '/inventory/items/3',
      icon: <ShoppingOutlined />,
    },
    {
      id: '4',
      type: 'orders',
      title: `Order ORD-${query}`,
      subtitle: 'Processing • Expected Jan 20',
      url: '/purchasing/orders/4',
      icon: <InboxOutlined />,
    },
    {
      id: '5',
      type: 'employees',
      title: `Employee: ${query}`,
      subtitle: 'Engineering • Active',
      url: '/hr/employees/5',
      icon: <TeamOutlined />,
    },
  ];

  if (category === 'all') return results;
  return results.filter(r => r.type === category);
}

// Category icons
const categoryIcons: Record<SearchCategory, React.ReactNode> = {
  all: <SearchOutlined />,
  customers: <UserOutlined />,
  invoices: <FileTextOutlined />,
  products: <ShoppingOutlined />,
  orders: <InboxOutlined />,
  employees: <TeamOutlined />,
};

// Category colors
const categoryColors: Record<SearchCategory, string> = {
  all: 'default',
  customers: 'blue',
  invoices: 'green',
  products: 'orange',
  orders: 'purple',
  employees: 'cyan',
};

interface GlobalSearchProps {
  placeholder?: string;
  width?: number | string;
  showCategories?: boolean;
  onSearch?: (query: string, results: SearchResult[]) => void;
}

export function GlobalSearch({
  placeholder = 'Search everywhere...',
  width = 300,
  showCategories = true,
  onSearch,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const stored = localStorage.getItem('recent-searches');
    return stored ? JSON.parse(stored) : [];
  });
  const navigate = useNavigate();
  const inputRef = useRef<any>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Perform search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const searchResults = await performSearch(debouncedQuery, category);
        setResults(searchResults);
        onSearch?.(debouncedQuery, searchResults);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery, category, onSearch]);

  // Save to recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setOpen(false);
    setQuery('');
    navigate(result.url);
  };

  // Handle recent search click
  const handleRecentClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchCategory, SearchResult[]>);

  // Dropdown content
  const dropdownContent = (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
        maxHeight: 400,
        overflowY: 'auto',
        minWidth: 400,
      }}
    >
      {/* Category filters */}
      {showCategories && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <Space wrap>
            {(Object.keys(categoryIcons) as SearchCategory[]).map((cat) => (
              <Tag
                key={cat}
                icon={categoryIcons[cat]}
                color={category === cat ? categoryColors[cat] : 'default'}
                style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => setCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          {category === 'all' ? (
            // Grouped view
            Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <div style={{ padding: '8px 12px', background: '#fafafa' }}>
                  <Text type="secondary" strong style={{ fontSize: 12, textTransform: 'uppercase' }}>
                    {type}
                  </Text>
                </div>
                <List
                  dataSource={items}
                  renderItem={(item) => (
                    <List.Item
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                      onClick={() => handleResultClick(item)}
                    >
                      <List.Item.Meta
                        avatar={item.icon}
                        title={item.title}
                        description={item.subtitle}
                      />
                      <Space>
                        {item.tags?.map((tag) => (
                          <Tag key={tag} size="small">{tag}</Tag>
                        ))}
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            ))
          ) : (
            // Flat view
            <List
              dataSource={results}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                  onClick={() => handleResultClick(item)}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.title}
                    description={item.subtitle}
                  />
                  <Space>
                    {item.tags?.map((tag) => (
                      <Tag key={tag} size="small">{tag}</Tag>
                    ))}
                  </Space>
                </List.Item>
              )}
            />
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && query && results.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No results for "${query}"`}
          style={{ padding: 24 }}
        />
      )}

      {/* Recent searches */}
      {!query && recentSearches.length > 0 && (
        <div>
          <div style={{ padding: '8px 12px', background: '#fafafa' }}>
            <Space>
              <HistoryOutlined />
              <Text type="secondary" strong style={{ fontSize: 12, textTransform: 'uppercase' }}>
                Recent Searches
              </Text>
            </Space>
          </div>
          <List
            dataSource={recentSearches}
            renderItem={(item) => (
              <List.Item
                style={{ padding: '8px 12px', cursor: 'pointer' }}
                onClick={() => handleRecentClick(item)}
              >
                <Space>
                  <HistoryOutlined style={{ color: '#bfbfbf' }} />
                  <Text>{item}</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Keyboard hint */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Press <Tag style={{ fontSize: 10 }}>⌘/</Tag> to search • <Tag style={{ fontSize: 10 }}>↵</Tag> to select • <Tag style={{ fontSize: 10 }}>Esc</Tag> to close
        </Text>
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomLeft"
    >
      <Input
        ref={inputRef}
        prefix={<SearchOutlined />}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        style={{ width }}
        allowClear
        suffix={
          <Text type="secondary" style={{ fontSize: 12 }}>
            ⌘/
          </Text>
        }
      />
    </Dropdown>
  );
}

export default GlobalSearch;
