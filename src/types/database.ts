export type DbUserRole = 'admin' | 'client';
export type DbProjectPackage = 'basic' | 'premium' | 'custom';
export type DbProjectStatus = 'Planning' | 'Design' | 'Development' | 'Review' | 'Delivered';
export type DbMilestoneStatus = 'Pending' | 'In Review' | 'Approved' | 'Changes Requested';
export type DbInvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';
export type DbPaymentSubmissionMethod = 'bKash' | 'Nagad' | 'Bank';
export type DbPaymentSubmissionStatus = 'Pending' | 'Verified' | 'Rejected';

export interface DbInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: DbUserRole;
  client_id: string | null;
  created_at: string;
}

export interface ProfileInsert {
  id: string;
  full_name?: string;
  email: string;
  role?: DbUserRole;
  client_id?: string | null;
  created_at?: string;
}

export interface ProfileUpdate {
  full_name?: string;
  email?: string;
  role?: DbUserRole;
  client_id?: string | null;
}

export interface ClientRow {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
  created_at: string;
}

export interface ClientInsert {
  id?: string;
  company_name: string;
  contact_name: string;
  phone?: string;
  email: string;
  notes?: string;
  created_at?: string;
}

export interface ClientUpdate {
  company_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface ProjectRow {
  id: string;
  client_id: string;
  title: string;
  description: string;
  package: DbProjectPackage;
  status: DbProjectStatus;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  revisions_allowed: number;
  revisions_used: number;
  created_at: string;
}

export interface ProjectInsert {
  id?: string;
  client_id: string;
  title: string;
  description?: string;
  package?: DbProjectPackage;
  status?: DbProjectStatus;
  progress?: number;
  start_date?: string | null;
  due_date?: string | null;
  revisions_allowed?: number;
  revisions_used?: number;
  created_at?: string;
}

export interface ProjectUpdate {
  client_id?: string;
  title?: string;
  description?: string;
  package?: DbProjectPackage;
  status?: DbProjectStatus;
  progress?: number;
  start_date?: string | null;
  due_date?: string | null;
  revisions_allowed?: number;
  revisions_used?: number;
}

export interface MilestoneRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: DbMilestoneStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string;
  created_at: string;
}

export interface MilestoneInsert {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string | null;
  status?: DbMilestoneStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  feedback?: string;
  created_at?: string;
}

export interface MilestoneUpdate {
  project_id?: string;
  title?: string;
  description?: string;
  due_date?: string | null;
  status?: DbMilestoneStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  feedback?: string;
}

export interface UpdateRow {
  id: string;
  project_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface UpdateInsert {
  id?: string;
  project_id: string;
  author_id?: string | null;
  body: string;
  created_at?: string;
}

export interface UpdateUpdate {
  body?: string;
}

export interface FileRow {
  id: string;
  project_id: string;
  uploaded_by: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
}

export interface FileInsert {
  id?: string;
  project_id: string;
  uploaded_by: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type?: string;
  created_at?: string;
}

export interface FileUpdate {
  name?: string;
  mime_type?: string;
}

export interface MessageRow {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  file_id: string | null;
  created_at: string;
}

export interface MessageInsert {
  id?: string;
  project_id: string;
  sender_id: string;
  body?: string;
  file_id?: string | null;
  created_at?: string;
}

export interface MessageUpdate {
  body?: string;
}

export interface MessageReadRow {
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface MessageReadInsert {
  message_id: string;
  user_id: string;
  read_at?: string;
}

export interface InvoiceRow {
  id: string;
  client_id: string;
  project_id: string;
  invoice_number: string;
  items: DbInvoiceLineItem[];
  total_bdt: number;
  issue_date: string;
  due_date: string;
  notes: string;
  status: DbInvoiceStatus;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
}

export interface InvoiceInsert {
  id?: string;
  client_id: string;
  project_id: string;
  invoice_number?: string;
  items: DbInvoiceLineItem[];
  total_bdt: number;
  issue_date?: string;
  due_date: string;
  notes?: string;
  status?: DbInvoiceStatus;
  paid_at?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  created_at?: string;
}

export interface InvoiceUpdate {
  client_id?: string;
  project_id?: string;
  invoice_number?: string;
  items?: DbInvoiceLineItem[];
  total_bdt?: number;
  issue_date?: string;
  due_date?: string;
  notes?: string;
  status?: DbInvoiceStatus;
  paid_at?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
}

export interface PaymentSubmissionRow {
  id: string;
  invoice_id: string;
  submitted_by: string;
  method: DbPaymentSubmissionMethod;
  sender_number: string;
  transaction_id: string;
  amount_bdt: number;
  status: DbPaymentSubmissionStatus;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface PaymentSubmissionInsert {
  id?: string;
  invoice_id: string;
  submitted_by: string;
  method: DbPaymentSubmissionMethod;
  sender_number: string;
  transaction_id: string;
  amount_bdt: number;
  status?: DbPaymentSubmissionStatus;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at?: string;
}

export interface PaymentSubmissionUpdate {
  method?: DbPaymentSubmissionMethod;
  sender_number?: string;
  transaction_id?: string;
  amount_bdt?: number;
  status?: DbPaymentSubmissionStatus;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  type?: string;
  title: string;
  body?: string;
  link?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface NotificationUpdate {
  is_read?: boolean;
  title?: string;
  body?: string;
  link?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      clients: {
        Row: ClientRow;
        Insert: ClientInsert;
        Update: ClientUpdate;
      };
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      milestones: {
        Row: MilestoneRow;
        Insert: MilestoneInsert;
        Update: MilestoneUpdate;
      };
      updates: {
        Row: UpdateRow;
        Insert: UpdateInsert;
        Update: UpdateUpdate;
      };
      files: {
        Row: FileRow;
        Insert: FileInsert;
        Update: FileUpdate;
      };
      messages: {
        Row: MessageRow;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
      message_reads: {
        Row: MessageReadRow;
        Insert: MessageReadInsert;
        Update: Partial<MessageReadInsert>;
      };
      invoices: {
        Row: InvoiceRow;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
      payment_submissions: {
        Row: PaymentSubmissionRow;
        Insert: PaymentSubmissionInsert;
        Update: PaymentSubmissionUpdate;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      my_client_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      next_invoice_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      verify_payment_submission: {
        Args: {p_submission_id: string};
        Returns: PaymentSubmissionRow;
      };
      reject_payment_submission: {
        Args: {p_submission_id: string; p_reason: string};
        Returns: PaymentSubmissionRow;
      };
    };
  };
}
