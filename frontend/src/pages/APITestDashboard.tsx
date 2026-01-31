import React, { useState, useEffect } from 'react';
import { testApiConnection, API_BASE_URL, workspaceApi, authApi } from '../services/api.service';

interface EndpointTest {
  name: string;
  endpoint: string;
  method: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

const APITestDashboard: React.FC = () => {
  const [tests, setTests] = useState<EndpointTest[]>([]);
  const [testing, setTesting] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const endpoints: Omit<EndpointTest, 'status'>[] = [
    { name: 'Health Check', endpoint: '/health', method: 'GET' },
    { name: 'Auth - Me', endpoint: '/api/auth/me', method: 'GET' },
    { name: 'Financial Dashboard', endpoint: '/api/financial/dashboard', method: 'GET' },
    { name: 'Sales Dashboard', endpoint: '/api/sales/dashboard', method: 'GET' },
    { name: 'Purchase Dashboard', endpoint: '/api/purchase/dashboard', method: 'GET' },
    { name: 'Inventory Dashboard', endpoint: '/api/inventory/dashboard', method: 'GET' },
    { name: 'HR Dashboard', endpoint: '/api/hr/dashboard', method: 'GET' },
    { name: 'Logistics Dashboard', endpoint: '/api/logistics/dashboard', method: 'GET' },
    { name: 'Compliance Dashboard', endpoint: '/api/compliance/dashboard', method: 'GET' },
    { name: 'SARS Dashboard', endpoint: '/api/sars-sentinel/dashboard', method: 'GET' },
    { name: 'Assets Dashboard', endpoint: '/api/assets/dashboard', method: 'GET' },
    { name: 'Manufacturing Dashboard', endpoint: '/api/manufacturing/dashboard', method: 'GET' },
    { name: 'Warehouse Dashboard', endpoint: '/api/warehouse/dashboard', method: 'GET' },
    { name: 'Admin Dashboard', endpoint: '/api/admin/dashboard', method: 'GET' },
  ];

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    const connected = await testApiConnection();
    setApiConnected(connected);
  };

  const testEndpoint = async (test: Omit<EndpointTest, 'status'>): Promise<EndpointTest> => {
    const startTime = Date.now();
    
    try {
      const token = localStorage.getItem('token');
      const workspaceId = localStorage.getItem('workspaceId');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (workspaceId) {
        headers['X-Workspace-ID'] = workspaceId;
      }

      const response = await fetch(`${API_BASE_URL}${test.endpoint}`, {
        method: test.method,
        headers: headers,
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        return {
          ...test,
          status: 'error',
          error: errorMessage,
          duration,
        };
      }

      const data = await response.json();
      
      return {
        ...test,
        status: 'success',
        response: data,
        duration,
      };
    } catch (error: any) {
      return {
        ...test,
        status: 'error',
        error: error.message || 'Network error',
        duration: Date.now() - startTime,
      };
    }
  };

  const testAllEndpoints = async () => {
    setTesting(true);
    const initialTests: EndpointTest[] = endpoints.map(e => ({ ...e, status: 'pending' as const }));
    setTests(initialTests);

    for (let i = 0; i < endpoints.length; i++) {
      const result = await testEndpoint(endpoints[i]);
      
      setTests(prev => {
        const updated = [...prev];
        updated[i] = result;
        return updated;
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setTesting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const successRate = tests.length > 0 ? Math.round((successCount / tests.length) * 100) : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🔧 API Test Dashboard
        </h1>
        <p style={{ color: '#64748b' }}>
          Test connectivity to backend API endpoints
        </p>
      </div>

      {/* Connection Status */}
      <div style={{ 
        padding: '1.5rem', 
        background: apiConnected ? '#d1fae5' : apiConnected === false ? '#fee2e2' : '#f3f4f6',
        borderRadius: '0.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>
          {apiConnected === null ? '⏳' : apiConnected ? '✅' : '❌'}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            {apiConnected === null 
              ? 'Checking connection...' 
              : apiConnected 
              ? 'Backend Connected' 
              : 'Backend Disconnected'}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            API URL: <code style={{ background: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
              {API_BASE_URL}
            </code>
          </div>
        </div>
      </div>

      {/* Auth Info */}
      <div style={{ 
        padding: '1.5rem', 
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>🔐 Authentication Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Token</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: localStorage.getItem('token') ? '#10b981' : '#ef4444' }}>
              {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Workspace ID</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {localStorage.getItem('workspaceId') || '❌ Not Set'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Tenant ID</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {localStorage.getItem('tenantId') || '❌ Not Set'}
            </div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={testAllEndpoints}
          disabled={testing}
          style={{
            padding: '0.75rem 1.5rem',
            background: testing ? '#94a3b8' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            cursor: testing ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {testing ? '⏳ Testing...' : '🚀 Test All Endpoints'}
        </button>

        {tests.length > 0 && (
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Success Rate:</span>{' '}
              <strong style={{ color: successRate > 75 ? '#10b981' : successRate > 50 ? '#f59e0b' : '#ef4444' }}>
                {successRate}%
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Passed:</span>{' '}
              <strong style={{ color: '#10b981' }}>{successCount}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Failed:</span>{' '}
              <strong style={{ color: '#ef4444' }}>{errorCount}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Test Results */}
      {tests.length > 0 && (
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Endpoint Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Method</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Path</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Duration</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Response</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {getStatusIcon(test.status)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>
                    {test.name}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      background: '#dbeafe', 
                      color: '#1e40af',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {test.method}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {test.endpoint}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {test.duration ? `${test.duration}ms` : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {test.status === 'success' && test.response && (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#10b981', fontSize: '0.875rem' }}>
                          View Response
                        </summary>
                        <pre style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.5rem', 
                          background: '#f8fafc', 
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(test.response, null, 2)}
                        </pre>
                      </details>
                    )}
                    {test.status === 'error' && test.error && (
                      <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                        {test.error}
                      </span>
                    )}
                    {test.status === 'pending' && (
                      <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                        Waiting...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default APITestDashboard;
