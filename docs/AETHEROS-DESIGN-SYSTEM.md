# AetherOS Design System
## World-Class Enterprise UI Framework

---

## 🎨 Design Philosophy

AetherOS combines the best practices from three enterprise giants:
- **Oracle**: Professional blue header, enterprise-grade navigation
- **SAP**: Clean horizontal tabs, intuitive information architecture
- **Microsoft**: Modern purple gradients, glass morphism effects

---

## 📐 Layout Structure

### Global Layout Hierarchy
```
┌─────────────────────────────────────────────────┐
│ Oracle Header (60px fixed)                      │
│ - Logo, Global Search, Help, Notifications      │
├─────────────────────────────────────────────────┤
│ SAP Sidebar (280px) │ Content Area              │
│ - Core Modules      │ ┌──────────────────────┐  │
│ - Finance           │ │ Breadcrumb           │  │
│ - Operations        │ ├──────────────────────┤  │
│ - Compliance        │ │ Page Header          │  │
│                     │ ├──────────────────────┤  │
│                     │ │ SAP Tabs             │  │
│                     │ ├──────────────────────┤  │
│                     │ │ Purple Gradient      │  │
│                     │ │ Content Area         │  │
│                     │ │ (Scrollable)         │  │
│                     │ └──────────────────────┘  │
└─────────────────────────────────────────────────┘
│ CoPilot FAB (60px circle, bottom-right)         │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Primary Colors
```css
--oracle-blue: #0F4B9C;        /* Primary brand color */
--oracle-blue-dark: #0a3a7a;   /* Hover states */
--oracle-gradient: linear-gradient(to right, #0F4B9C, #00A3B2);

--sap-gray-10: #fafafa;        /* Background */
--sap-gray-50: #f5f5f5;        /* Cards */
--sap-gray-100: #e5e5e5;       /* Borders */
--sap-gray-500: #737373;       /* Text secondary */
--sap-gray-900: #171717;       /* Text primary */

--ms-purple: #7160e8;          /* CoPilot accent */
--purple-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Semantic Colors
```css
--success: #22c55e;
--success-light: #86efac;
--warning: #f59e0b;
--warning-light: #fbbf24;
--error: #ef4444;
--error-light: #fca5a5;
--info: #3b82f6;
--info-light: #93c5fd;
```

### Glass Morphism
```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

---

## 📦 Component Library

### 1. EnterpriseLayout
**Purpose**: Main layout wrapper for all module pages

**Props**:
- `moduleTitle` - Page title (e.g., "Financial Dashboard")
- `moduleSubtitle` - Optional subtitle
- `breadcrumbs` - Array of `{ label, path }` objects
- `tabs` - Array of `{ id, label, path }` for SAP tabs
- `actionButtons` - Array of header action buttons
- `showFilters` - Boolean to show filter area
- `filterComponent` - Custom filter JSX
- `children` - Main content

**Usage**:
```tsx
<EnterpriseLayout
  moduleTitle="Trial Balance"
  moduleSubtitle="Period: November 2025"
  breadcrumbs={[
    { label: 'Dashboard', path: '/' },
    { label: 'Financial', path: '/financial/dashboard' },
    { label: 'Trial Balance' }
  ]}
  tabs={financialTabs}
  actionButtons={[
    { label: 'Export', icon: <Download />, variant: 'primary' }
  ]}
  showFilters={true}
  filterComponent={<MyFilters />}
>
  {/* Your content here */}
</EnterpriseLayout>
```

### 2. GlassCard
**Purpose**: Reusable glass morphism card container

**Props**:
- `padding` - `'sm' | 'md' | 'lg'` (12px, 20px, 28px)
- `hoverable` - Boolean for hover effects
- `className` - Additional CSS classes
- `onClick` - Optional click handler

**Usage**:
```tsx
<GlassCard padding="lg" hoverable>
  <div className="glass-card-header">
    <h3 className="glass-card-title">Card Title</h3>
    <div className="glass-card-icon">
      <TrendingUp size={20} />
    </div>
  </div>
  <div className="glass-card-content">
    Your content here
  </div>
</GlassCard>
```

### 3. DataTable
**Purpose**: Responsive glass morphism data table

**Props**:
- `title` - Table title
- `subtitle` - Optional subtitle
- `columns` - Array of column definitions
- `data` - Array of row data
- `emptyMessage` - Message when no data
- `actions` - Header action buttons
- `maxHeight` - Scrollable height limit

**Column Definition**:
```tsx
interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}
```

**Usage**:
```tsx
const columns = [
  { key: 'code', label: 'Code' },
  { 
    key: 'amount', 
    label: 'Amount', 
    align: 'right',
    render: (value) => formatCurrency(value)
  }
];

<DataTable
  title="Accounts"
  columns={columns}
  data={accounts}
  maxHeight="600px"
/>
```

---

## 🎯 Design Patterns

### Breadcrumb Navigation
- Always start with Home icon
- Use `/` separator between items
- Current page is not a link
- Max 4 levels deep

### Page Header
- Left: Title (24px, semi-bold) + Subtitle (14px, gray)
- Right: Action buttons (Export, Schedule, New Entry, etc.)
- White background with bottom border

### SAP Tabs
- Horizontal scrollable tabs
- White background
- Active tab: Oracle blue underline + light blue background
- 14px font, 14px vertical padding

### Purple Gradient Content
- `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Scrollable with custom scrollbar
- 24px padding
- Max-width: 1600px centered

### Glass Cards
- Semi-transparent white background
- Backdrop blur effect
- White text for readability
- Subtle border and shadow
- Hover: slight lift + increased opacity

### Status Indicators
```tsx
// Success
<div className="dt-badge dt-badge-success">
  <CheckCircle size={14} />
  <span>Balanced</span>
</div>

// Warning
<div className="dt-badge dt-badge-warning">
  <AlertTriangle size={14} />
  <span>Review Required</span>
</div>

// Error
<div className="dt-badge dt-badge-error">
  <XCircle size={14} />
  <span>Failed</span>
</div>

// Info
<div className="dt-badge dt-badge-info">
  <Info size={14} />
  <span>Pending</span>
</div>
```

---

## 📱 Responsive Breakpoints

```css
/* Desktop (default) */
@media (min-width: 1440px) {
  /* 3-column grid */
  grid-template-columns: repeat(3, 1fr);
}

/* Laptop */
@media (max-width: 1400px) {
  /* 2-column grid */
  grid-template-columns: repeat(2, 1fr);
}

/* Tablet */
@media (max-width: 1024px) {
  /* Simplified layouts */
  /* Stack components vertically */
}

/* Mobile */
@media (max-width: 768px) {
  /* Single column */
  grid-template-columns: 1fr;
  /* Hide non-essential elements */
  /* Stack action buttons */
}
```

---

## ⚡ Performance Guidelines

1. **Code Splitting**: Import large components dynamically
2. **Virtualization**: Use virtual scrolling for 100+ rows
3. **Memoization**: Wrap expensive calculations in `useMemo`
4. **Lazy Loading**: Load data on scroll/pagination
5. **Debouncing**: Debounce search inputs (300ms)

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Contrast**: 4.5:1 minimum for text
- **Focus Indicators**: Visible keyboard focus states
- **ARIA Labels**: Meaningful labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Alt Text**: Descriptive alternative text for images

---

## 📝 Code Standards

### Component File Structure
```
ComponentName/
├── ComponentName.tsx      # Component logic
├── ComponentName.css      # Component styles
├── ComponentName.test.tsx # Unit tests
└── index.ts               # Export barrel file
```

### Naming Conventions
- **Components**: PascalCase (`FinancialDashboard`)
- **Files**: PascalCase for components (`FinancialDashboard.tsx`)
- **CSS Classes**: kebab-case with BEM (`el-header-title`)
- **Props**: camelCase (`moduleTitle`)
- **State**: camelCase (`selectedYear`)

### CSS Class Prefixes
- `el-` - EnterpriseLayout components
- `gc-` - GlassCard components
- `dt-` - DataTable components
- `tbe-` - Trial Balance Enhanced
- `fde-` - Financial Dashboard Enhanced

---

## 🚀 Quick Start for New Pages

1. **Import EnterpriseLayout**:
```tsx
import EnterpriseLayout from '../../../components/layout/EnterpriseLayout';
import GlassCard from '../../../components/ui/GlassCard';
import DataTable from '../../../components/ui/DataTable';
```

2. **Define tabs** (reuse across module):
```tsx
const financialTabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/financial/dashboard' },
  { id: 'journal', label: 'Journal Entries', path: '/financial/journal-entries' },
  // ... more tabs
];
```

3. **Wrap content in EnterpriseLayout**:
```tsx
return (
  <EnterpriseLayout
    moduleTitle="Your Page Title"
    breadcrumbs={yourBreadcrumbs}
    tabs={financialTabs}
    actionButtons={yourActions}
  >
    <GlassCard>
      Your content here
    </GlassCard>
  </EnterpriseLayout>
);
```

4. **Use GlassCard for sections**:
```tsx
<GlassCard padding="lg">
  <h3 className="glass-card-title">Section Title</h3>
  <p>Content with white text</p>
</GlassCard>
```

5. **Use DataTable for data**:
```tsx
<DataTable
  title="Your Data"
  columns={yourColumns}
  data={yourData}
/>
```

---

## 📚 Examples

### Financial Dashboard
- Location: `/frontend/src/pages/FinancialDashboardEnhanced.tsx`
- Features: KPI cards, charts, AI insights
- Pattern: Grid layout with glass cards

### Trial Balance
- Location: `/frontend/src/modules/financial/components/TrialBalanceEnhanced.tsx`
- Features: Filters, status card, data table
- Pattern: Status banner + scrollable table

---

## 🎯 Next Steps

1. Apply EnterpriseLayout to all Financial sub-pages
2. Create reusable KPI card component
3. Create reusable chart card component
4. Apply to Sales, Purchase, Inventory, HR modules
5. Create Storybook documentation
6. Implement dark mode variant

---

## 💡 Tips

- **Consistency**: Always use the same tab array within a module
- **Reusability**: Extract repeated patterns into shared components
- **Responsiveness**: Test on mobile (375px) and desktop (1920px)
- **Loading States**: Always show skeleton loaders during data fetch
- **Error Handling**: Use GlassCard with error icons and messages
- **Empty States**: Use meaningful empty state messages with icons

---

*Design System Version 1.0 - November 2025*
*Created for AetherOS ERP Platform*
