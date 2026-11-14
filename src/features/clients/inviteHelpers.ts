export interface ClientInviteInfo {
  clientId: string;
  name: string;
  email: string;
  inviteMessage: string;
  linkSqlSnippet: string;
}

export function buildClientInviteInfo(
  clientId: string,
  name: string,
  email: string,
): ClientInviteInfo {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://your-portal-url';
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const escapedName = cleanName.replace(/'/g, "''");
  const escapedEmail = cleanEmail.replace(/'/g, "''");

  const inviteMessage = [
    `Hi ${cleanName},`,
    '',
    'Your Stack Dev Client Portal account is ready.',
    `1. Open the portal: ${origin}/login`,
    '2. Click "Forgot password?"',
    `3. Enter your email (${cleanEmail}) to receive a password reset link and set your password.`,
    '',
    '— Stack Dev, Savar, Dhaka',
  ].join('\n');

  const linkSqlSnippet = [
    'update public.profiles',
    `set client_id = '${clientId}',`,
    `    full_name = '${escapedName}'`,
    `where lower(email) = lower('${escapedEmail}');`,
  ].join('\n');

  return {
    clientId,
    name: cleanName,
    email: cleanEmail,
    inviteMessage,
    linkSqlSnippet,
  };
}
