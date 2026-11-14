import {z} from 'zod';
import {
  MAX_DATA_URL_LENGTH,
  MAX_FILE_SIZE_BYTES,
  PAYMENT_SUBMISSION_METHODS,
} from '@/config/constants';
import {hasUnsafeFileName} from '@/utils/fileSharing';

const SAFE_DATA_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function isSafeAttachmentUrl(src: string): boolean {
  if (SAFE_DATA_IMAGE_REGEX.test(src) && src.length <= MAX_DATA_URL_LENGTH) {
    return true;
  }
  if (src.length > 2048) return false;
  try {
    const parsed = new URL(src);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function isSafeInternalLink(link: string): boolean {
  return /^\/(?![/\\])[^\x00-\x1f\x7f]*$/.test(link) && link.length <= 300;
}

const safeAttachmentSchema = z
  .string()
  .trim()
  .refine(isSafeAttachmentUrl, 'Attachment must be a valid HTTPS URL or compressed raster image.');

const safeInternalLinkSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine(isSafeInternalLink, 'Notification link must be a valid internal portal path.');

const projectPackageEnum = z.enum(['basic', 'premium', 'custom']);
const projectStatusEnum = z.enum([
  'Planning',
  'Design',
  'Development',
  'Review',
  'Delivered',
]);
const milestoneStatusEnum = z.enum([
  'Pending',
  'In Review',
  'Approved',
  'Changes Requested',
]);
const invoiceStatusEnum = z.enum(['Draft', 'Sent', 'Paid', 'Overdue']);
const paymentMethodEnum = z.enum(['bKash', 'Nagad', 'Bank', 'Cash']);
const paymentSubmissionMethodEnum = z.enum(['bKash', 'Nagad', 'Bank']);
const paymentSubmissionStatusEnum = z.enum(['Pending', 'Verified', 'Rejected']);
const notificationTypeEnum = z.enum(['update', 'message', 'milestone', 'invoice']);
const userRoleEnum = z.enum(['admin', 'client']);

// ---------------------------------------------------------------------------
// Form Schemas
// ---------------------------------------------------------------------------

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(254, 'Email must be 254 characters or fewer'),
  password: z.string().min(1, 'Please enter your password.'),
});

export type LoginFormValues = z.input<typeof loginFormSchema>;
export type LoginFormParsed = z.output<typeof loginFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter your account email address.')
    .max(254, 'Email must be 254 characters or fewer'),
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
      .min(8, 'New password must be at least 8 characters')
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
      .min(8, 'Password must be at least 8 characters')
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
    package: projectPackageEnum,
    status: projectStatusEnum,
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
  status: milestoneStatusEnum.default('Pending'),
});

export type MilestoneFormValues = z.input<typeof milestoneFormSchema>;
export type MilestoneFormParsed = z.output<typeof milestoneFormSchema>;

export const milestoneReviewCommentSchema = z.object({
  feedback: z
    .string()
    .trim()
    .min(1, 'Please describe the changes you would like before submitting.')
    .max(2000, 'Feedback must be 2000 characters or fewer'),
});

export type MilestoneReviewCommentValues = z.input<typeof milestoneReviewCommentSchema>;
export type MilestoneReviewCommentParsed = z.output<typeof milestoneReviewCommentSchema>;

export const timelineUpdateFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please write an update message')
    .max(2000, 'Update message must be 2000 characters or fewer'),
});

export type TimelineUpdateFormValues = z.input<typeof timelineUpdateFormSchema>;
export type TimelineUpdateFormParsed = z.output<typeof timelineUpdateFormSchema>;

export const messageComposerSchema = z.object({
  text: z
    .string()
    .trim()
    .max(4000, 'Message must be 4000 characters or fewer')
    .default(''),
});

export type MessageComposerValues = z.input<typeof messageComposerSchema>;
export type MessageComposerParsed = z.output<typeof messageComposerSchema>;

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
    status: invoiceStatusEnum.default('Sent'),
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
  paymentMethod: paymentMethodEnum,
  paymentReference: z
    .string()
    .trim()
    .max(500, 'Reference note must be 500 characters or fewer')
    .default(''),
});

export type MarkPaidFormValues = z.input<typeof markPaidFormSchema>;
export type MarkPaidFormParsed = z.output<typeof markPaidFormSchema>;

export const paymentSubmissionFormSchema = z.object({
  method: paymentSubmissionMethodEnum,
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

// ---------------------------------------------------------------------------
// Service / API Input Schemas
// ---------------------------------------------------------------------------

export const signInInputSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export const resetPasswordInputSchema = z.object({
  email: z.string().trim().email('Please enter your account email address.'),
});

export const updateRecoveryPasswordInputSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const updateProfileNameInputSchema = z.object({
  profileId: z.string().trim().min(1),
  name: z
    .string()
    .trim()
    .min(1, 'Please enter a valid name (1 to 120 characters).')
    .max(120, 'Please enter a valid name (1 to 120 characters).'),
});

export const changePasswordInputSchema = z.object({
  email: z.string().trim().email(),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const createClientInputSchema = z.object({
  companyName: z.string().trim().max(120).optional().default(''),
  contactName: z.string().trim().min(1, 'Client name is required').max(120),
  phone: z.string().trim().max(40).optional().default(''),
  email: z.string().trim().email('Please enter a valid email address').max(254),
  notes: z.string().trim().max(2000).optional().default(''),
});

export const updateClientInputSchema = z.object({
  companyName: z.string().trim().max(120).optional(),
  contactName: z.string().trim().min(1, 'Client name is required').max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email('Please enter a valid email address').max(254).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const createProjectInputSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(160),
  clientId: z.string().trim().min(1, 'Please select a client'),
  package: projectPackageEnum,
  status: projectStatusEnum,
  progress: z.number().min(0).max(100),
  startDate: z.string().trim(),
  dueDate: z.string().trim(),
  revisionsAllowed: z.number().int().min(0).max(1000),
  revisionsUsed: z.number().int().min(0).max(1000),
  description: z.string().trim().max(5000),
});

export const updateProjectInputSchema = createProjectInputSchema.partial();

export const createMilestoneInputSchema = z.object({
  projectId: z.string().trim().min(1, 'Project ID is required'),
  title: z.string().trim().min(1, 'Milestone title is required').max(160),
  description: z.string().trim().max(2000).optional().default(''),
  dueDate: z.string().trim().optional().default(''),
  status: milestoneStatusEnum.optional().default('Pending'),
});

export const updateMilestoneInputSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().trim().optional(),
  status: milestoneStatusEnum.optional(),
  reviewComment: z.string().trim().max(2000).optional(),
  resetReviewMeta: z.boolean().optional(),
});

export const submitMilestoneReviewInputSchema = z
  .object({
    id: z.string().trim().min(1),
    decision: z.enum(['Approved', 'Changes Requested']),
    feedback: z.string().trim().max(2000).optional().default(''),
  })
  .refine(
    (data) => data.decision !== 'Changes Requested' || data.feedback.trim().length > 0,
    {
      message: 'Please describe the changes you would like before submitting.',
      path: ['feedback'],
    },
  );

export const createUpdateInputSchema = z.object({
  projectId: z.string().trim().min(1),
  authorId: z.string().trim(),
  message: z.string().trim().min(1, 'Please write an update message').max(2000),
  attachments: z.array(safeAttachmentSchema).max(4).optional(),
});

export const updateUpdateInputSchema = z.object({
  message: z.string().trim().min(1, 'Please write an update message').max(2000),
  attachments: z.array(safeAttachmentSchema).max(4).optional(),
});

export const fileUploadMetadataSchema = z.object({
  projectId: z.string().trim().min(1, 'Missing project identifier for upload.'),
  clientId: z.string().trim().min(1, 'Missing client identifier for upload.'),
  uploadedByUid: z.string().trim().min(1, 'Missing user identifier for upload.'),
  uploadedByName: z.string().trim().optional(),
  uploadedByRole: userRoleEnum.optional(),
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required')
    .max(260)
    .refine((name) => !hasUnsafeFileName(name), 'File name contains invalid characters.'),
  fileSize: z
    .number()
    .positive('File is empty and cannot be uploaded.')
    .max(MAX_FILE_SIZE_BYTES, 'File exceeds the 25 MB limit.'),
  mimeType: z.string().trim().min(1, 'File MIME type is required.'),
});

export const updateFileInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(260)
    .refine((name) => !hasUnsafeFileName(name), 'File name contains invalid characters.')
    .optional(),
});

export const createMessageInputSchema = z
  .object({
    projectId: z.string().trim().min(1),
    senderId: z.string().trim().min(1),
    text: z.string().trim().max(4000),
    fileId: z.string().trim().nullable().optional(),
    senderName: z.string().trim().optional(),
    senderRole: userRoleEnum.optional(),
  })
  .refine((data) => data.text.length > 0 || Boolean(data.fileId), {
    message: 'Enter a message or attach a file before sending.',
    path: ['text'],
  });

export const updateMessageInputSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

export const markThreadReadInputSchema = z.object({
  messageIds: z.array(z.string().trim().min(1)),
  userId: z.string().trim().min(1),
});

const invoiceLineItemFullSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().positive().max(10000),
  unitPrice: z.number().min(0).max(100000000),
  total: z.number().min(0),
});

export const createInvoiceInputSchema = z.object({
  clientId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  lineItems: z.array(invoiceLineItemFullSchema).min(1).max(50),
  totalBdt: z.number().min(0),
  issueDate: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
  notes: z.string().trim().max(2000).optional().default(''),
  status: invoiceStatusEnum,
  paymentMethod: z.string().trim().nullable().optional(),
  paymentReference: z.string().trim().nullable().optional(),
  paidAt: z.string().nullable().optional(),
});

export const updateInvoiceInputSchema = createInvoiceInputSchema.partial();

export const markInvoicePaidInputSchema = z.object({
  id: z.string().trim().min(1),
  paymentMethod: z.string().trim().min(1).max(120),
  paymentReference: z.string().trim().max(500).optional().default(''),
});

export const createPaymentSubmissionInputSchema = z.object({
  invoiceId: z.string().trim().min(1),
  submittedBy: z.string().trim().min(1),
  method: paymentSubmissionMethodEnum.refine((v) =>
    PAYMENT_SUBMISSION_METHODS.includes(v),
  ),
  senderNumber: z.string().trim().min(6).max(60),
  transactionId: z.string().trim().min(3).max(120),
  amountBdt: z.number().positive().max(100000000),
});

export const updatePaymentSubmissionInputSchema = z.object({
  status: paymentSubmissionStatusEnum.optional(),
  method: paymentSubmissionMethodEnum.optional(),
  senderNumber: z.string().trim().min(6).max(60).optional(),
  transactionId: z.string().trim().min(3).max(120).optional(),
  amountBdt: z.number().positive().max(100000000).optional(),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const rejectPaymentInputSchema = z.object({
  submissionId: z.string().trim().min(1),
  reason: z
    .string()
    .trim()
    .min(3, 'Please provide a clear rejection reason (at least 3 characters)')
    .max(500),
});

export const createNotificationRowInputSchema = z.object({
  userId: z.string().trim().min(1),
  type: notificationTypeEnum,
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(500),
  link: safeInternalLinkSchema,
});

export const createDispatchNotificationInputSchema = z.object({
  recipientRole: userRoleEnum,
  clientId: z.string().trim().optional(),
  type: notificationTypeEnum,
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(500),
  link: safeInternalLinkSchema,
});

export const updateNotificationInputSchema = z.object({
  isRead: z.boolean(),
});
