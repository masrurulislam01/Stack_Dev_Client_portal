import type {
  InvoiceStatus,
  MilestoneStatus,
  PaymentMethod,
  PaymentSubmissionMethod,
  PaymentSubmissionStatus,
  ProjectPackage,
  ProjectStatus,
} from '@/types/portal';

// ---------------------------------------------------------------------------
// Studio & Agency Metadata
// ---------------------------------------------------------------------------

export const ADMIN_EMAIL = 'ayonmasrurulislam@gmail.com';
export const AGENCY_NAME = 'Stack Dev';
export const AGENCY_ADDRESS = 'Stack Dev, Savar, Dhaka';
export const AGENCY_PHONE = '+880 1963-131282';
export const STUDIO_TAGLINE = 'Web & Flutter Studio, Dhaka, Bangladesh';

// ---------------------------------------------------------------------------
// Currency (BDT / ৳)
// ---------------------------------------------------------------------------

export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_CODE = 'BDT';

export function formatBDT(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY_SYMBOL}${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(safeAmount)}`;
}

export function formatPdfBDT(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY_CODE} ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(safeAmount)}`;
}

// ---------------------------------------------------------------------------
// Packages & Status Enumerations
// ---------------------------------------------------------------------------

export const PROJECT_PACKAGES: ReadonlyArray<{value: ProjectPackage; label: string}> = [
  {value: 'basic', label: 'Basic'},
  {value: 'premium', label: 'Premium'},
  {value: 'custom', label: 'Custom'},
];

export const PACKAGE_LABELS: Record<ProjectPackage, string> = {
  basic: 'Basic',
  premium: 'Premium',
  custom: 'Custom',
};

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'Planning',
  'Design',
  'Development',
  'Review',
  'Delivered',
];

export const MILESTONE_STATUSES: readonly MilestoneStatus[] = [
  'Pending',
  'In Review',
  'Approved',
  'Changes Requested',
];

export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  'Draft',
  'Sent',
  'Paid',
  'Overdue',
];

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'bKash',
  'Nagad',
  'Bank',
  'Cash',
];

export const PAYMENT_SUBMISSION_METHODS: readonly PaymentSubmissionMethod[] = [
  'bKash',
  'Nagad',
  'Bank',
];

export const PAYMENT_SUBMISSION_STATUSES: readonly PaymentSubmissionStatus[] = [
  'Pending',
  'Verified',
  'Rejected',
];

// ---------------------------------------------------------------------------
// Payment Channel Numbers (Editable Studio Payment Details)
// ---------------------------------------------------------------------------

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
    instructions: 'Complete a bank transfer for the exact BDT amount and enter your bank reference ID.',
  },
};

// ---------------------------------------------------------------------------
// Centralized Status Badge & Text Styling Maps
// ---------------------------------------------------------------------------

export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  Planning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Design:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Development:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/60',
  Review:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/60',
  Delivered:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
};

export const PROJECT_STATUS_TEXT_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'text-amber-700 dark:text-amber-400',
  Design: 'text-amber-700 dark:text-amber-400',
  Development: 'text-indigo-700 dark:text-indigo-400',
  Review: 'text-indigo-700 dark:text-indigo-400',
  Delivered: 'text-emerald-700 dark:text-emerald-400',
};

export const PROJECT_STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'bg-amber-500',
  Design: 'bg-amber-500',
  Development: 'bg-indigo-500',
  Review: 'bg-indigo-500',
  Delivered: 'bg-emerald-500',
};

export const MILESTONE_BADGE_CLASSES: Record<MilestoneStatus, string> = {
  Pending:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'In Review':
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Approved:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
  'Changes Requested':
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
};

export const INVOICE_STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  Draft:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  Sent:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Paid:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
  Overdue:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
};

export const PAYMENT_SUBMISSION_BADGE_CLASSES: Record<PaymentSubmissionStatus, string> = {
  Pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Verified:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
  Rejected:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
};

// ---------------------------------------------------------------------------
// File Storage & Upload Constraints
// ---------------------------------------------------------------------------

export const STORAGE_BUCKET = 'project-files';
export const SIGNED_URL_EXPIRY_SECONDS = 60;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

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
