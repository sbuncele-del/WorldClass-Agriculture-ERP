/**
 * EMPLOYEE MANAGEMENT
 * 
 * Comprehensive employee records management with CRUD operations
 */

import { useState, useEffect } from 'react';
import apiClient from '../../services/api';

interface Employee {
  employee_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  id_number: string;
  email: string;
  phone_mobile: string;
  employment_status: string;
  hire_date: string;
  department_id: number;
  position_id: number;
  basic_salary: number;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Position {
  position_id: number;
  position_title: string;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get('/api/hr/employees');
      
      if (response.data?.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get('/api/hr/departments');
      
      if (response.data?.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await apiClient.get('/api/hr/positions');
      
      if (response.data?.success) {
        setPositions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || emp.employment_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="loading">Loading employees...</div>;
  }

  return (
    <div className="employee-management">
      <div className="section-header">
        <h2 className="section-title">👥 Employee Management</h2>
        <button className="btn btn-primary" onClick={handleAddEmployee}>
          ➕ Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee #</th>
              <th>Name</th>
              <th>ID Number</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Hire Date</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.employee_id}>
                <td>{emp.employee_number}</td>
                <td className="employee-name">
                  <strong>{emp.first_name} {emp.last_name}</strong>
                </td>
                <td>{emp.id_number}</td>
                <td>{emp.email}</td>
                <td>{emp.phone_mobile}</td>
                <td>
                  <span className={`status-badge ${emp.employment_status.toLowerCase().replace(' ', '-')}`}>
                    {emp.employment_status}
                  </span>
                </td>
                <td>{new Date(emp.hire_date).toLocaleDateString()}</td>
                <td>R {emp.basic_salary.toLocaleString()}</td>
                <td>
                  <button 
                    className="btn-icon btn-edit"
                    onClick={() => handleEditEmployee(emp)}
                    title="Edit Employee"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="empty-state">
            No employees found matching your criteria
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="summary-footer">
        <div className="summary-item">
          <strong>Total Employees:</strong> {employees.length}
        </div>
        <div className="summary-item">
          <strong>Active:</strong> {employees.filter(e => e.employment_status === 'Active').length}
        </div>
        <div className="summary-item">
          <strong>Filtered Results:</strong> {filteredEmployees.length}
        </div>
      </div>

      <style>{`
        .employee-management {
          padding: 2rem;
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: bold;
          color: #2c3e50;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
          transform: translateY(-1px);
        }

        .filters-section {
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          display: flex;
          gap: 1.5rem;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .search-box {
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 500;
          color: #64748b;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .table-container {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table thead {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .data-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 0.875rem;
        }

        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.875rem;
          color: #1e293b;
        }

        .data-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .employee-name {
          color: #1e40af;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.active {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-badge.on-leave {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge.terminated {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
        }

        .btn-icon:hover {
          background-color: #e2e8f0;
        }

        .summary-footer {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          display: flex;
          gap: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .summary-item {
          color: #64748b;
          font-size: 0.875rem;
        }

        .summary-item strong {
          color: #1e293b;
          margin-right: 0.5rem;
        }

        .empty-state, .loading {
          padding: 3rem;
          text-align: center;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .employee-management {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }

          .table-container {
            overflow-x: auto;
          }

          .summary-footer {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
