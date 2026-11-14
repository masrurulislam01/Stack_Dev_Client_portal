import type {AuthChangeEvent, Session, SupabaseClient, User} from '@supabase/supabase-js';

type Row = Record<string, unknown>;

const STORAGE_SESSION_KEY = 'stackdev_demo_session_uid';

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoHoursAgo(hours: number): string {
  const d = new Date(Date.now() - hours * 3600 * 1000);
  return d.toISOString();
}

function createSampleRasterDataUrl(): string {
  // Generate a minimal valid 16x12 24-bit uncompressed BMP raster image (no SVG)
  const width = 16;
  const height = 12;
  const rowSize = width * 3; // 48 bytes (already 4-byte aligned)
  const pixelBytes = rowSize * height;
  const fileSize = 54 + pixelBytes;
  const buf = new Uint8Array(fileSize);
  const view = new DataView(buf.buffer);
  buf[0] = 0x42; // 'B'
  buf[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = 54 + y * rowSize + x * 3;
      const isHeader = y >= height - 3;
      buf[idx] = isHeader ? 0xe5 : 0xfc; // B
      buf[idx + 1] = isHeader ? 0x46 : 0xfa; // G
      buf[idx + 2] = isHeader ? 0x4f : 0xf8; // R
    }
  }
  let binary = '';
  for (let i = 0; i < buf.length; i += 1) {
    binary += String.fromCharCode(buf[i]);
  }
  return `data:image/bmp;base64,${btoa(binary)}`;
}

// In-memory storage blobs for uploaded or seeded demo files
const memoryStorageMap = new Map<string, string>([
  ['client-1/proj-1/demo-wireframe-preview.png', createSampleRasterDataUrl()],
  [
    'client-1/proj-1/demo-api-spec.txt',
    `data:text/plain;charset=utf-8,${encodeURIComponent(
      'Stack Dev - Apex E-Commerce API Specification\n\nEndpoints:\n- GET /api/products\n- POST /api/orders\n- POST /api/payments/sslcommerz\n',
    )}`,
  ],
]);

export function putMockStorageFile(storagePath: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : URL.createObjectURL(file);
      memoryStorageMap.set(storagePath, dataUrl);
      resolve(dataUrl);
    };
    reader.onerror = () => {
      const objectUrl = URL.createObjectURL(file);
      memoryStorageMap.set(storagePath, objectUrl);
      resolve(objectUrl);
    };
    reader.readAsDataURL(file);
  });
}

function getMockSignedUrl(storagePath: string): string {
  return (
    memoryStorageMap.get(storagePath) ||
    `data:text/plain;charset=utf-8,${encodeURIComponent(`Mock file content for ${storagePath}`)}`
  );
}

// In-memory database tables seeded with Stack Dev Agency sample data
const db: Record<string, Row[]> = {
  profiles: [
    {
      id: 'user-admin-1',
      full_name: 'Masrurul Islam',
      email: 'admin@stackdev.com',
      role: 'admin',
      client_id: null,
      created_at: isoHoursAgo(720),
    },
    {
      id: 'user-client-1',
      full_name: 'Tariq Hasan',
      email: 'client@stackdev.com',
      role: 'client',
      client_id: 'client-1',
      created_at: isoHoursAgo(600),
    },
    {
      id: 'user-client-2',
      full_name: 'Nadia Rahman',
      email: 'nadia@dhakacraft.com',
      role: 'client',
      client_id: 'client-2',
      created_at: isoHoursAgo(480),
    },
  ],
  clients: [
    {
      id: 'client-1',
      company_name: 'Apex Retail Ltd',
      contact_name: 'Tariq Hasan',
      phone: '+880 1711-223344',
      email: 'client@stackdev.com',
      notes: 'Web + Flutter cross-platform retail app engagement.',
      created_at: isoHoursAgo(600),
    },
    {
      id: 'client-2',
      company_name: 'Dhaka Craft Studio',
      contact_name: 'Nadia Rahman',
      phone: '+880 1819-445566',
      email: 'nadia@dhakacraft.com',
      notes: 'Custom artisan e-commerce storefront.',
      created_at: isoHoursAgo(480),
    },
  ],
  projects: [
    {
      id: 'proj-1',
      client_id: 'client-1',
      title: 'Apex E-Commerce Web & Flutter App',
      description:
        'Full-stack Next.js storefront and cross-platform Flutter mobile shopping app with bKash/SSLCommerz checkout.',
      package: 'premium',
      status: 'Development',
      progress: 68,
      start_date: isoDaysFromNow(-21),
      due_date: isoDaysFromNow(5),
      revisions_allowed: 5,
      revisions_used: 1,
      created_at: isoHoursAgo(500),
    },
    {
      id: 'proj-2',
      client_id: 'client-1',
      title: 'Apex Warehouse Inventory Portal',
      description: 'Internal warehouse stock management dashboard with barcode scanning.',
      package: 'basic',
      status: 'Review',
      progress: 90,
      start_date: isoDaysFromNow(-30),
      due_date: isoDaysFromNow(14),
      revisions_allowed: 3,
      revisions_used: 0,
      created_at: isoHoursAgo(400),
    },
    {
      id: 'proj-3',
      client_id: 'client-2',
      title: 'Dhaka Craft Online Storefront',
      description: 'Bilingual EN/BN storefront for handmade Bangladeshi ceramics and textiles.',
      package: 'custom',
      status: 'Design',
      progress: 40,
      start_date: isoDaysFromNow(-10),
      due_date: isoDaysFromNow(3),
      revisions_allowed: 4,
      revisions_used: 1,
      created_at: isoHoursAgo(240),
    },
  ],
  milestones: [
    {
      id: 'ms-1',
      project_id: 'proj-1',
      title: 'UI/UX Design System & Figma Prototype',
      description: 'Complete mobile and desktop checkout flows approved.',
      due_date: isoDaysFromNow(-10),
      status: 'Approved',
      reviewed_by: 'user-client-1',
      reviewed_at: isoHoursAgo(240),
      feedback: '',
      created_at: isoHoursAgo(480),
    },
    {
      id: 'ms-2',
      project_id: 'proj-1',
      title: 'Flutter Cart & Checkout Build (Staging)',
      description: 'Ready for client testing on Android APK and web staging.',
      due_date: isoDaysFromNow(2),
      status: 'In Review',
      reviewed_by: null,
      reviewed_at: null,
      feedback: '',
      created_at: isoHoursAgo(72),
    },
    {
      id: 'ms-3',
      project_id: 'proj-1',
      title: 'Production Deployment & Play Store Release',
      description: 'Final QA sign-off and production cutover.',
      due_date: isoDaysFromNow(5),
      status: 'Pending',
      reviewed_by: null,
      reviewed_at: null,
      feedback: '',
      created_at: isoHoursAgo(70),
    },
    {
      id: 'ms-4',
      project_id: 'proj-2',
      title: 'Barcode Scanner & CSV Export Module',
      description: 'Staging build deployed for warehouse team review.',
      due_date: isoDaysFromNow(4),
      status: 'In Review',
      reviewed_by: null,
      reviewed_at: null,
      feedback: '',
      created_at: isoHoursAgo(48),
    },
  ],
  updates: [
    {
      id: 'upd-1',
      project_id: 'proj-1',
      author_id: 'user-admin-1',
      body: 'Completed Flutter cart synchronization and deployed staging build v1.4 for review.',
      created_at: isoHoursAgo(6),
    },
    {
      id: 'upd-2',
      project_id: 'proj-2',
      author_id: 'user-admin-1',
      body: 'Added UTF-8 CSV inventory export and barcode scan confirmation sound.',
      created_at: isoHoursAgo(28),
    },
    {
      id: 'upd-3',
      project_id: 'proj-3',
      author_id: 'user-admin-1',
      body: 'Uploaded updated Bangla typography pairings for the hero and category cards.',
      created_at: isoHoursAgo(52),
    },
  ],
  files: [
    {
      id: 'file-1',
      project_id: 'proj-1',
      uploaded_by: 'user-admin-1',
      name: 'Apex_App_Wireframe_Preview.png',
      storage_path: 'client-1/proj-1/demo-wireframe-preview.png',
      size_bytes: 184200,
      mime_type: 'image/png',
      created_at: isoHoursAgo(96),
    },
    {
      id: 'file-2',
      project_id: 'proj-1',
      uploaded_by: 'user-admin-1',
      name: 'Apex_API_Spec.txt',
      storage_path: 'client-1/proj-1/demo-api-spec.txt',
      size_bytes: 2048,
      mime_type: 'text/plain',
      created_at: isoHoursAgo(48),
    },
  ],
  messages: [
    {
      id: 'msg-1',
      project_id: 'proj-1',
      sender_id: 'user-admin-1',
      body: 'Hi Tariq! We just pushed the staging build for the Flutter Cart & Checkout milestone. Please check the Milestones tab when you have a moment.',
      file_id: null,
      created_at: isoHoursAgo(20),
    },
    {
      id: 'msg-2',
      project_id: 'proj-1',
      sender_id: 'user-client-1',
      body: 'Thanks! Testing on Android now — the product gallery feels super smooth.',
      file_id: null,
      created_at: isoHoursAgo(12),
    },
  ],
  message_reads: [
    {
      message_id: 'msg-1',
      user_id: 'user-client-1',
      read_at: isoHoursAgo(12),
    },
  ],
  invoices: [
    {
      id: 'inv-1',
      client_id: 'client-1',
      project_id: 'proj-1',
      invoice_number: 'SD-2026-0001',
      items: [
        {
          description: 'Project Kickoff & UI/UX Architecture (50% Deposit)',
          quantity: 1,
          unitPrice: 65000,
          total: 65000,
        },
      ],
      total_bdt: 65000,
      issue_date: isoDaysFromNow(-21),
      due_date: isoDaysFromNow(-14),
      notes: 'Thank you for your prompt deposit.',
      status: 'Paid',
      paid_at: isoHoursAgo(330),
      payment_method: 'bKash',
      payment_reference: 'TRX9K4M2P1Q',
      created_at: isoHoursAgo(500),
    },
    {
      id: 'inv-2',
      client_id: 'client-1',
      project_id: 'proj-1',
      invoice_number: 'SD-2026-0002',
      items: [
        {
          description: 'Flutter Mobile App Development Milestone',
          quantity: 1,
          unitPrice: 35000,
          total: 35000,
        },
        {
          description: 'SSLCommerz & Admin API Integration',
          quantity: 1,
          unitPrice: 10000,
          total: 10000,
        },
      ],
      total_bdt: 45000,
      issue_date: isoDaysFromNow(-2),
      due_date: isoDaysFromNow(5),
      notes: 'Payable via bKash, Nagad, or Bank transfer.',
      status: 'Sent',
      paid_at: null,
      payment_method: null,
      payment_reference: null,
      created_at: isoHoursAgo(48),
    },
    {
      id: 'inv-3',
      client_id: 'client-2',
      project_id: 'proj-3',
      invoice_number: 'SD-2026-0003',
      items: [
        {
          description: 'Storefront Design System & Bilingual Setup',
          quantity: 1,
          unitPrice: 30000,
          total: 30000,
        },
      ],
      total_bdt: 30000,
      issue_date: isoDaysFromNow(-10),
      due_date: isoDaysFromNow(-2),
      notes: 'Design sprint milestone invoice.',
      status: 'Overdue',
      paid_at: null,
      payment_method: null,
      payment_reference: null,
      created_at: isoHoursAgo(240),
    },
  ],
  payment_submissions: [
    {
      id: 'pay-1',
      invoice_id: 'inv-1',
      submitted_by: 'user-client-1',
      method: 'bKash',
      sender_number: '01711-223344',
      transaction_id: 'TRX9K4M2P1Q',
      amount_bdt: 65000,
      status: 'Verified',
      rejection_reason: null,
      verified_by: 'user-admin-1',
      verified_at: isoHoursAgo(330),
      created_at: isoHoursAgo(336),
    },
    {
      id: 'pay-2',
      invoice_id: 'inv-3',
      submitted_by: 'user-client-2',
      method: 'Nagad',
      sender_number: '01819-445566',
      transaction_id: 'NGD7741289A',
      amount_bdt: 30000,
      status: 'Pending',
      rejection_reason: null,
      verified_by: null,
      verified_at: null,
      created_at: isoHoursAgo(4),
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      user_id: 'user-admin-1',
      type: 'invoice',
      title: 'New payment proof submitted',
      body: 'Dhaka Craft Studio submitted Nagad TrxID NGD7741289A for ৳30,000.',
      link: '/admin/payments',
      is_read: false,
      created_at: isoHoursAgo(4),
    },
    {
      id: 'notif-2',
      user_id: 'user-client-1',
      type: 'milestone',
      title: 'Milestone ready for review',
      body: 'Flutter Cart & Checkout Build (Staging) is ready for your feedback.',
      link: '/projects/proj-1',
      is_read: false,
      created_at: isoHoursAgo(6),
    },
    {
      id: 'notif-3',
      user_id: 'user-client-1',
      type: 'invoice',
      title: 'New invoice SD-2026-0002',
      body: 'Amount: ৳45,000 · Due in 5 days.',
      link: '/invoices/inv-2',
      is_read: false,
      created_at: isoHoursAgo(48),
    },
  ],
};

const demoPasswords = new Map<string, string>([
  ['admin@stackdev.com', 'admin123'],
  ['client@stackdev.com', 'client123'],
  ['nadia@dhakacraft.com', 'client123'],
]);

let invoiceCounter = 4;

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;
const authListeners = new Set<AuthListener>();

interface RealtimeListener {
  table: string;
  filter?: string;
  cb: () => void;
}
const realtimeChannels = new Map<string, RealtimeListener[]>();

function notifyRealtime(table: string) {
  for (const listeners of realtimeChannels.values()) {
    for (const l of listeners) {
      if (l.table === table) {
        try {
          l.cb();
        } catch {
          // ignore listener errors
        }
      }
    }
  }
}

function makeSupabaseUser(profile: Row): User {
  const id = String(profile.id);
  const email = String(profile.email);
  return {
    id,
    email,
    app_metadata: {provider: 'email'},
    user_metadata: {full_name: String(profile.full_name ?? '')},
    aud: 'authenticated',
    created_at: String(profile.created_at ?? new Date().toISOString()),
  } as User;
}

function makeSession(profile: Row): Session {
  const user = makeSupabaseUser(profile);
  return {
    access_token: `demo-token-${user.id}`,
    refresh_token: `demo-refresh-${user.id}`,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  } as Session;
}

function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const uid = window.localStorage.getItem(STORAGE_SESSION_KEY);
    if (!uid) return null;
    const profile = db.profiles.find((p) => String(p.id) === uid);
    return profile ? makeSession(profile) : null;
  } catch {
    return null;
  }
}

function saveSessionUid(uid: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (uid) {
      window.localStorage.setItem(STORAGE_SESSION_KEY, uid);
    } else {
      window.localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function emitAuth(event: AuthChangeEvent, session: Session | null) {
  for (const listener of authListeners) {
    try {
      listener(event, session);
    } catch {
      // ignore listener errors
    }
  }
}

function hydrateRow(table: string, row: Row): Row {
  const copy: Row = {...row};

  if (table === 'projects') {
    const client = db.clients.find((c) => c.id === row.client_id);
    copy.clients = client ? {company_name: client.company_name} : null;
  } else if (table === 'milestones') {
    const project = db.projects.find((p) => p.id === row.project_id);
    const profile = row.reviewed_by
      ? db.profiles.find((pr) => pr.id === row.reviewed_by)
      : null;
    copy.projects = project ? {client_id: project.client_id} : null;
    copy.profiles = profile ? {full_name: profile.full_name} : null;
  } else if (table === 'updates') {
    const project = db.projects.find((p) => p.id === row.project_id);
    const profile = row.author_id
      ? db.profiles.find((pr) => pr.id === row.author_id)
      : null;
    copy.projects = project
      ? {title: project.title, client_id: project.client_id}
      : null;
    copy.profiles = profile ? {full_name: profile.full_name} : null;
  } else if (table === 'files') {
    const project = db.projects.find((p) => p.id === row.project_id);
    const profile = row.uploaded_by
      ? db.profiles.find((pr) => pr.id === row.uploaded_by)
      : null;
    copy.projects = project
      ? {title: project.title, client_id: project.client_id}
      : null;
    copy.profiles = profile
      ? {full_name: profile.full_name, role: profile.role}
      : null;
  } else if (table === 'messages') {
    const project = db.projects.find((p) => p.id === row.project_id);
    const profile = row.sender_id
      ? db.profiles.find((pr) => pr.id === row.sender_id)
      : null;
    const file = row.file_id ? db.files.find((f) => f.id === row.file_id) : null;
    const reads = db.message_reads.filter((r) => r.message_id === row.id);
    copy.projects = project
      ? {title: project.title, client_id: project.client_id}
      : null;
    copy.profiles = profile
      ? {full_name: profile.full_name, role: profile.role}
      : null;
    copy.files = file
      ? {
          id: file.id,
          name: file.name,
          storage_path: file.storage_path,
          size_bytes: file.size_bytes,
          mime_type: file.mime_type,
        }
      : null;
    copy.message_reads = reads;
  } else if (table === 'invoices') {
    const client = db.clients.find((c) => c.id === row.client_id);
    const project = db.projects.find((p) => p.id === row.project_id);
    copy.clients = client
      ? {company_name: client.company_name, email: client.email}
      : null;
    copy.projects = project ? {title: project.title} : null;
  } else if (table === 'payment_submissions') {
    const inv = db.invoices.find((i) => i.id === row.invoice_id);
    const client = inv ? db.clients.find((c) => c.id === inv.client_id) : null;
    const project = inv ? db.projects.find((p) => p.id === inv.project_id) : null;
    const submitter = db.profiles.find((pr) => pr.id === row.submitted_by);
    copy.invoices = inv
      ? {
          invoice_number: inv.invoice_number,
          client_id: inv.client_id,
          project_id: inv.project_id,
          status: inv.status,
          total_bdt: inv.total_bdt,
          clients: client
            ? {company_name: client.company_name, contact_name: client.contact_name}
            : null,
          projects: project ? {title: project.title} : null,
        }
      : null;
    copy.profiles = submitter ? {full_name: submitter.full_name} : null;
  }

  return copy;
}

function getNestedValue(row: Row, path: string): unknown {
  if (!path.includes('.')) return row[path];
  const parts = path.split('.');
  let cur: unknown = row;
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as Row)) {
      cur = (cur as Row)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

class MockQueryBuilder {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private upsertOpts: {onConflict?: string; ignoreDuplicates?: boolean} = {};
  private filters: ((row: Row) => boolean)[] = [];
  private orderBy: {col: string; ascending: boolean; nullsFirst?: boolean} | null = null;
  private limitCount: number | null = null;
  private expectSingle: 'single' | 'maybeSingle' | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns?: string) {
    return this;
  }

  insert(data: Row | Row[]) {
    this.op = 'insert';
    this.payload = data;
    return this;
  }

  update(data: Row) {
    this.op = 'update';
    this.payload = data;
    return this;
  }

  upsert(data: Row | Row[], opts: {onConflict?: string; ignoreDuplicates?: boolean} = {}) {
    this.op = 'upsert';
    this.payload = data;
    this.upsertOpts = opts;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((row) => getNestedValue(row, col) === val);
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push((row) => getNestedValue(row, col) !== val);
    return this;
  }

  not(col: string, op: string, val: unknown) {
    if (op === 'is' && val === null) {
      this.filters.push((row) => {
        const v = getNestedValue(row, col);
        return v !== null && v !== undefined;
      });
    } else {
      this.filters.push((row) => getNestedValue(row, col) !== val);
    }
    return this;
  }

  ilike(col: string, pattern: string) {
    const clean = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((row) => {
      const v = String(getNestedValue(row, col) ?? '').toLowerCase();
      return v === clean || v.includes(clean);
    });
    return this;
  }

  order(col: string, opts?: {ascending?: boolean; nullsFirst?: boolean}) {
    this.orderBy = {
      col,
      ascending: opts?.ascending !== false,
      nullsFirst: opts?.nullsFirst,
    };
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.expectSingle = 'single';
    return this;
  }

  maybeSingle() {
    this.expectSingle = 'maybeSingle';
    return this;
  }

  private async execute(): Promise<{data: unknown; error: {message: string; code?: string} | null}> {
    const rows = db[this.table] ?? [];
    if (!db[this.table]) db[this.table] = rows;

    const matchesFilters = (rawRow: Row) => {
      const hydrated = hydrateRow(this.table, rawRow);
      return this.filters.every((fn) => fn(hydrated));
    };

    if (this.op === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const inserted: Row[] = [];
      for (const item of items) {
        const id =
          typeof item.id === 'string' && item.id
            ? item.id
            : `${this.table.slice(0, 4)}-${crypto.randomUUID().slice(0, 8)}`;
        const newRow: Row = {
          ...item,
          id,
          created_at: item.created_at ?? new Date().toISOString(),
        };
        if (this.table === 'invoices' && !newRow.invoice_number) {
          newRow.invoice_number = `SD-2026-${String(invoiceCounter++).padStart(4, '0')}`;
        }
        rows.push(newRow);
        inserted.push(hydrateRow(this.table, newRow));
      }
      if (this.table === 'messages' || this.table === 'notifications') {
        notifyRealtime(this.table);
      }
      if (this.expectSingle === 'single' || this.expectSingle === 'maybeSingle') {
        return {data: inserted[0] ?? null, error: null};
      }
      return {data: inserted, error: null};
    }

    if (this.op === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const conflictKeys = (this.upsertOpts.onConflict ?? 'id')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const result: Row[] = [];
      for (const item of items) {
        const existingIdx = rows.findIndex((r) =>
          conflictKeys.every((k) => r[k] === item[k]),
        );
        if (existingIdx >= 0) {
          if (!this.upsertOpts.ignoreDuplicates) {
            rows[existingIdx] = {...rows[existingIdx], ...item};
          }
          result.push(hydrateRow(this.table, rows[existingIdx]));
        } else {
          const newRow: Row = {
            ...item,
            read_at: item.read_at ?? new Date().toISOString(),
          };
          rows.push(newRow);
          result.push(hydrateRow(this.table, newRow));
        }
      }
      if (this.table === 'message_reads') {
        notifyRealtime('message_reads');
      }
      return {data: result, error: null};
    }

    if (this.op === 'update') {
      const patch = (this.payload as Row) ?? {};
      const updated: Row[] = [];
      const currentSession = getStoredSession();
      for (let i = 0; i < rows.length; i++) {
        if (matchesFilters(rows[i])) {
          const nextRow = {...rows[i], ...patch};
          if (
            this.table === 'milestones' &&
            (patch.status === 'Approved' || patch.status === 'Changes Requested')
          ) {
            nextRow.reviewed_by = nextRow.reviewed_by ?? currentSession?.user?.id ?? 'user-client-1';
            nextRow.reviewed_at = nextRow.reviewed_at ?? new Date().toISOString();
          }
          rows[i] = nextRow;
          updated.push(hydrateRow(this.table, nextRow));
        }
      }
      if (this.table === 'messages' || this.table === 'notifications') {
        notifyRealtime(this.table);
      }
      if (this.expectSingle === 'single') {
        return updated[0]
          ? {data: updated[0], error: null}
          : {data: null, error: {message: 'Record not found.'}};
      }
      if (this.expectSingle === 'maybeSingle') {
        return {data: updated[0] ?? null, error: null};
      }
      return {data: updated, error: null};
    }

    if (this.op === 'delete') {
      const remaining: Row[] = [];
      const deleted: Row[] = [];
      for (const r of rows) {
        if (matchesFilters(r)) {
          deleted.push(hydrateRow(this.table, r));
        } else {
          remaining.push(r);
        }
      }
      db[this.table] = remaining;
      if (this.table === 'messages' || this.table === 'notifications') {
        notifyRealtime(this.table);
      }
      if (this.expectSingle === 'single') {
        return deleted[0]
          ? {data: deleted[0], error: null}
          : {data: null, error: {message: 'Record not found.'}};
      }
      if (this.expectSingle === 'maybeSingle') {
        return {data: deleted[0] ?? null, error: null};
      }
      return {data: deleted, error: null};
    }

    // SELECT
    let matched = rows
      .map((r) => hydrateRow(this.table, r))
      .filter((hydrated) => this.filters.every((fn) => fn(hydrated)));

    if (this.orderBy) {
      const {col, ascending, nullsFirst} = this.orderBy;
      matched = [...matched].sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return nullsFirst ? -1 : 1;
        if (bv == null) return nullsFirst ? 1 : -1;
        const cmp = String(av).localeCompare(String(bv));
        return ascending ? cmp : -cmp;
      });
    }

    if (this.limitCount !== null && this.limitCount >= 0) {
      matched = matched.slice(0, this.limitCount);
    }

    if (this.expectSingle === 'single') {
      return matched[0]
        ? {data: matched[0], error: null}
        : {data: null, error: {message: 'Row not found.'}};
    }
    if (this.expectSingle === 'maybeSingle') {
      return {data: matched[0] ?? null, error: null};
    }
    return {data: matched, error: null};
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: {data: unknown; error: {message: string; code?: string} | null}) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function createMockSupabaseClient(): SupabaseClient {
  const mockClient = {
    auth: {
      async getSession() {
        return {data: {session: getStoredSession()}, error: null};
      },
      onAuthStateChange(callback: AuthListener) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      async signInWithPassword({email, password}: {email: string; password: string}) {
        const cleanEmail = email.trim().toLowerCase();
        const profile = db.profiles.find(
          (p) => String(p.email).toLowerCase() === cleanEmail,
        );
        const expectedPassword = demoPasswords.get(cleanEmail) ?? 'demo123';
        if (!profile || password !== expectedPassword) {
          return {
            data: {user: null, session: null},
            error: {message: 'Invalid login credentials', status: 400},
          };
        }
        const session = makeSession(profile);
        saveSessionUid(String(profile.id));
        emitAuth('SIGNED_IN', session);
        return {data: {user: session.user, session}, error: null};
      },
      async signOut(options?: {scope?: 'global' | 'local' | 'others'}) {
        if (options?.scope === 'others') {
          return {error: null};
        }
        saveSessionUid(null);
        emitAuth('SIGNED_OUT', null);
        return {error: null};
      },
      async resetPasswordForEmail() {
        return {data: {}, error: null};
      },
      async updateUser({password}: {password?: string}) {
        const session = getStoredSession();
        if (!session?.user) {
          return {data: {user: null}, error: {message: 'Not authenticated'}};
        }
        if (password && session.user.email) {
          demoPasswords.set(session.user.email.toLowerCase(), password);
        }
        emitAuth('USER_UPDATED', session);
        return {data: {user: session.user}, error: null};
      },
    },
    from(table: string) {
      return new MockQueryBuilder(table);
    },
    async rpc(fnName: string, args: Record<string, unknown> = {}) {
      const session = getStoredSession();
      if (fnName === 'verify_payment_submission') {
        const subId = String(args.p_submission_id ?? '');
        const sub = db.payment_submissions.find((s) => s.id === subId);
        if (!sub) return {data: null, error: {message: 'Submission not found.'}};
        const now = new Date().toISOString();
        sub.status = 'Verified';
        sub.verified_by = session?.user?.id ?? 'user-admin-1';
        sub.verified_at = now;
        const inv = db.invoices.find((i) => i.id === sub.invoice_id);
        if (inv) {
          inv.status = 'Paid';
          inv.paid_at = now;
          inv.payment_method = sub.method;
          inv.payment_reference = sub.transaction_id;
        }
        return {data: sub, error: null};
      }
      if (fnName === 'reject_payment_submission') {
        const subId = String(args.p_submission_id ?? '');
        const reason = String(args.p_reason ?? '').trim();
        const sub = db.payment_submissions.find((s) => s.id === subId);
        if (!sub) return {data: null, error: {message: 'Submission not found.'}};
        sub.status = 'Rejected';
        sub.rejection_reason = reason;
        sub.verified_by = session?.user?.id ?? 'user-admin-1';
        sub.verified_at = new Date().toISOString();
        return {data: sub, error: null};
      }
      return {data: null, error: {message: `Unknown RPC function: ${fnName}`}};
    },
    storage: {
      from(_bucket: string) {
        return {
          async createSignedUrls(paths: string[]) {
            return {
              data: paths.map((path) => ({
                path,
                signedUrl: getMockSignedUrl(path),
                error: null,
              })),
              error: null,
            };
          },
          async createSignedUrl(path: string) {
            return {
              data: {signedUrl: getMockSignedUrl(path)},
              error: null,
            };
          },
          async remove(paths: string[]) {
            for (const p of paths) {
              memoryStorageMap.delete(p);
            }
            return {data: paths, error: null};
          },
        };
      },
    },
    channel(name: string) {
      const listeners: RealtimeListener[] = [];
      realtimeChannels.set(name, listeners);
      const ch = {
        on(
          _type: string,
          opts: {table?: string; filter?: string},
          cb: () => void,
        ) {
          if (opts.table) {
            listeners.push({table: opts.table, filter: opts.filter, cb});
          }
          return ch;
        },
        subscribe() {
          return ch;
        },
      };
      return ch;
    },
    async removeChannel(channel: unknown) {
      for (const [k, v] of realtimeChannels.entries()) {
        if (v === channel) {
          realtimeChannels.delete(k);
        }
      }
      return 'ok';
    },
  };

  return mockClient as unknown as SupabaseClient;
}
