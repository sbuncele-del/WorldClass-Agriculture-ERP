/**
 * Approval Workflows TypeScript Models
 * Type definitions for approval workflow system
 */

// ==================== ENUMS ====================

export enum ApprovalStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  ESCALATED = 'ESCALATED',
}

export enum ApprovalAction {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  ESCALATED = 'ESCALATED',
  REASSIGNED = 'REASSIGNED',
  COMMENTED = 'COMMENTED',
}

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EntityType {
  JOURNAL_ENTRY = 'JOURNAL_ENTRY',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
}

export enum ApproverRole {
  MANAGER = 'MANAGER',
  FINANCIAL_CONTROLLER = 'FINANCIAL_CONTROLLER',
  CFO = 'CFO',
  CEO = 'CEO',
  ADMIN = 'ADMIN',
}

export enum NotificationType {
  NEW_REQUEST = 'NEW_REQUEST',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  REMINDER = 'REMINDER',
  COMPLETED = 'COMPLETED',
  REASSIGNED = 'REASSIGNED',
}

// ==================== INTERFACES ====================

export interface ApprovalLevel {
  level: number;
  approver_role: string;
  approver_title: string;
  approver_user_id?: number;
  required: boolean;
  parallel?: boolean; // Can be approved in parallel with other levels
}

export interface ApprovalWorkflowRule {
  rule_id?: number;
  rule_name: string;
  entity_type: string;
  description?: string;

  // Trigger Conditions
  min_amount?: number;
  max_amount?: number;
  account_types?: string[];
  source_types?: string[];
  dimension_codes?: string[];

  // Approval Levels
  approval_levels: ApprovalLevel[];

  // Workflow Settings
  require_all_levels: boolean;
  allow_skip_levels: boolean;
  auto_approve_threshold?: number;
  escalation_days?: number;

  // Status
  is_active: boolean;
  priority: number;

  // Audit
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}

export interface ApprovalRequest {
  request_id?: number;

  // Entity Reference
  entity_type: string;
  entity_id: number;
  entity_reference?: string;

  // Workflow Rule
  rule_id?: number;

  // Request Details
  requested_by: number;
  requested_at?: Date;
  amount?: number;
  description?: string;

  // Current Status
  status: ApprovalStatus;
  current_level: number;
  total_levels: number;

  // Completion
  completed_at?: Date;
  completed_by?: number;

  // Metadata
  metadata?: Record<string, any>;
}

export interface ApprovalHistory {
  history_id?: number;

  // Request Reference
  request_id: number;

  // Action
  action: ApprovalAction;
  level_number?: number;
  approver_id?: number;
  approver_name?: string;
  approver_role?: string;

  // Decision
  decision?: ApprovalDecision;
  comments?: string;

  // Timing
  action_at?: Date;
  time_taken_hours?: number;

  // Metadata
  ip_address?: string;
  user_agent?: string;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
}

export interface ApprovalDelegate {
  delegate_id?: number;

  // Delegation
  principal_user_id: number;
  delegate_user_id: number;

  // Scope
  entity_types?: string[];
  max_amount?: number;

  // Validity
  start_date: Date;
  end_date: Date;
  is_active: boolean;

  // Reason
  reason?: string;

  // Audit
  created_at?: Date;
  created_by?: number;
}

export interface ApprovalNotification {
  notification_id?: number;

  // Request Reference
  request_id: number;

  // Recipient
  user_id: number;
  notification_type: NotificationType;

  // Content
  title: string;
  message: string;
  action_url?: string;

  // Status
  is_read: boolean;
  read_at?: Date;

  // Delivery
  sent_at?: Date;
  email_sent: boolean;
  email_sent_at?: Date;

  // Metadata
  metadata?: Record<string, any>;
}

// ==================== REQUEST/RESPONSE DTOs ====================

export interface SubmitForApprovalDTO {
  entity_type: string;
  entity_id: number;
  entity_reference?: string;
  amount?: number;
  description?: string;
  requested_by: number;
  metadata?: Record<string, any>;
}

export interface ApproveRejectDTO {
  request_id: number;
  approver_id: number;
  approver_name: string;
  approver_role: string;
  decision: ApprovalDecision;
  comments?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface CreateWorkflowRuleDTO {
  rule_name: string;
  entity_type: string;
  description?: string;
  min_amount?: number;
  max_amount?: number;
  account_types?: string[];
  source_types?: string[];
  approval_levels: ApprovalLevel[];
  require_all_levels?: boolean;
  auto_approve_threshold?: number;
  escalation_days?: number;
  priority?: number;
  created_by: number;
}

export interface UpdateWorkflowRuleDTO {
  rule_name?: string;
  description?: string;
  min_amount?: number;
  max_amount?: number;
  approval_levels?: ApprovalLevel[];
  require_all_levels?: boolean;
  auto_approve_threshold?: number;
  escalation_days?: number;
  is_active?: boolean;
  priority?: number;
  updated_by: number;
}

export interface PendingApproval {
  request_id: number;
  entity_type: string;
  entity_id: number;
  entity_reference: string;
  description: string;
  amount: number;
  requested_by: number;
  requester_name: string;
  requested_at: Date;
  current_level: number;
  total_levels: number;
  awaiting_role: string;
  awaiting_title: string;
  days_pending: number;
  is_escalated: boolean;
}

export interface ApprovalSummary {
  total_pending: number;
  pending_my_approval: number;
  pending_my_level: number;
  approved_today: number;
  rejected_today: number;
  escalated_count: number;
  avg_approval_time_hours: number;
}

export interface WorkflowMatchResult {
  matched: boolean;
  rule?: ApprovalWorkflowRule;
  auto_approved?: boolean;
  reason?: string;
}

// ==================== SERVICE RESPONSES ====================

export interface ApprovalRequestResponse {
  request: ApprovalRequest;
  history: ApprovalHistory[];
  current_approvers: Array<{
    role: string;
    title: string;
    user_id?: number;
    user_name?: string;
  }>;
  can_approve: boolean;
  can_reject: boolean;
}

export interface ApprovalHistoryDetail extends ApprovalHistory {
  entity_reference?: string;
  entity_description?: string;
  entity_amount?: number;
  final_status?: ApprovalStatus;
}
