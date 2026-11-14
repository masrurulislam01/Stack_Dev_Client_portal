export const AGENCY_INFO = {
  name: 'Stack Dev',
  address: 'Stack Dev, Savar, Dhaka',
  phone: '+880 1963-131282',
} as const;

export const CURRENCY = {
  code: 'BDT',
  symbol: '৳',
  locale: 'en-US',
} as const;

export function formatBDT(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY.symbol}${new Intl.NumberFormat(CURRENCY.locale, {
    maximumFractionDigits: 0,
  }).format(safeAmount)}`;
}

export function formatPdfBDT(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY.code} ${new Intl.NumberFormat(CURRENCY.locale, {
    maximumFractionDigits: 0,
  }).format(safeAmount)}`;
}

export type ProjectPackage = 'basic' | 'premium' | 'custom';
export type ProjectStatus = 'Planning' | 'Design' | 'Development' | 'Review' | 'Delivered';
export type MilestoneStatus = 'Pending' | 'In Review' | 'Approved' | 'Changes Requested';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';
export type PaymentMethod = 'bKash' | 'Nagad' | 'Bank' | 'Cash';
export type PaymentSubmissionMethod = 'bKash' | 'Nagad' | 'Bank';
export type PaymentSubmissionStatus = 'Pending' | 'Verified' | 'Rejected';
export type OnlinePaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type NotificationType = 'update' | 'message' | 'milestone' | 'invoice';

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

export const MILESTONE_STATUSES: MilestoneStatus[] = [
  'Pending',
  'In Review',
  'Approved',
  'Changes Requested',
];

export const INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Overdue'];

export const PAYMENT_METHODS: PaymentMethod[] = ['bKash', 'Nagad', 'Bank', 'Cash'];

export const PAYMENT_SUBMISSION_METHODS: PaymentSubmissionMethod[] = [
  'bKash',
  'Nagad',
  'Bank',
];

export const PAYMENT_SUBMISSION_STATUSES: PaymentSubmissionStatus[] = [
  'Pending',
  'Verified',
  'Rejected',
];

export interface PaymentChannelInfo {
  readonly label: string;
  readonly accountType: string;
  readonly number: string;
  readonly instructions: string;
}

export const PAYMENT_NUMBERS: Record<PaymentSubmissionMethod, PaymentChannelInfo> = {
  bKash: {
    label: 'bKash',
    accountType: 'Personal (Send Money)',
    number: '01963-131282',
    instructions: 'Open bKash app → Send Money → Enter the number and exact amount.',
  },
  Nagad: {
    label: 'Nagad',
    accountType: 'Personal (Send Money)',
    number: '01963-131282',
    instructions: 'Open Nagad app → Send Money → Enter the number and exact amount.',
  },
  Bank: {
    label: 'Bank Transfer',
    accountType: 'Bank Account / NPSB / BEFTN',
    number: 'Stack Dev · Contact team for bank account details',
    instructions:
      'Complete a bank transfer for the exact BDT amount and enter your bank reference ID.',
  },
};

export const PAYMENT_REJECT_QUICK_REASONS = [
  'Transaction ID not found in bKash/Nagad statement',
  'Amount received does not match the submitted amount',
  'Sender phone number does not match our statement',
  'Duplicate or invalid Transaction ID',
] as const;

export const PAYMENT_FAILURE_REASON_MESSAGES: Record<string, string> = {
  not_found: 'No matching payment record was found for that transaction reference.',
  payment_not_found: 'No matching payment record was found for this transaction ID.',
  validation_failed:
    'The payment could not be verified yet. No charge was applied to your invoice.',
  verification_error:
    'An error occurred while confirming this transaction. Please check your invoice status or try again.',
  gateway_failed: 'The payment was declined or could not be completed.',
  invalid_parameters: 'Missing or invalid payment verification parameters.',
  tran_id_mismatch: 'Transaction ID did not match the submitted payment record.',
  currency_mismatch: 'Currency did not match BDT. Payment was rejected.',
  hash_mismatch: 'Payment security validation did not match.',
  amount_mismatch: 'Payment amount did not match the invoice total.',
  missing_tran_id: 'No transaction reference was provided by the gateway.',
  cancelled: 'You cancelled the payment before completing checkout.',
};

export const STORAGE_BUCKET = 'project-files';
export const SIGNED_URL_EXPIRY_SECONDS = 60;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'heic',
  'heif',
] as const;

export const ALLOWED_EXTENSIONS = [
  ...ALLOWED_IMAGE_EXTENSIONS,
  'pdf',
  'zip',
  'doc',
  'docx',
  'xls',
  'xlsx',
] as const;

export const ALLOWED_BUCKET_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const FILE_INPUT_ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/heic',
  'image/heif',
  '.pdf',
  '.zip',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
].join(',');

export const EXTENSION_MIME_DEFAULTS: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const EXTENSION_ALLOWED_MIMES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  zip: [
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/x-compressed',
    'application/octet-stream',
  ],
  doc: ['application/msword', 'application/octet-stream'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ],
  xls: ['application/vnd.ms-excel', 'application/octet-stream'],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ],
};

export const TIMELINE_MAX_IMAGE_ATTACHMENTS = 4;
export const MAX_IMAGE_DIMENSION = 1024;
export const MAX_DATA_URL_LENGTH = 340000;

export const PROJECT_STATUS_TEXT_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'text-info-text',
  Design: 'text-primary-600',
  Development: 'text-warning-text',
  Review: 'text-accent-gold',
  Delivered: 'text-success-text',
};

export const PROJECT_STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'bg-info',
  Design: 'bg-primary-600',
  Development: 'bg-warning',
  Review: 'bg-accent-gold',
  Delivered: 'bg-success',
};

export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'bg-info-soft text-info-text border border-info/25',
  Design: 'bg-primary-50 text-primary-700 border border-primary-200',
  Development: 'bg-warning-soft text-warning-text border border-warning/25',
  Review: 'bg-accent-gold-soft text-foreground border border-accent-gold/30',
  Delivered: 'bg-success-soft text-success-text border border-success/25',
};

export const MILESTONE_DOT_CLASSES: Record<MilestoneStatus, string> = {
  Pending: 'bg-subtle',
  'In Review': 'bg-warning',
  Approved: 'bg-success',
  'Changes Requested': 'bg-danger',
};

export const MILESTONE_BADGE_CLASSES: Record<MilestoneStatus, string> = {
  Pending: 'bg-surface-muted text-muted border border-border',
  'In Review': 'bg-warning-soft text-warning-text border border-warning/25',
  Approved: 'bg-success-soft text-success-text border border-success/25',
  'Changes Requested': 'bg-danger-soft text-danger-text border border-danger/25',
};

export const INVOICE_STATUS_DOT_CLASSES: Record<InvoiceStatus, string> = {
  Draft: 'bg-subtle',
  Sent: 'bg-info',
  Paid: 'bg-success',
  Overdue: 'bg-danger',
};

export const INVOICE_STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  Draft: 'bg-surface-muted text-muted border border-border',
  Sent: 'bg-info-soft text-info-text border border-info/25',
  Paid: 'bg-success-soft text-success-text border border-success/25',
  Overdue: 'bg-danger-soft text-danger-text border border-danger/25',
};

export const INVOICE_PRINT_STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  Draft: 'bg-surface-muted text-muted border border-border',
  Sent: 'bg-info-soft text-info-text border border-info/30',
  Paid: 'bg-success-soft text-success-text border border-success/30',
  Overdue: 'bg-danger-soft text-danger-text border border-danger/30',
};

export const SUBMISSION_STATUS_DOT_CLASSES: Record<PaymentSubmissionStatus, string> = {
  Pending: 'bg-warning',
  Verified: 'bg-success',
  Rejected: 'bg-danger',
};

export const SUBMISSION_STATUS_BADGE_CLASSES: Record<PaymentSubmissionStatus, string> = {
  Pending: 'bg-warning-soft text-warning-text border border-warning/25',
  Verified: 'bg-success-soft text-success-text border border-success/25',
  Rejected: 'bg-danger-soft text-danger-text border border-danger/25',
};

export const THEME_STORAGE_KEY = 'stackdev_portal_theme';
export const LANGUAGE_STORAGE_KEY = 'stackdev-portal-lang';

export const DEMO_LOGIN_PRESETS = {
  admin: {email: 'admin@stackdev.com', password: 'admin123'},
  client: {email: 'client@stackdev.com', password: 'client123'},
} as const;
