export type ProjectPackage = 'basic' | 'premium' | 'custom';
export type ProjectStatus = 'Planning' | 'Design' | 'Development' | 'Review' | 'Delivered';
export type MilestoneStatus = 'Pending' | 'In Review' | 'Approved' | 'Changes Requested';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';
export type PaymentMethod = 'bKash' | 'Nagad' | 'Bank' | 'Cash';
export type PaymentSubmissionMethod = 'bKash' | 'Nagad' | 'Bank';
export type PaymentSubmissionStatus = 'Pending' | 'Verified' | 'Rejected';
export type NotificationType = 'update' | 'message' | 'milestone' | 'invoice';
export type OnlinePaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface ClientRecord {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
  hasLoginAccount: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProjectRecord {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  package: ProjectPackage;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  dueDate: string;
  revisionsAllowed: number;
  revisionsUsed: number;
  description: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceRecord {
  id: string;
  clientId: string;
  visibleToClientId: string;
  clientName: string;
  clientEmail: string;
  projectId: string;
  projectTitle: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  amount: number;
  issueDate: string;
  dueDate: string;
  notes: string;
  status: InvoiceStatus;
  paymentMethod: string;
  paymentReference: string;
  paidAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProjectUpdateRecord {
  id: string;
  clientId: string;
  projectId: string;
  projectTitle: string;
  message: string;
  authorName: string;
  authorId: string;
  attachments: string[];
  createdAt?: unknown;
}

export interface MilestoneRecord {
  id: string;
  clientId: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  reviewComment: string;
  actionByName: string;
  actionByUid: string;
  actionAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProjectFileRecord {
  id: string;
  clientId: string;
  projectId: string;
  projectTitle: string;
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  storagePath: string;
  downloadUrl: string;
  uploadedByUid: string;
  uploadedByName: string;
  uploadedByRole: 'admin' | 'client';
  createdAt?: unknown;
}

export interface ProjectMessageAttachment {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  downloadUrl: string;
  storagePath: string;
}

export interface ProjectMessageRecord {
  id: string;
  clientId: string;
  projectId: string;
  projectTitle: string;
  text: string;
  senderUid: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  attachment: ProjectMessageAttachment | null;
  readByAdmin: boolean;
  readByClient: boolean;
  createdAt?: unknown;
}

export interface NotificationRecord {
  id: string;
  recipientRole: 'admin' | 'client';
  clientId: string;
  visibleToClientId: string;
  projectId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  actorUid: string;
  actorName: string;
  read: boolean;
  createdAt?: unknown;
}

export interface PaymentSubmissionRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  invoiceAmountBdt: number;
  clientId: string;
  clientName: string;
  projectId: string;
  projectTitle: string;
  submittedBy: string;
  submittedByName: string;
  method: PaymentSubmissionMethod;
  senderNumber: string;
  transactionId: string;
  amountBdt: number;
  status: PaymentSubmissionStatus;
  rejectionReason: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt?: unknown;
}

// Re-export centralized constants & schemas for convenient imports
export {
  INVOICE_STATUSES,
  MILESTONE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_SUBMISSION_METHODS,
  PROJECT_PACKAGES,
  PROJECT_STATUSES,
} from '@/lib/constants';

export * from '@/types/schemas';
