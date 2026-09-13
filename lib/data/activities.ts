/**
 * Activity data fetchers — server-side, Supabase-backed.
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { Activity } from '@/types';

function mapRow(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    title: row.title as string,
    clientName: row.client_name as string,
    action: row.action as Activity['action'],
    date: row.created_at
      ? new Date(row.created_at as string).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
      : '',
    certificateId: (row.certificate_id as string) || null,
  };
}

/** Fetch the most recent N activities (admin dashboard). */
export async function getRecentActivities(limit = 10): Promise<Activity[]> {
  const supabase = await createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRecentActivities error:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
}

/** Fetch activities for the current client's certificates. */
export async function getClientActivities(clientId: string, limit = 5): Promise<Activity[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('activities')
    .select('*, certificates!inner(client_id)')
    .eq('certificates.client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getClientActivities error:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
}
