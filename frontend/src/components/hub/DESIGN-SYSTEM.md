# AetherOS Hub Design System

## Team Documentation

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Design System Lead:** AetherOS Team

---

## 📋 Overview

The AetherOS Hub Design System is our premium Enterprise SaaS design language used across all major modules. It provides a consistent, professional, and visually stunning user experience that rivals Fortune 500 enterprise applications.

### Design Philosophy

> "Clean, Beautiful, Professional"

Our design system emphasizes:
- **Visual Hierarchy** - Clear information architecture
- **Gradient Theming** - Signature color gradients for module identity
- **Consistent Components** - Reusable building blocks
- **RSA Compliance Ready** - South African regulatory requirements built-in

---

## 🎨 Color Themes

Each module has a signature gradient theme:

| Module | Theme | Primary Gradient |
|--------|-------|------------------|
| SARS Integration | `green` | `#10b981 → #059669` |
| Banking & Treasury | `purple` | `#8b5cf6 → #7c3aed` |
| Multi-Entity | `blue` | `#3b82f6 → #1d4ed8` |
| HR & Payroll | `cyan` | `#06b6d4 → #0891b2` |
| Practice Management | `pink` | `#ec4899 → #d946ef` |
| Financial | `blue` | `#667eea → #764ba2` |
| Sales & CRM | `cyan` | `#06b6d4 → #0891b2` |
| Inventory | `orange` | `#f59e0b → #d97706` |
| Purchase | `purple` | `#8b5cf6 → #7c3aed` |

### CSS Variables

```css
/* Available in hub.css */
--hub-green: linear-gradient(135deg, #10b981 0%, #059669 100%);
--hub-blue: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
--hub-purple: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
--hub-cyan: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
--hub-pink: linear-gradient(135deg, #ec4899 0%, #d946ef 100%);
--hub-orange: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
--hub-red: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
```

---

## 🧩 Components

### Import Statement

```tsx
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
  StatCard,
  ProgressCard,
  InfoListCard,
  QuickActionsCard,
  StatusIndicator,
} from '../../components/hub';
```

### 1. HubLayout

The main container wrapper for all Hub pages.

```tsx
<HubLayout>
  {/* Header, Banner, Tabs, Content */}
</HubLayout>
```

### 2. HubHeader

The standardized header with gradient logo, title, and action buttons.

```tsx
<HubHeader
  title="Module Name"
  subtitle="Brief description"
  icon={<IconComponent />}
  gradient="green" // green | blue | purple | cyan | pink | orange | red
  actions={
    <>
      <Button icon={<SyncOutlined />}>Refresh</Button>
      <Button type="primary" icon={<PlusOutlined />}>Add New</Button>
    </>
  }
/>
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | ✅ | Main module title |
| `subtitle` | string | | Secondary description |
| `icon` | ReactNode | ✅ | Ant Design icon |
| `gradient` | ThemeColor | ✅ | Color theme |
| `actions` | ReactNode | | Action buttons |

### 3. StatusBanner

The signature gradient status banner with statistics grid.

```tsx
<StatusBanner
  gradient="green"
  icon={<ApiOutlined />}
  title="System Status"
  subtitle="Last updated: Just now"
  stats={[
    { title: 'Total Items', value: 1234, span: 4 },
    { title: 'Active', value: 89, suffix: '%', valueStyle: { color: '#86efac' }, span: 4 },
    { title: 'Revenue', value: 250000, prefix: 'R', span: 4 },
  ]}
/>
```

**Stats Array Item:**
```typescript
interface StatItem {
  title: string;       // Label
  value: string | number;
  prefix?: string;     // e.g., 'R' for currency
  suffix?: string;     // e.g., '%' for percentage
  valueStyle?: React.CSSProperties;
  span?: number;       // Grid column span (1-24)
}
```

### 4. HubTabs

Themed tab navigation with active state highlighting.

```tsx
const tabs = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <BarChartOutlined />,
    children: <DashboardContent />,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <SettingOutlined />,
    children: <SettingsContent />,
  },
];

<HubTabs
  theme="green"
  tabs={tabs}
  activeKey={activeTab}
  onChange={setActiveTab}
/>
```

### 5. StatCard

Simple statistics display card.

```tsx
<StatCard
  title="Total Revenue"
  value={2500000}
  prefix="R"
  suffix="/mo"
  trend={{ value: 12.5, direction: 'up' }}
  icon={<DollarOutlined />}
/>
```

### 6. ProgressCard

Card with progress bar visualization.

```tsx
<ProgressCard
  title="Monthly Target"
  current={750000}
  target={1000000}
  color="#10b981"
  suffix="R"
/>
```

### 7. QuickActionsCard

Grid of quick action buttons.

```tsx
<QuickActionsCard
  title="Quick Actions"
  actions={[
    { icon: <PlusOutlined />, label: 'Add New', onClick: handleAdd },
    { icon: <DownloadOutlined />, label: 'Export' },
    { icon: <PrinterOutlined />, label: 'Print' },
    { icon: <SettingOutlined />, label: 'Settings' },
  ]}
/>
```

### 8. InfoListCard

Key-value information display.

```tsx
<InfoListCard
  title="System Info"
  items={[
    { label: 'Version', value: '1.0.0' },
    { label: 'Status', value: <Tag color="green">Active</Tag> },
    { label: 'Last Sync', value: '2 mins ago' },
  ]}
/>
```

### 9. StatusIndicator

Colored status badge with optional pulse animation.

```tsx
<StatusIndicator 
  status="connected" 
  label="API Connected" 
/>
// status: 'connected' | 'disconnected' | 'pending' | 'error'
```

---

## 📐 Page Structure Template

Every Hub page follows this structure:

```tsx
import React, { useState } from 'react';
import { /* Ant Design components */ } from 'antd';
import { /* Icons */ } from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
  QuickActionsCard,
} from '../../components/hub';

const MyModuleHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <BarChartOutlined />,
      children: (/* Dashboard content */),
    },
    // ... more tabs
  ];

  return (
    <HubLayout>
      {/* 1. Header */}
      <HubHeader
        title="Module Name"
        subtitle="Description"
        icon={<ModuleIcon />}
        gradient="green"
        actions={/* Action buttons */}
      />

      {/* 2. Status Banner */}
      <StatusBanner
        gradient="green"
        icon={<StatusIcon />}
        title="Overview Title"
        subtitle="Context"
        stats={[/* Statistics */]}
      />

      {/* 3. Tabbed Content */}
      <HubTabs
        theme="green"
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. Modals (if any) */}
    </HubLayout>
  );
};

export default MyModuleHub;
```

---

## 🇿🇦 RSA Compliance Features

### Tax Compliance (SARS)
- PAYE tax tables (18-45% brackets)
- UIF contributions (1% employee, 1% employer, capped at R177.12)
- SDL levy (1% of payroll)
- EMP201 monthly submissions
- EMP501 bi-annual reconciliation
- IRP5/IT3(a) certificate generation

### Employment Law (BCEA)
- Annual leave: 15-21 days
- Sick leave: 30 days per 3-year cycle
- Family responsibility: 3 days
- Maternity: 4 months
- Public holidays: 12 per year

### Financial Reporting
- IFRS compliance
- Multi-currency support (9 currencies)
- Multi-entity consolidation
- B-BBEE supplier tracking

---

## 📁 File Structure

```
frontend/src/
├── components/
│   └── hub/
│       ├── index.ts           # Barrel export
│       ├── HubLayout.tsx      # Main wrapper
│       ├── HubHeader.tsx      # Header component
│       ├── StatusBanner.tsx   # Gradient banner
│       ├── HubTabs.tsx        # Tab navigation
│       ├── HubCards.tsx       # Card components
│       └── hub.css            # Design system styles
│
└── modules/
    ├── banking/
    │   └── BankingHub.tsx
    ├── financial/
    │   └── FinancialHub.tsx
    ├── hr/
    │   └── HRHub.tsx
    ├── inventory/
    │   └── InventoryHub.tsx
    ├── multi-entity/
    │   └── MultiEntityHub.tsx
    ├── professional/
    │   └── PracticeHub.tsx
    ├── purchase/
    │   └── PurchaseHub.tsx
    ├── sales/
    │   └── SalesHub.tsx
    └── sars-sentinel/
        └── SARSIntegrationHub.tsx
```

---

## 🚀 Quick Start

### Creating a New Hub Page

1. **Create the file:**
   ```bash
   touch frontend/src/modules/your-module/YourModuleHub.tsx
   ```

2. **Use the template:**
   ```tsx
   import { HubLayout, HubHeader, StatusBanner, HubTabs } from '../../components/hub';
   // ... follow the template structure
   ```

3. **Add the route in App.tsx:**
   ```tsx
   const YourModuleHub = lazy(() => import('./modules/your-module/YourModuleHub'));
   // ...
   <Route path="/your-module-hub" element={<YourModuleHub />} />
   ```

4. **Choose your theme color** based on module category

---

## ✅ Checklist for New Hub Pages

- [ ] Import shared components from `../../components/hub`
- [ ] Use `HubLayout` as the root wrapper
- [ ] Add `HubHeader` with appropriate icon and gradient
- [ ] Include `StatusBanner` with relevant statistics
- [ ] Implement `HubTabs` for content organization
- [ ] Add `QuickActionsCard` in the sidebar
- [ ] Include modals for create/edit operations
- [ ] Format currency as ZAR (`R ${value.toLocaleString('en-ZA')}`)
- [ ] Use South African date format where applicable
- [ ] Add RSA compliance features if relevant

---

## 🎯 Design Principles

1. **Consistency** - Every Hub page looks and feels the same
2. **Hierarchy** - Important information is prominently displayed
3. **Density** - Show relevant data without overwhelming
4. **Responsiveness** - Works on all screen sizes
5. **Performance** - Lazy load heavy components
6. **Accessibility** - Proper contrast and focus states

---

## 📞 Support

For questions about the design system:
- Check existing Hub pages for examples
- Refer to this documentation
- Contact the frontend team

**Happy Building! 🚀**
