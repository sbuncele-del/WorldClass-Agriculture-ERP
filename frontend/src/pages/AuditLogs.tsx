import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
} from 'antd';
import {
  FileSearchOutlined,
  RedoOutlined,
  SafetyOutlined,
  WarningOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import { HubLayout, HubHeader, StatusBanner, HubTabs } from '../components/hub';
import { workspaceApi } from '../services/api.service';

interface AuditLog {
  id?: string;
  event_id?: string;
  timestamp?: string;
  created_at?: string;
  actor?: string;
  user_email?: string;
  user_id?: string;
  action?: string;
  module?: string;
  entity?: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  status?: string;
  outcome?: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const loadLogs = async (query?: string, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await workspaceApi.admin.getAuditLogs({ limit: 200, search: query || undefined, status: status || undefined });
      const list = (response?.logs || response?.data || []) as AuditLog[];
      setLogs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = logs.length;
    const successes = logs.filter(l => (l.status || l.outcome || '').toLowerCase() === 'success').length;
    const failures = logs.filter(l => (l.status || l.outcome || '').toLowerCase() === 'failed' || (l.status || l.outcome || '').toLowerCase() === 'error').length;
    const uniqueActors = new Set(logs.map(l => l.actor || l.user_email || l.user_id).filter(Boolean)).size;
    return { total, successes, failures, uniqueActors };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase();
    return logs.filter(log => {
      const statusMatch = statusFilter ? (log.status || log.outcome || '').toLowerCase() === statusFilter : true;
      const termMatch = term
        ? [
            log.actor,
            log.user_email,
            log.user_id,
            log.action,
            log.module,
            log.entity,
            log.entity_id,
            log.details,
            log.ip_address,
          ]
            .filter(Boolean)
            .some(val => val?.toLowerCase().includes(term))
        : true;
      return statusMatch && termMatch;
    });
  }, [logs, search, statusFilter]);

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (_: unknown, record: AuditLog) => {
        const value = record.timestamp || record.created_at;
        return value ? new Date(value).toLocaleString() : '—';
      },
    },
    {
      title: 'Actor',
      dataIndex: 'actor',
      key: 'actor',
      render: (_: unknown, record: AuditLog) => record.actor || record.user_email || record.user_id || '—',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      render: (module: string) => module || '—',
    },
    {
      title: 'Entity',
      key: 'entity',
      render: (_: unknown, record: AuditLog) => record.entity || record.entity_id || '—',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details: string) => details || '—',
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string) => ip || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_: string, record: AuditLog) => {
        const status = (record.status || record.outcome || 'unknown').toLowerCase();
        const color = status === 'success' ? 'green' : status === 'failed' || status === 'error' ? 'red' : 'blue';
        return <Tag color={color}>{status.charAt(0).toUpperCase() + status.slice(1)}</Tag>;
      },
    },
  ];

  const tableContent = () => {
    if (loading) {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Spin size="large" tip="Loading audit logs..." />
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          type="error"
          message="Failed to load audit logs"
          description={error}
          action={<Button icon={<RedoOutlined />} onClick={() => loadLogs(search, statusFilter)}>Retry</Button>}
          showIcon
        />
      );
    }

    return (
      <Table
        rowKey={record => record.id || record.event_id || `${record.timestamp}-${record.actor}`}
        columns={columns}
        dataSource={filteredLogs}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    );
  };

  return (
    <HubLayout>
      <HubHeader
        title="Audit Logs"
        subtitle="Complete system activity tracking and audit trail"
        icon={<FileSearchOutlined />}
        gradient="orange"
        actions={<Button icon={<CloudDownloadOutlined />}>Export</Button>}
      />

      <StatusBanner
        gradient="orange"
        icon={<SafetyOutlined />}
        title="Security & Compliance"
        subtitle="Tenant-scoped audit events"
        stats={[
          { title: 'Total Events', value: stats.total, prefix: <FileSearchOutlined /> },
          { title: 'Successful', value: stats.successes, valueStyle: { color: '#22c55e' } },
          { title: 'Failed', value: stats.failures, valueStyle: { color: '#ef4444' }, prefix: <WarningOutlined /> },
          { title: 'Unique Actors', value: stats.uniqueActors },
        ]}
      />

      <HubTabs
        theme="orange"
        tabs={[
          {
            key: 'logs',
            label: 'Activity Log',
            icon: <FileSearchOutlined />,
            children: (
              <Card>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Events" value={stats.total} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Successful" value={stats.successes} valueStyle={{ color: '#22c55e' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Failed" value={stats.failures} valueStyle={{ color: '#ef4444' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Actors" value={stats.uniqueActors} />
                  </Col>
                </Row>

                <Card style={{ marginBottom: 16 }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                    <Space wrap>
                      <Input.Search
                        placeholder="Search logs"
                        allowClear
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onSearch={value => {
                          setSearch(value);
                          loadLogs(value, statusFilter);
                        }}
                        style={{ minWidth: 220 }}
                      />
                      <Select
                        placeholder="Status"
                        allowClear
                        value={statusFilter}
                        style={{ width: 160 }}
                        onChange={value => {
                          setStatusFilter(value || undefined);
                          loadLogs(search, value || undefined);
                        }}
                        options={[
                          { value: 'success', label: 'Success' },
                          { value: 'failed', label: 'Failed' },
                          { value: 'error', label: 'Error' },
                        ]}
                      />
                    </Space>
                    <Space>
                      <Button icon={<RedoOutlined />} onClick={() => loadLogs(search, statusFilter)}>Refresh</Button>
                    </Space>
                  </Space>
                </Card>

                {tableContent()}
              </Card>
            ),
          },
        ]}
      />
    </HubLayout>
  );
};

export default AuditLogs;
