import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/admin/DashboardClient';
import { Client, Activity } from '@/types';

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // 1. Total Clients Count
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  // 2. Total Certificates Count
  const { count: totalCertificates } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true });

  // 3. Recent Clients
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, business_name, contact_name, contact_email, phone, address, avatar_initials, created_at, certificates(count)')
    .order('created_at', { ascending: false })
    .limit(5);

  const recentClients: Client[] = (clientsData || []).map((c: any) => ({
    id: c.id,
    businessName: c.business_name,
    contactName: c.contact_name,
    contactEmail: c.contact_email,
    phone: c.phone || '',
    address: c.address || '',
    avatarInitials: c.avatar_initials || '',
    createdAt: c.created_at,
    certificateCount: c.certificates?.[0]?.count || 0,
  }));

  // 4. Recent Activities
  const { data: activitiesData } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const recentActivities: Activity[] = (activitiesData || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    clientName: a.client_name,
    action: a.action,
    date: a.created_at
      ? new Date(a.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ' • ' + new Date(a.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : '',
    certificateId: a.certificate_id || null,
  }));

  return (
    <DashboardClient
      totalClients={totalClients || 0}
      totalCertificates={totalCertificates || 0}
      recentClients={recentClients}
      recentActivities={recentActivities}
    />
  );
}
