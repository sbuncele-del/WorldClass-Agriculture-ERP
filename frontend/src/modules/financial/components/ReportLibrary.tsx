import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/api.service';
import './ReportLibrary.css';

interface ReportTemplate {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  is_shared: boolean;
  is_favorite: boolean;
  column_count: number;
  filter_count: number;
  group_count: number;
  run_count: number;
  last_executed_at: string;
  created_at: string;
}

const ReportLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportTemplate[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyShared, setShowOnlyShared] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, selectedCategory, searchTerm, showOnlyFavorites, showOnlyShared]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/templates`);
      const data = await response.json();
      setReports(data);
      setFilteredReports(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term)
      );
    }

    if (showOnlyFavorites) {
      filtered = filtered.filter(r => r.is_favorite);
    }

    if (showOnlyShared) {
      filtered = filtered.filter(r => r.is_shared);
    }

    setFilteredReports(filtered);
  };

  const runReport = (reportId: number) => {
    navigate(`/financial/report-viewer/${reportId}`);
  };

  const editReport = (reportId: number) => {
    navigate(`/financial/report-designer/${reportId}`);
  };

  const cloneReport = async (reportId: number, reportName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/templates/${reportId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_name: `${reportName} (Copy)`,
          new_code: `COPY_${Date.now()}`
        })
      });

      if (response.ok) {
        alert('Report cloned successfully!');
        fetchReports();
      } else {
        alert('Failed to clone report');
      }
    } catch (error) {
      console.error('Error cloning report:', error);
      alert('Failed to clone report');
    }
  };

  const deleteReport = async (reportId: number, reportName: string) => {
    if (!confirm(`Are you sure you want to delete "${reportName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/templates/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Report deleted successfully!');
        fetchReports();
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const toggleFavorite = async (reportId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/custom-reports/templates/${reportId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1 })
      });

      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="report-library">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-library">
      <div className="library-header">
        <div className="header-content">
          <h2>📚 Report Library</h2>
          <p className="subtitle">Browse and manage your custom reports</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/financial/report-designer')}>
          ➕ Create New Report
        </button>
      </div>

      {/* Filters */}
      <div className="library-filters">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={showOnlyFavorites}
              onChange={(e) => setShowOnlyFavorites(e.target.checked)}
            />
            ⭐ Favorites Only
          </label>
        </div>

        <div className="filter-group">
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={showOnlyShared}
              onChange={(e) => setShowOnlyShared(e.target.checked)}
            />
            🌐 Shared Only
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="library-stats">
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.is_favorite).length}</div>
          <div className="stat-label">Favorites</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.is_shared).length}</div>
          <div className="stat-label">Shared</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{filteredReports.length}</div>
          <div className="stat-label">Filtered Results</div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Reports Found</h3>
          <p>
            {searchTerm || selectedCategory || showOnlyFavorites || showOnlyShared
              ? 'Try adjusting your filters'
              : 'Get started by creating your first report'}
          </p>
          <button className="btn-primary" onClick={() => navigate('/financial/report-designer')}>
            Create New Report
          </button>
        </div>
      ) : (
        <div className="reports-grid">
          {filteredReports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="card-header">
                <div className="card-title-section">
                  <h3>{report.name}</h3>
                  <span className="report-code">{report.code}</span>
                </div>
                <button
                  className={`favorite-btn ${report.is_favorite ? 'active' : ''}`}
                  onClick={() => toggleFavorite(report.id)}
                  title={report.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {report.is_favorite ? '⭐' : '☆'}
                </button>
              </div>

              <p className="report-description">
                {report.description || 'No description provided'}
              </p>

              <div className="report-meta">
                <span className="meta-badge category">{report.category}</span>
                {report.is_shared && <span className="meta-badge shared">🌐 Shared</span>}
              </div>

              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-icon">📋</span>
                  <span>{report.column_count} columns</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🔍</span>
                  <span>{report.filter_count} filters</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📊</span>
                  <span>{report.group_count} groups</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">▶️</span>
                  <span>{report.run_count} runs</span>
                </div>
              </div>

              {report.last_executed_at && (
                <div className="last-run">
                  Last run: {new Date(report.last_executed_at).toLocaleDateString()}
                </div>
              )}

              <div className="card-actions">
                <button className="btn-action btn-run" onClick={() => runReport(report.id)}>
                  ▶️ Run
                </button>
                <button className="btn-action btn-edit" onClick={() => editReport(report.id)}>
                  ✏️ Edit
                </button>
                <button className="btn-action btn-clone" onClick={() => cloneReport(report.id, report.name)}>
                  📋 Clone
                </button>
                <button className="btn-action btn-delete" onClick={() => deleteReport(report.id, report.name)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportLibrary;
