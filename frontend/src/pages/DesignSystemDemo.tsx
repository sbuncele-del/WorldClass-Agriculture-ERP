import React from 'react';
import './DesignSystemDemo.css';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Search,
  Download,
  Plus,
  Settings
} from 'lucide-react';

/**
 * Design System Demo Page
 * Shows all design tokens and components in action
 */
const DesignSystemDemo: React.FC = () => {
  return (
    <div className="design-system-demo">
      {/* Hero Section */}
      <div className="demo-hero">
        <h1>SiyaBusa Design System</h1>
        <p className="demo-subtitle">
          Enterprise-grade design tokens and components for consistent, scalable UI
        </p>
      </div>

      {/* Color Palette Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Color System</h2>
        <p className="demo-description">
          Consistent color palette using CSS variables for easy theming and maintenance
        </p>

        <div className="demo-subsection">
          <h3>Primary Colors</h3>
          <div className="color-grid">
            <div className="color-card">
              <div className="color-swatch" style={{ background: 'var(--primary-blue)' }}></div>
              <div className="color-info">
                <div className="color-name">Primary Blue</div>
                <div className="color-token">--primary-blue</div>
                <div className="color-value">#0b63c5</div>
              </div>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ background: 'var(--primary-dark)' }}></div>
              <div className="color-info">
                <div className="color-name">Primary Dark</div>
                <div className="color-token">--primary-dark</div>
                <div className="color-value">#084a96</div>
              </div>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ background: 'var(--primary-light)' }}></div>
              <div className="color-info">
                <div className="color-name">Primary Light</div>
                <div className="color-token">--primary-light</div>
                <div className="color-value">#3a7bc8</div>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-subsection">
          <h3>Semantic Colors</h3>
          <div className="color-grid">
            <div className="color-card">
              <div className="color-swatch" style={{ background: 'var(--success)' }}></div>
              <div className="color-info">
                <div className="color-name">Success</div>
                <div className="color-token">--success</div>
                <div className="color-value">#28a745</div>
              </div>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ background: 'var(--warning)' }}></div>
              <div className="color-info">
                <div className="color-name">Warning</div>
                <div className="color-token">--warning</div>
                <div className="color-value">#ffc107</div>
              </div>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ background: 'var(--danger)' }}></div>
              <div className="color-info">
                <div className="color-name">Danger</div>
                <div className="color-token">--danger</div>
                <div className="color-value">#dc3545</div>
              </div>
            </div>
            <div className="color-card">
              <div className="color-swatch" style={{ background: 'var(--info)' }}></div>
              <div className="color-info">
                <div className="color-name">Info</div>
                <div className="color-token">--info</div>
                <div className="color-value">#3b82f6</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Typography Scale</h2>
        <p className="demo-description">
          Harmonious type scale from 12px to 48px for clear visual hierarchy
        </p>

        <div className="typography-demo">
          <div className="type-sample">
            <h1>Heading 1 - Enterprise Dashboard</h1>
            <code>font-size: var(--font-4xl); /* 40px */</code>
          </div>
          <div className="type-sample">
            <h2>Heading 2 - Financial Performance</h2>
            <code>font-size: var(--font-3xl); /* 32px */</code>
          </div>
          <div className="type-sample">
            <h3>Heading 3 - Section Title</h3>
            <code>font-size: var(--font-2xl); /* 24px */</code>
          </div>
          <div className="type-sample">
            <h4>Heading 4 - Card Title</h4>
            <code>font-size: var(--font-xl); /* 20px */</code>
          </div>
          <div className="type-sample">
            <p className="text-lg">Large text - Emphasis and callouts</p>
            <code>font-size: var(--font-lg); /* 18px */</code>
          </div>
          <div className="type-sample">
            <p>Base text - Body copy and general content</p>
            <code>font-size: var(--font-base); /* 16px */</code>
          </div>
          <div className="type-sample">
            <p className="text-sm">Small text - Secondary information</p>
            <code>font-size: var(--font-sm); /* 14px */</code>
          </div>
          <div className="type-sample">
            <p className="text-xs">Extra small - Labels and captions</p>
            <code>font-size: var(--font-xs); /* 12px */</code>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Spacing System (8px Grid)</h2>
        <p className="demo-description">
          Consistent spacing using multiples of 8px for visual rhythm
        </p>

        <div className="spacing-demo">
          <div className="spacing-sample">
            <div className="spacing-box" style={{ width: 'var(--space-xs)' }}></div>
            <div className="spacing-label">
              <strong>xs:</strong> 4px (0.25rem)
              <code>var(--space-xs)</code>
            </div>
          </div>
          <div className="spacing-sample">
            <div className="spacing-box" style={{ width: 'var(--space-sm)' }}></div>
            <div className="spacing-label">
              <strong>sm:</strong> 8px (0.5rem)
              <code>var(--space-sm)</code>
            </div>
          </div>
          <div className="spacing-sample">
            <div className="spacing-box" style={{ width: 'var(--space-md)' }}></div>
            <div className="spacing-label">
              <strong>md:</strong> 16px (1rem)
              <code>var(--space-md)</code>
            </div>
          </div>
          <div className="spacing-sample">
            <div className="spacing-box" style={{ width: 'var(--space-lg)' }}></div>
            <div className="spacing-label">
              <strong>lg:</strong> 24px (1.5rem)
              <code>var(--space-lg)</code>
            </div>
          </div>
          <div className="spacing-sample">
            <div className="spacing-box" style={{ width: 'var(--space-xl)' }}></div>
            <div className="spacing-label">
              <strong>xl:</strong> 32px (2rem)
              <code>var(--space-xl)</code>
            </div>
          </div>
          <div className="spacing-sample">
            <div className="spacing-box" style={{ width: 'var(--space-2xl)' }}></div>
            <div className="spacing-label">
              <strong>2xl:</strong> 48px (3rem)
              <code>var(--space-2xl)</code>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Button Components</h2>
        <p className="demo-description">
          Consistent button styles with semantic variants and sizes
        </p>

        <div className="demo-subsection">
          <h3>Button Variants</h3>
          <div className="button-demo">
            <button className="btn btn-primary">
              <Plus size={16} /> Primary Button
            </button>
            <button className="btn btn-secondary">
              <Download size={16} /> Secondary Button
            </button>
            <button className="btn btn-success">
              <CheckCircle size={16} /> Success Button
            </button>
            <button className="btn btn-warning">
              <AlertTriangle size={16} /> Warning Button
            </button>
            <button className="btn btn-danger">
              <AlertCircle size={16} /> Danger Button
            </button>
          </div>
        </div>

        <div className="demo-subsection">
          <h3>Button Sizes</h3>
          <div className="button-demo">
            <button className="btn btn-primary btn-sm">Small Button</button>
            <button className="btn btn-primary">Default Button</button>
            <button className="btn btn-primary btn-lg">Large Button</button>
          </div>
        </div>

        <div className="demo-subsection">
          <h3>Button States</h3>
          <div className="button-demo">
            <button className="btn btn-primary">Normal</button>
            <button className="btn btn-primary" disabled>Disabled</button>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Card Components</h2>
        <p className="demo-description">
          Flexible card containers with variants for different use cases
        </p>

        <div className="cards-demo-grid">
          {/* Standard Card */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Standard Card</h4>
              <DollarSign size={20} />
            </div>
            <div className="card-body">
              <div className="text-3xl font-bold mb-sm">R 1,234,567</div>
              <p className="text-sm text-light">
                Basic card with shadow and border-top accent
              </p>
            </div>
          </div>

          {/* Success Card */}
          <div className="card card-success">
            <div className="card-header">
              <h4 className="card-title">Success Card</h4>
              <TrendingUp size={20} />
            </div>
            <div className="card-body">
              <div className="text-3xl font-bold mb-sm">+15.2%</div>
              <p className="text-sm text-light">
                Green border-top for positive metrics
              </p>
            </div>
          </div>

          {/* Warning Card */}
          <div className="card card-warning">
            <div className="card-header">
              <h4 className="card-title">Warning Card</h4>
              <AlertTriangle size={20} />
            </div>
            <div className="card-body">
              <div className="text-3xl font-bold mb-sm">3 Items</div>
              <p className="text-sm text-light">
                Yellow border-top for attention items
              </p>
            </div>
          </div>

          {/* Primary Gradient Card */}
          <div className="card card-primary">
            <div className="card-header">
              <h4 className="card-title">Premium Card</h4>
              <Users size={20} />
            </div>
            <div className="card-body">
              <div className="text-3xl font-bold mb-sm">248</div>
              <p className="text-sm">
                Gradient background for hero metrics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Badge Components</h2>
        <p className="demo-description">
          Status indicators with semantic colors
        </p>

        <div className="badges-demo">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-danger">Danger</span>
          <span className="badge badge-info">Info</span>
        </div>

        <div className="code-sample">
          <code>{`<span className="badge badge-success">Active</span>`}</code>
        </div>
      </section>

      {/* Alerts Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Alert Components</h2>
        <p className="demo-description">
          Notification messages with contextual styling
        </p>

        <div className="alerts-demo">
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <div>
              <strong>Success!</strong> Your changes have been saved successfully.
            </div>
          </div>

          <div className="alert alert-info">
            <Info size={20} />
            <div>
              <strong>Information:</strong> New features are available in this release.
            </div>
          </div>

          <div className="alert alert-warning">
            <AlertTriangle size={20} />
            <div>
              <strong>Warning:</strong> Your subscription will expire in 7 days.
            </div>
          </div>

          <div className="alert alert-danger">
            <AlertCircle size={20} />
            <div>
              <strong>Error:</strong> Failed to connect to the server. Please try again.
            </div>
          </div>
        </div>
      </section>

      {/* Form Elements Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Form Components</h2>
        <p className="demo-description">
          Consistent form elements with proper focus states
        </p>

        <div className="form-demo">
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-control" 
              rows={3}
              placeholder="Enter description"
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control">
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <button className="btn btn-primary">
              <Search size={16} /> Submit Form
            </button>
          </div>
        </div>
      </section>

      {/* Utility Classes Section */}
      <section className="demo-section">
        <h2 className="demo-section-title">Utility Classes</h2>
        <p className="demo-description">
          Pre-built utility classes for rapid development
        </p>

        <div className="demo-subsection">
          <h3>Flexbox Utilities</h3>
          <div className="utility-example">
            <div className="flex items-center justify-between p-lg border rounded">
              <span>Left Content</span>
              <span className="badge badge-primary">Badge</span>
              <span>Right Content</span>
            </div>
            <code>{`<div className="flex items-center justify-between">`}</code>
          </div>
        </div>

        <div className="demo-subsection">
          <h3>Spacing Utilities</h3>
          <div className="utility-example">
            <div className="p-lg mb-md border rounded">
              <p className="mb-sm">Paragraph with margin-bottom-small</p>
              <p className="mt-lg">Paragraph with margin-top-large</p>
            </div>
            <code>{`className="p-lg mb-md mt-lg"`}</code>
          </div>
        </div>

        <div className="demo-subsection">
          <h3>Text Utilities</h3>
          <div className="utility-example">
            <p className="text-dark font-bold">Dark bold text</p>
            <p className="text-medium font-semibold">Medium semibold text</p>
            <p className="text-light font-normal">Light normal text</p>
            <p className="text-primary">Primary colored text</p>
            <code>{`className="text-dark font-bold"`}</code>
          </div>
        </div>

        <div className="demo-subsection">
          <h3>Grid Utilities</h3>
          <div className="utility-example">
            <div className="grid grid-cols-3 gap-md">
              <div className="p-md border rounded">Column 1</div>
              <div className="p-md border rounded">Column 2</div>
              <div className="p-md border rounded">Column 3</div>
            </div>
            <code>{`<div className="grid grid-cols-3 gap-md">`}</code>
          </div>
        </div>
      </section>

      {/* Real-World Example */}
      <section className="demo-section">
        <h2 className="demo-section-title">Real-World Example</h2>
        <p className="demo-description">
          Complete metric card using design system tokens
        </p>

        <div className="grid grid-cols-2 gap-lg">
          <div className="card">
            <div className="flex items-center justify-between mb-lg">
              <div>
                <h4 className="text-sm text-light font-semibold mb-xs">Total Revenue</h4>
                <div className="text-4xl font-bold text-dark">R 12,847,320</div>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <DollarSign size={28} />
              </div>
            </div>
            <div className="flex items-center gap-sm">
              <span className="text-success font-semibold text-sm">
                <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }} />
                +8.2%
              </span>
              <span className="text-light text-sm">from last month</span>
            </div>
            <div className="mt-md pt-md border-top">
              <span className="badge badge-success">Exceeding Target</span>
            </div>
          </div>

          <div className="code-sample" style={{ height: '100%' }}>
            <pre>{`<div className="card">
  <div className="flex items-center justify-between mb-lg">
    <div>
      <h4 className="text-sm text-light font-semibold mb-xs">
        Total Revenue
      </h4>
      <div className="text-4xl font-bold text-dark">
        R 12,847,320
      </div>
    </div>
    <div className="icon-gradient">
      <DollarSign size={28} />
    </div>
  </div>
  <div className="flex items-center gap-sm">
    <span className="text-success font-semibold text-sm">
      +8.2%
    </span>
    <span className="text-light text-sm">
      from last month
    </span>
  </div>
  <div className="mt-md pt-md border-top">
    <span className="badge badge-success">
      Exceeding Target
    </span>
  </div>
</div>`}</pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="demo-footer">
        <h3>Design System Benefits</h3>
        <div className="grid grid-cols-3 gap-lg mt-lg">
          <div className="text-center">
            <div className="text-4xl mb-md">⚡</div>
            <h4 className="mb-sm">80% Faster</h4>
            <p className="text-sm text-light">Development speed with reusable components</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-md">🎨</div>
            <h4 className="mb-sm">100% Consistent</h4>
            <p className="text-sm text-light">Visual harmony across all modules</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-md">🔧</div>
            <h4 className="mb-sm">Easy Maintenance</h4>
            <p className="text-sm text-light">Single source of truth for all styles</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemDemo;
