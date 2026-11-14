import {supabase} from '@/lib/supabase';
import {getErrorMessage, parseServiceInput} from '@/services/serviceUtils';
import type {ClientRow} from '@/types/database';
import type {ClientRecord} from '@/types/portal';
import {createClientInputSchema, updateClientInputSchema} from '@/types/schemas';

export interface CreateClientInput {
  companyName: string;
  contactName: string;
  phone?: string;
  email: string;
  notes?: string;
}

export interface UpdateClientInput {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

function mapClientRow(row: ClientRow, hasLoginAccount = false): ClientRecord {
  return {
    id: String(row.id),
    companyName: String(row.company_name ?? ''),
    contactName: String(row.contact_name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    notes: String(row.notes ?? ''),
    hasLoginAccount,
    createdAt: row.created_at,
  };
}

export async function list(): Promise<ClientRecord[]> {
  const [{data: clientRows, error: clientError}, {data: profileRows, error: profileError}] =
    await Promise.all([
      supabase
        .from('clients')
        .select('id, company_name, contact_name, phone, email, notes, created_at')
        .order('company_name', {ascending: true}),
      supabase.from('profiles').select('client_id').not('client_id', 'is', null),
    ]);

  if (clientError) {
    throw new Error(getErrorMessage(clientError, 'Unable to load clients.'));
  }

  const linkedClientIds = new Set(
    (!profileError && profileRows ? profileRows : [])
      .map((row) => (row.client_id ? String(row.client_id) : ''))
      .filter(Boolean),
  );

  return (clientRows ?? []).map((row) =>
    mapClientRow(row as ClientRow, linkedClientIds.has(String(row.id))),
  );
}

export async function getById(id: string): Promise<ClientRecord | null> {
  const [{data, error}, {data: profileRows}] = await Promise.all([
    supabase
      .from('clients')
      .select('id, company_name, contact_name, phone, email, notes, created_at')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('profiles').select('id').eq('client_id', id).limit(1),
  ]);

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load client details.'));
  }
  if (!data) return null;

  return mapClientRow(data as ClientRow, Boolean(profileRows && profileRows.length > 0));
}

export async function create(input: CreateClientInput): Promise<ClientRecord> {
  const valid = parseServiceInput(createClientInputSchema, input);
  const cleanCompanyName = valid.companyName || valid.contactName;
  const cleanEmail = valid.email.toLowerCase();

  const {data, error} = await supabase
    .from('clients')
    .insert({
      company_name: cleanCompanyName,
      contact_name: valid.contactName,
      phone: valid.phone,
      email: cleanEmail,
      notes: valid.notes,
    })
    .select('id, company_name, contact_name, phone, email, notes, created_at')
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to create client record.'));
  }

  return mapClientRow(data as ClientRow, false);
}

export async function update(id: string, input: UpdateClientInput): Promise<ClientRecord> {
  const valid = parseServiceInput(updateClientInputSchema, input);
  const payload: Record<string, string> = {};
  if (valid.contactName !== undefined) {
    payload.contact_name = valid.contactName;
  }
  if (valid.companyName !== undefined) {
    payload.company_name = valid.companyName || valid.contactName || '';
  }
  if (valid.phone !== undefined) {
    payload.phone = valid.phone;
  }
  if (valid.email !== undefined) {
    payload.email = valid.email.toLowerCase();
  }
  if (valid.notes !== undefined) {
    payload.notes = valid.notes;
  }

  const {data, error} = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select('id, company_name, contact_name, phone, email, notes, created_at')
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to update client record.'));
  }

  const {data: profileRows} = await supabase
    .from('profiles')
    .select('id')
    .eq('client_id', id)
    .limit(1);

  return mapClientRow(data as ClientRow, Boolean(profileRows && profileRows.length > 0));
}

export async function remove(id: string): Promise<void> {
  const {error} = await supabase.from('clients').delete().eq('id', id);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete client record.'));
  }
}
