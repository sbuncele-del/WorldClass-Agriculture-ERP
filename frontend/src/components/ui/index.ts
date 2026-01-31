/**
 * UI Components Index
 * Central export for all custom UI components
 */

// Loading & Empty States
export { DashboardSkeleton, TableSkeleton, FormSkeleton, CardGridSkeleton, PageSkeleton } from './LoadingSkeletons';
export { InvoicesEmpty, CustomersEmpty, InventoryEmpty, ReportsEmpty, GenericEmpty } from './EmptyStates';

// Notifications
export { toast, notify, destroyAll } from './Toast';

// Navigation
export { BreadcrumbNav } from './BreadcrumbNav';
export { default as CommandPalette } from './CommandPalette';
export { PageHeader, SectionHeader } from './PageHeader';

// Data Display
export { EnhancedTable, DataTable } from './EnhancedTable';
export { AnimatedNumber, StatCard, StatsGrid, MiniStat, ComparisonStat } from './StatsCard';
export { MetricsGrid } from './MetricsGrid';
export { StatusBadge } from './StatusBadge';
export { ActionMenu, EditDeleteMenu, ViewEditDeleteMenu } from './ActionMenu';

// Forms
export { AutoSaveForm, InlineEdit, CharCountInput, DirtyForm, FormUtils } from './FormEnhancements';

// Theme
export { ThemeProvider, useTheme, ThemeToggle, ThemeSwitch, ThemeModeSelector } from './ThemeProvider';

// Keyboard
export { KeyboardShortcutsProvider, useKeyboardShortcuts, useShortcut } from './KeyboardShortcuts';

// Search
export { GlobalSearch } from './GlobalSearch';

// Error Handling
export { default as ErrorBoundary } from '../ErrorBoundary';
