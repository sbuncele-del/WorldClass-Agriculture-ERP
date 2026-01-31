import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './Sales.css';
import EnterpriseLayout from '../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../components/layout/SecondaryNav';
import QuickCreateDrawer from '../components/forms/QuickCreateDrawer';
import NewLeadForm from '../modules/sales/forms/NewLeadForm';
import SalesDashboardEnhanced from '../modules/sales/SalesDashboardEnhanced';
import CustomersPage from '../modules/sales/CustomersPage';
import LeadsPage from '../modules/sales/LeadsPage';
import OpportunitiesPage from '../modules/sales/OpportunitiesPage';
import QuotationsPage from '../modules/sales/QuotationsPage';
import SalesOrdersPage from '../modules/sales/SalesOrdersPage';
import InvoicesPage from '../modules/sales/InvoicesPage';
import { UserPlus, Target, FileText, DollarSign, BarChart3, TrendingUp, Users } from 'lucide-react';

export default function Sales() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  const handleQuickAction = (action: string) => {
    setActiveDrawer(action);
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
  };

  const handleSuccess = () => {
    closeDrawer();
    // Optionally refresh the current page data
    window.location.reload();
  };

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { 
          id: 'new-lead', 
          label: 'New Lead', 
          icon: <UserPlus size={16} />,
          onClick: () => handleQuickAction('lead')
        },
        { 
          id: 'new-opportunity', 
          label: 'New Opportunity', 
          icon: <Target size={16} />,
          onClick: () => handleQuickAction('opportunity')
        },
        { 
          id: 'new-quotation', 
          label: 'New Quotation', 
          icon: <FileText size={16} />,
          onClick: () => handleQuickAction('quotation')
        },
        { 
          id: 'new-order', 
          label: 'New Sales Order', 
          icon: <DollarSign size={16} />,
          onClick: () => handleQuickAction('order')
        }
      ]
    },
    {
      title: 'Reports',
      items: [
        { id: 'sales-report', label: 'Sales Report', path: '/sales/dashboard', icon: <BarChart3 size={16} /> },
        { id: 'pipeline-report', label: 'Pipeline Report', path: '/sales/opportunities', icon: <TrendingUp size={16} /> },
        { id: 'customer-report', label: 'Customer Report', path: '/sales/customers', icon: <Users size={16} /> }
      ]
    }
  ];

  return (
    <>
      <EnterpriseLayout
        moduleTitle="Sales & CRM"
        moduleSubtitle="Manage customers, leads, opportunities, quotations, orders and invoices"
        tabs={[
          { id: 'dashboard', label: 'Dashboard', path: '/sales/dashboard' },
          { id: 'leads', label: 'Leads', path: '/sales/leads' },
          { id: 'opportunities', label: 'Opportunities', path: '/sales/opportunities' },
          { id: 'customers', label: 'Customers', path: '/sales/customers' },
          { id: 'quotations', label: 'Quotations', path: '/sales/quotations' },
          { id: 'orders', label: 'Sales Orders', path: '/sales/orders' },
          { id: 'invoices', label: 'Invoices', path: '/sales/invoices' },
        ]}
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Sales & CRM', path: '/sales' },
        ]}
        secondaryNav={secondaryNav}
      >
      <div className="sales-module">
        <Routes>
          <Route index element={<SalesDashboardEnhanced />} />
          <Route path="dashboard" element={<SalesDashboardEnhanced />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="opportunities" element={<OpportunitiesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="orders" element={<SalesOrdersPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
        </Routes>
      </div>
    </EnterpriseLayout>

    {/* Quick Create Drawers */}
    <QuickCreateDrawer
      isOpen={activeDrawer === 'lead'}
      onClose={closeDrawer}
      title="New Lead"
      subtitle="Create a new sales lead"
    >
      <NewLeadForm onSuccess={handleSuccess} onCancel={closeDrawer} />
    </QuickCreateDrawer>

    <QuickCreateDrawer
      isOpen={activeDrawer === 'opportunity'}
      onClose={closeDrawer}
      title="New Opportunity"
      subtitle="Create a new sales opportunity"
    >
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <p>Opportunity form coming soon...</p>
        <button className="btn-secondary" onClick={closeDrawer} style={{ marginTop: '1rem' }}>
          Close
        </button>
      </div>
    </QuickCreateDrawer>

    <QuickCreateDrawer
      isOpen={activeDrawer === 'quotation'}
      onClose={closeDrawer}
      title="New Quotation"
      subtitle="Create a new sales quotation"
      width="700px"
    >
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <p>Quotation form coming soon...</p>
        <button className="btn-secondary" onClick={closeDrawer} style={{ marginTop: '1rem' }}>
          Close
        </button>
      </div>
    </QuickCreateDrawer>

    <QuickCreateDrawer
      isOpen={activeDrawer === 'order'}
      onClose={closeDrawer}
      title="New Sales Order"
      subtitle="Create a new sales order"
      width="800px"
    >
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <p>Sales Order form coming soon...</p>
        <button className="btn-secondary" onClick={closeDrawer} style={{ marginTop: '1rem' }}>
          Close
        </button>
      </div>
    </QuickCreateDrawer>
  </>
  );
}
