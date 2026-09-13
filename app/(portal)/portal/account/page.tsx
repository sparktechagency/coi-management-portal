import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ClientAccountSettings } from '@/components/portal/ClientAccountSettings';

export default async function ClientAccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile and linked client record
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('business_name, avatar_initials, client_id, client:clients(*)')
    .eq('id', user.id)
    .single();

  const clientData = Array.isArray(profile?.client)
    ? profile.client[0]
    : (profile?.client as any);

  const initialFullName =
    clientData?.contact_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    '';
  const initialEmail = user.email || clientData?.contact_email || '';
  const initialBusinessName =
    profile?.business_name || clientData?.business_name || 'Your Business LLC';
  const initialPhone = clientData?.phone || '';
  const initialAddress = clientData?.address || '';
  const initialAvatarInitials =
    profile?.avatar_initials ||
    clientData?.avatar_initials ||
    (initialFullName
      ? initialFullName
          .split(/\s+/)
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'CL');

  return (
    <ClientAccountSettings
      initialFullName={initialFullName}
      initialEmail={initialEmail}
      initialBusinessName={initialBusinessName}
      initialPhone={initialPhone}
      initialAddress={initialAddress}
      initialAvatarInitials={initialAvatarInitials}
    />
  );
}
