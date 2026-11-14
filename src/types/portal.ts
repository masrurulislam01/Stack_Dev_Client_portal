import {z} from 'zod';

export type ProjectPackage = 'basic' | 'premium' | 'custom';
export type ProjectStatus = 'Planning' | 'Design' | 'Development' | 'Review' | 'Delivered';

export const PROJECT_PACKAGES: {value: ProjectPackage; label: string}[] = [
  {value: 'basic', label: 'Basic'},
  {value: 'premium', label: 'Premium'},
  {value: 'custom', label: 'Custom'},
];

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Planning',
  'Design',
  'Development',
  'Review',
  'Delivered',
];

export type MilestoneStatus = 'Pending' | 'In Review' | 'Approved' | 'Changes Requested';

export const MILESTONE_STATUSES: MilestoneStatus[] = [
  'Pending',
  'In Review',
  'Approved',
  'Changes Requested',
];

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

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export const INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Overdue'];

export type PaymentMethod = 'bKash' | 'Nagad' | 'Bank' | 'Cash';

export const PAYMENT_METHODS: PaymentMethod[] = ['bKash', 'Nagad', 'Bank', 'Cash'];

export type OnlinePaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface PaymentRecord {
  id: string;
  tranId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  visibleToClientId: string;
  projectId: string;
  projectTitle: string;
  payerUid: string;
  payerName: string;
  payerEmail: string;
  amount: number;
  currency: string;
  status: OnlinePaymentStatus;
  gateway: string;
  sandbox: boolean;
  valId: string;
  bankTranId: string;
  paymentMethod: string;
  cardIssuer: string;
  cardBrand: string;
  gatewayError: string;
  paidAt?: unknown;
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

export type NotificationType = 'update' | 'message' | 'milestone' | 'invoice';

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

export const profileNameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must be 120 characters or fewer'),
});

export type ProfileNameFormValues = z.input<typeof profileNameFormSchema>;
export type ProfileNameFormParsed = z.output<typeof profileNameFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.input<typeof changePasswordFormSchema>;
export type ChangePasswordFormParsed = z.output<typeof changePasswordFormSchema>;

export const setNewPasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetNewPasswordFormValues = z.input<typeof setNewPasswordFormSchema>;
export type SetNewPasswordFormParsed = z.output<typeof setNewPasswordFormSchema>;

export const clientFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .max(120, 'Company name must be 120 characters or fewer')
    .default(''),
  contactName: z
    .string()
    .trim()
    .min(1, 'Client name is required')
    .max(120, 'Client name must be 120 characters or fewer'),
  phone: z
    .string()
    .trim()
    .max(40, 'Phone number must be 40 characters or fewer')
    .default(''),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(254, 'Email must be 254 characters or fewer'),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be 2000 characters or fewer')
    .default(''),
});

export type ClientFormValues = z.input<typeof clientFormSchema>;
export type ClientFormParsed = z.output<typeof clientFormSchema>;

export const projectFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Project title is required')
      .max(160, 'Project title must be 160 characters or fewer'),
    clientId: z.string().trim().min(1, 'Please select a client'),
    package: z.enum(['basic', 'premium', 'custom']),
    status: z.enum(['Planning', 'Design', 'Development', 'Review', 'Delivered']),
    progress: z.coerce
      .number()
      .int('Progress must be a whole number')
      .min(0, 'Progress cannot be less than 0%')
      .max(100, 'Progress cannot exceed 100%'),
    startDate: z.string().trim().min(1, 'Start date is required'),
    dueDate: z.string().trim().min(1, 'Due date is required'),
    revisionsAllowed: z.coerce
      .number()
      .int('Must be a whole number')
      .min(0, 'Cannot be negative')
      .max(1000, 'Maximum 1000'),
    revisionsUsed: z.coerce
      .number()
      .int('Must be a whole number')
      .min(0, 'Cannot be negative')
      .max(1000, 'Maximum 1000'),
    description: z
      .string()
      .trim()
      .max(5000, 'Description must be 5000 characters or fewer')
      .default(''),
  })
  .refine((data) => data.dueDate >= data.startDate, {
    message: 'Due date must be on or after the start date',
    path: ['dueDate'],
  });

export type ProjectFormValues = z.input<typeof projectFormSchema>;
export type ProjectFormParsed = z.output<typeof projectFormSchema>;

export const milestoneFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Milestone title is required')
    .max(160, 'Milestone title must be 160 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 characters or fewer')
    .default(''),
  dueDate: z.string().trim().min(1, 'Due date is required'),
  status: z.enum(['Pending', 'In Review', 'Approved', 'Changes Requested']).default('Pending'),
});

export type MilestoneFormValues = z.input<typeof milestoneFormSchema>;
export type MilestoneFormParsed = z.output<typeof milestoneFormSchema>;

export const timelineUpdateFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please write an update message')
    .max(2000, 'Update message must be 2000 characters or fewer'),
});

export type TimelineUpdateFormValues = z.input<typeof timelineUpdateFormSchema>;
export type TimelineUpdateFormParsed = z.output<typeof timelineUpdateFormSchema>;

export const invoiceLineItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(300, 'Description must be 300 characters or fewer'),
  quantity: z.coerce
    .number()
    .positive('Qty must be greater than 0')
    .max(10000, 'Max 10,000'),
  unitPrice: z.coerce
    .number()
    .min(0, 'Unit price cannot be negative')
    .max(100000000, 'Amount too large'),
});

export const invoiceFormSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Please select a client'),
    projectId: z.string().trim().min(1, 'Please select a project'),
    issueDate: z.string().trim().min(1, 'Issue date is required'),
    dueDate: z.string().trim().min(1, 'Due date is required'),
    status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']).default('Sent'),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes must be 2000 characters or fewer')
      .default(''),
    lineItems: z
      .array(invoiceLineItemSchema)
      .min(1, 'Add at least one line item')
      .max(50, 'Maximum 50 line items allowed'),
  })
  .refine((data) => data.dueDate >= data.issueDate, {
    message: 'Due date must be on or after the issue date',
    path: ['dueDate'],
  });

export type InvoiceFormValues = z.input<typeof invoiceFormSchema>;
export type InvoiceFormParsed = z.output<typeof invoiceFormSchema>;

export const markPaidFormSchema = z.object({
  paymentMethod: z.enum(['bKash', 'Nagad', 'Bank', 'Cash']),
  paymentReference: z
    .string()
    .trim()
    .max(500, 'Reference note must be 500 characters or fewer')
    .default(''),
});

export type MarkPaidFormValues = z.input<typeof markPaidFormSchema>;
export type MarkPaidFormParsed = z.output<typeof markPaidFormSchema>;

export type PaymentSubmissionMethod = 'bKash' | 'Nagad' | 'Bank';
export const PAYMENT_SUBMISSION_METHODS: PaymentSubmissionMethod[] = ['bKash', 'Nagad', 'Bank'];
export type PaymentSubmissionStatus = 'Pending' | 'Verified' | 'Rejected';

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

export const paymentSubmissionFormSchema = z.object({
  method: z.enum(['bKash', 'Nagad', 'Bank']),
  senderNumber: z
    .string()
    .trim()
    .min(6, 'Enter the sender phone or account number')
    .max(60, 'Sender number is too long'),
  transactionId: z
    .string()
    .trim()
    .min(3, 'Enter the transaction ID or reference')
    .max(120, 'Transaction ID is too long'),
  amountBdt: z.coerce
    .number()
    .positive('Amount must be greater than 0')
    .max(100000000, 'Amount is too large'),
});

export type PaymentSubmissionFormValues = z.input<typeof paymentSubmissionFormSchema>;
export type PaymentSubmissionFormParsed = z.output<typeof paymentSubmissionFormSchema>;

export const rejectPaymentFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Please provide a clear rejection reason (at least 3 characters)')
    .max(500, 'Reason must be 500 characters or fewer'),
});

export type RejectPaymentFormValues = z.input<typeof rejectPaymentFormSchema>;
export type RejectPaymentFormParsed = z.output<typeof rejectPaymentFormSchema>;


