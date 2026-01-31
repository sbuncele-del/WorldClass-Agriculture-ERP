/**
 * SARS Correspondence Model
 * Tracks all SARS letters, notices, and communications
 */

export enum DocumentType {
  VAT_VERIFICATION = 'VAT_VERIFICATION',
  VAT_AUDIT = 'VAT_AUDIT',
  PAYE_AUDIT = 'PAYE_AUDIT',
  PAYE_VERIFICATION = 'PAYE_VERIFICATION',
  INCOME_TAX_ASSESSMENT = 'INCOME_TAX_ASSESSMENT',
  ITA34_RETURN = 'ITA34_RETURN',
  ITA88_OBJECTION = 'ITA88_OBJECTION',
  CUSTOMS_NOTICE = 'CUSTOMS_NOTICE',
  UIF_VERIFICATION = 'UIF_VERIFICATION',
  SDL_VERIFICATION = 'SDL_VERIFICATION',
  GENERAL_CORRESPONDENCE = 'GENERAL_CORRESPONDENCE',
}

export enum CorrespondenceSource {
  EFILING = 'EFILING',
  EMAIL = 'EMAIL',
  MANUAL_UPLOAD = 'MANUAL_UPLOAD',
  POSTAL_MAIL = 'POSTAL_MAIL',
}

export enum CorrespondenceStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PENDING_SUBMISSION = 'PENDING_SUBMISSION',
  SUBMITTED = 'SUBMITTED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ParsedContent {
  reference_number?: string;
  tax_period?: string;
  tax_type?: string;
  amount_due?: number;
  query_description?: string;
  required_documents?: string[];
  action_items?: string[];
}

export interface SARSCorrespondence {
  id: string;
  reference_number: string;
  document_type: DocumentType;
  source: CorrespondenceSource;
  received_date: Date;
  deadline_date?: Date;
  status: CorrespondenceStatus;
  urgency_level: UrgencyLevel;
  confidence_score: number; // 0-1, AI confidence in parsing
  
  // Content
  subject: string;
  original_document_url: string;
  parsed_content: ParsedContent;
  ai_summary?: string;
  
  // Assignment
  assigned_to_user_id?: string;
  assigned_to_department?: string;
  client_id: string;
  company_id: string;
  
  // Metadata
  tags: string[];
  notes?: string;
  
  // Audit trail
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

// SQL Schema
export const CORRESPONDENCE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sars_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(100) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,
  received_date TIMESTAMP WITH TIME ZONE NOT NULL,
  deadline_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'NEW',
  urgency_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  confidence_score DECIMAL(3, 2) DEFAULT 0.00,
  
  subject TEXT NOT NULL,
  original_document_url TEXT NOT NULL,
  parsed_content JSONB,
  ai_summary TEXT,
  
  assigned_to_user_id UUID,
  assigned_to_department VARCHAR(100),
  client_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  tags TEXT[],
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID,
  
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_assigned_user FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

CREATE INDEX idx_correspondence_deadline ON sars_correspondence(deadline_date) WHERE deadline_date IS NOT NULL;
CREATE INDEX idx_correspondence_status ON sars_correspondence(status);
CREATE INDEX idx_correspondence_client ON sars_correspondence(client_id);
CREATE INDEX idx_correspondence_urgency ON sars_correspondence(urgency_level);
CREATE INDEX idx_correspondence_document_type ON sars_correspondence(document_type);
`;
