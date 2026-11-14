import {z} from 'zod';

// ---------------------------------------------------------------------------
// Auth & Profile Forms
// ---------------------------------------------------------------------------

export const loginFormSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export type LoginFormValues = z.input<typeof loginFormSchema>;
export type LoginFormParsed = z.output<typeof loginFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().email('Please enter the email address associated with your account.'),
});

export type ForgotPasswordFormValues = z.input<typeof forgotPasswordFormSchema>;
export type ForgotPasswordFormParsed = z.output<typeof forgotPasswordFormSchema>;

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

// ---------------------------------------------------------------------------
// Clients (Form & API Schemas)
// ---------------------------------------------------------------------------

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

export const createClientApiSchema = clientFormSchema;
export const updateClientApiSchema = clientFormSchema.partial();

// ---------------------------------------------------------------------------
// Projects (Form & API Schemas)
// ---------------------------------------------------------------------------

export const projectBaseSchema = z.object({
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
});

export const projectFormSchema = projectBaseSchema.refine(
  (data) => data.dueDate >= data.startDate,
  {
    message: 'Due date must be on or after the start date',
    path: ['dueDate'],
  },
);

export type ProjectFormValues = z.input<typeof projectFormSchema>;
export type ProjectFormParsed = z.output<typeof projectFormSchema>;

export const createProjectApiSchema = projectFormSchema;
export const updateProjectApiSchema = projectBaseSchema.partial();

// ---------------------------------------------------------------------------
// Milestones (Form & API Schemas)
// ---------------------------------------------------------------------------

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

export const createMilestoneApiSchema = z.object({
  projectId: z.string().trim().min(1, 'Project ID is required'),
  title: z.string().trim().min(1, 'Milestone title is required').max(160),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().trim().optional(),
  status: z.enum(['Pending', 'In Review', 'Approved', 'Changes Requested']).optional(),
});

export const updateMilestoneApiSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().trim().optional(),
  status: z.enum(['Pending', 'In Review', 'Approved', 'Changes Requested']).optional(),
  reviewComment: z.string().trim().max(2000).optional(),
  resetReviewMeta: z.boolean().optional(),
});

export const clientMilestoneReviewApiSchema = z
  .object({
    id: z.string().trim().min(1, 'Milestone ID is required'),
    decision: z.enum(['Approved', 'Changes Requested']),
    feedback: z.string().trim().max(2000).default(''),
  })
  .refine(
    (data) => data.decision !== 'Changes Requested' || data.feedback.length > 0,
    {
      message: 'Please describe the changes you would like before submitting.',
      path: ['feedback'],
    },
  );

// ---------------------------------------------------------------------------
// Timeline Updates (Form & API Schemas)
// ---------------------------------------------------------------------------

export const timelineUpdateFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please write an update message')
    .max(2000, 'Update message must be 2000 characters or fewer'),
});

export type TimelineUpdateFormValues = z.input<typeof timelineUpdateFormSchema>;
export type TimelineUpdateFormParsed = z.output<typeof timelineUpdateFormSchema>;

export const createUpdateApiSchema = z.object({
  projectId: z.string().trim().min(1, 'Project ID is required'),
  authorId: z.string().trim().min(1, 'Author ID is required'),
  message: z.string().trim().min(1, 'Update message is required').max(2000),
  attachments: z.array(z.string()).max(3).optional(),
});

export const updateUpdateApiSchema = z.object({
  message: z.string().trim().min(1, 'Update message is required').max(2000),
  attachments: z.array(z.string()).max(3).optional(),
});

// ---------------------------------------------------------------------------
// Invoices & Mark Paid (Form & API Schemas)
// ---------------------------------------------------------------------------

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

const apiInvoiceLineItemSchema = invoiceLineItemSchema.extend({
  total: z.number().min(0),
});

export const createInvoiceApiSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  projectId: z.string().trim().min(1, 'Project ID is required'),
  lineItems: z.array(apiInvoiceLineItemSchema).min(1).max(50),
  totalBdt: z.number().min(0).max(1000000000),
  issueDate: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']),
  paymentMethod: z.string().trim().max(120).nullable().optional(),
  paymentReference: z.string().trim().max(500).nullable().optional(),
  paidAt: z.string().nullable().optional(),
});

export const updateInvoiceApiSchema = createInvoiceApiSchema.partial();

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

// ---------------------------------------------------------------------------
// Payments (Form & API Schemas)
// ---------------------------------------------------------------------------

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

export const createPaymentSubmissionApiSchema = paymentSubmissionFormSchema.extend({
  invoiceId: z.string().trim().min(1, 'Invoice ID is required'),
  submittedBy: z.string().trim().min(1, 'Submitter user ID is required'),
});

export const updatePaymentSubmissionApiSchema = z.object({
  status: z.enum(['Pending', 'Verified', 'Rejected']).optional(),
  method: z.enum(['bKash', 'Nagad', 'Bank']).optional(),
  senderNumber: z.string().trim().min(6).max(60).optional(),
  transactionId: z.string().trim().min(3).max(120).optional(),
  amountBdt: z.number().positive().max(100000000).optional(),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const rejectPaymentFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Please provide a clear rejection reason (at least 3 characters)')
    .max(500, 'Reason must be 500 characters or fewer'),
});

export type RejectPaymentFormValues = z.input<typeof rejectPaymentFormSchema>;
export type RejectPaymentFormParsed = z.output<typeof rejectPaymentFormSchema>;

// ---------------------------------------------------------------------------
// Files, Messages & Notifications (API Schemas)
// ---------------------------------------------------------------------------

export const createFileMetadataApiSchema = z.object({
  projectId: z.string().trim().min(1, 'Project ID is required'),
  clientId: z.string().trim().min(1, 'Client ID is required'),
  uploadedByUid: z.string().trim().min(1, 'Uploader ID is required'),
  mimeType: z.string().trim().min(1, 'MIME type is required'),
});

export const updateFileMetadataApiSchema = z.object({
  name: z.string().trim().min(1, 'File name is required').max(260).optional(),
});

export const createMessageApiSchema = z
  .object({
    projectId: z.string().trim().min(1, 'Project ID is required'),
    senderId: z.string().trim().min(1, 'Sender ID is required'),
    text: z.string().trim().max(4000, 'Message must be 4000 characters or fewer'),
    fileId: z.string().trim().nullable().optional(),
    senderName: z.string().trim().optional(),
    senderRole: z.enum(['admin', 'client']).optional(),
  })
  .refine((data) => data.text.length > 0 || Boolean(data.fileId), {
    message: 'Message text or file attachment is required.',
  });

export const updateMessageApiSchema = z.object({
  text: z.string().trim().min(1, 'Message text is required').max(4000),
});

export const createNotificationRowApiSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
  type: z.enum(['update', 'message', 'milestone', 'invoice']),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(500),
  link: z.string().trim().min(1).max(300),
});

export const dispatchNotificationApiSchema = z.object({
  recipientRole: z.enum(['admin', 'client']),
  clientId: z.string().trim().optional(),
  type: z.enum(['update', 'message', 'milestone', 'invoice']),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(500),
  link: z.string().trim().min(1).max(300),
});

export const updateNotificationApiSchema = z.object({
  isRead: z.boolean(),
});
