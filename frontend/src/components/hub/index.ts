/**
 * AetherOS Hub Design System
 * 
 * A collection of reusable components for building consistent,
 * professional Hub pages across the AetherOS ERP platform.
 * 
 * @module components/hub
 * @version 1.0.0
 * 
 * ## Quick Start
 * 
 * ```tsx
 * import {
 *   HubLayout,
 *   HubHeader,
 *   StatusBanner,
 *   HubTabs,
 *   StatCard,
 *   QuickActionsCard,
 * } from '@/components/hub';
 * 
 * const MyModule = () => (
 *   <HubLayout>
 *     <HubHeader
 *       title="My Module"
 *       subtitle="Description here"
 *       icon={<MyIcon />}
 *       gradient="blue"
 *     />
 *     <StatusBanner
 *       gradient="blue"
 *       icon={<DashboardOutlined />}
 *       title="Overview"
 *       subtitle="December 2025"
 *       stats={[...]}
 *     />
 *     <HubTabs theme="blue" tabs={[...]} />
 *   </HubLayout>
 * );
 * ```
 * 
 * ## Available Gradients
 * - green  - Success, financial positive
 * - blue   - Default, primary actions
 * - cyan   - HR, people-related
 * - purple - Practice, professional services
 * - pink   - Creative, engagement
 * - orange - Warnings, attention needed
 * - red    - Errors, critical status
 */

// Layout Components
export { HubLayout } from './HubLayout';
export { HubHeader } from './HubHeader';
export type { GradientTheme } from './HubHeader';
export { StatusBanner } from './StatusBanner';
export type { StatusStat } from './StatusBanner';
export { HubTabs } from './HubTabs';
export type { HubTab } from './HubTabs';

// Card Components
export {
  StatCard,
  ProgressCard,
  InfoListCard,
  QuickActionsCard,
  StatusIndicator,
} from './HubCards';
export type { InfoListItem, QuickAction } from './HubCards';

// Import the stylesheet
import './hub.css';
