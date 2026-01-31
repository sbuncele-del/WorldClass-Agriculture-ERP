import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  id_number: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'ACTIVE' | 'PROBATION' | 'NOTICE' | 'SUSPENDED' | 'TERMINATED';
  employment_type: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'INTERN';
  hire_date: string;
  basic_salary: number;
  leave_balance: number;
  manager: string;
}

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/hr/employees');
      const data = response.data?.data || response.data || [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.message || 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'ACTIVE': 'green',
      'PROBATION': 'blue',
      'NOTICE': 'orange',
      'SUSPENDED': 'red',
      'TERMINATED': 'gray'
    };
    return colors[status] || 'gray';
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || emp.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
  const totalPayroll = employees.filter(e => e.status === 'ACTIVE').reduce((sum, e) => sum + e.basic_salary, 0);
  const avgSalary = activeEmployees > 0 ? totalPayroll / activeEmployees : 0;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="content-card">
          <div className="error-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#e74c3c', marginBottom: '1rem' }}>⚠️ {error}</p>
            <button className="btn-primary" onClick={fetchEmployees}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>👥 Employee Management</h2>
          <button className="btn-primary">+ New Employee</button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search employees by name, number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={filterStatus === 'ALL' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('ALL')}
            >
              All
            </button>
            <button 
              className={filterStatus === 'ACTIVE' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('ACTIVE')}
            >
              Active
            </button>
            <button 
              className={filterStatus === 'PROBATION' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('PROBATION')}
            >
              Probation
            </button>
            <button 
              className={filterStatus === 'NOTICE' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('NOTICE')}
            >
              Notice Period
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee #</th>
                <th>Name</th>
                <th>ID Number</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Type</th>
                <th>Basic Salary</th>
                <th>Leave Balance</th>
                <th>Hire Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td className="code-cell">{emp.employee_number}</td>
                  <td>
                    <div className="employee-name">
                      {emp.first_name} {emp.last_name}
                    </div>
                    <div className="employee-email">{emp.email}</div>
                  </td>
                  <td>{emp.id_number}</td>
                  <td>{emp.department}</td>
                  <td>{emp.position}</td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(emp.status)}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>{emp.employment_type}</td>
                  <td className="amount-cell">{formatCurrency(emp.basic_salary)}</td>
                  <td className="text-center">{emp.leave_balance} days</td>
                  <td>{new Date(emp.hire_date).toLocaleDateString('en-ZA')}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Profile">👁️</button>
                      <button className="btn-icon" title="Edit">✏️</button>
                      <button className="btn-icon" title="Payslip">💰</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="empty-state">
            <p>No employees found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Employees</div>
          <div className="metric-value">{totalEmployees}</div>
          <div className="metric-detail">{activeEmployees} active</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Monthly Payroll</div>
          <div className="metric-value">{formatCurrency(totalPayroll)}</div>
          <div className="metric-detail">Basic salaries only</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Average Salary</div>
          <div className="metric-value">{formatCurrency(avgSalary)}</div>
          <div className="metric-detail">Per employee</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Departments</div>
          <div className="metric-value">{new Set(employees.map(e => e.department)).size}</div>
          <div className="metric-detail">Active units</div>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
