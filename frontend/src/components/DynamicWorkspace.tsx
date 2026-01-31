import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api.service';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Briefcase,
  Wallet,
  Heart,
  Truck,
  Shield,
  FileCheck,
  Calculator,
  Sparkles,
  Building,
  BarChart,
  Settings,
  LayoutDashboard,
  Factory,
  Warehouse,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Briefcase,
  Heart,
  Truck,
  Shield,
  FileCheck,
  Calculator,
  Sparkles,
  Building,
  BarChart,
  Settings,
  LayoutDashboard,
  Factory,
  Warehouse,
};

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'coming_soon' | 'disabled';
  category: string;
  hasWorkspace?: boolean;
  controllerLines?: number;
}

interface ModulesData {
  modules: {
    core: Module[];
    industry: Module[];
    compliance: Module[];
    advanced: Module[];
    platform: Module[];
    coming_soon: Module[];
  };
  summary: {
    total_active: number;
    total_coming_soon: number;
    has_workspace: number;
    tenant_industry: string;
  };
}

const DynamicWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModulesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
                const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/modules/available`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }

        const result = await response.json();
        
        if (result.success) {
          setModules(result.data);
        } else {
          throw new Error(result.error || 'Failed to load modules');
        }
      } catch (err: any) {
        console.error('Error fetching modules:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [navigate]);

  const handleModuleClick = (module: Module) => {
    if (module.status === 'coming_soon') {
      alert(`${module.name} is coming soon! Stay tuned.`);
      return;
    }

    // Navigate to module route
    navigate(module.route);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderModuleCard = (module: Module) => {
    const IconComponent = iconMap[module.icon] || Briefcase;
    const isComingSoon = module.status === 'coming_soon';

    return (
      <div
        key={module.id}
        onClick={() => handleModuleClick(module)}
        className={`
          bg-white rounded-lg shadow-md p-6 cursor-pointer
          transition-all duration-200 hover:shadow-xl hover:scale-105
          border-2 border-transparent hover:border-blue-500
          ${isComingSoon ? 'opacity-60' : ''}
        `}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`
              p-3 rounded-lg
              ${isComingSoon ? 'bg-gray-100' : 'bg-blue-50'}
            `}>
              <IconComponent className={`
                h-6 w-6
                ${isComingSoon ? 'text-gray-400' : 'text-blue-600'}
              `} />
            </div>
            {isComingSoon && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          {module.hasWorkspace && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Workspace
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {module.name}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          {module.description}
        </p>

        {!isComingSoon && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="capitalize">{module.category}</span>
            {module.controllerLines && (
              <span>{module.controllerLines.toLocaleString()} lines</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderModuleSection = (title: string, modules: Module[]) => {
    if (modules.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({modules.length})
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map(renderModuleCard)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-center mb-4">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Workspace</h3>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!modules) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Workspace
          </h1>
          <p className="text-gray-600">
            Your personalized ERP modules for{' '}
            <span className="font-semibold capitalize">
              {modules.summary.tenant_industry}
            </span>{' '}
            industry
          </p>
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="font-semibold mr-2">
                {modules.summary.total_active}
              </span>
              Active Modules
            </div>
            <div className="flex items-center">
              <span className="font-semibold mr-2">
                {modules.summary.has_workspace}
              </span>
              With Workspace
            </div>
            {modules.summary.total_coming_soon > 0 && (
              <div className="flex items-center">
                <span className="font-semibold mr-2">
                  {modules.summary.total_coming_soon}
                </span>
                Coming Soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Sections */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {renderModuleSection('Core ERP Modules', modules.modules.core)}
        {renderModuleSection('Industry Solutions', modules.modules.industry)}
        {renderModuleSection('Compliance & Regulatory', modules.modules.compliance)}
        {renderModuleSection('Advanced Features', modules.modules.advanced)}
        {renderModuleSection('Platform & Administration', modules.modules.platform)}
        {renderModuleSection('Coming Soon', modules.modules.coming_soon)}
      </div>
    </div>
  );
};

export default DynamicWorkspace;
