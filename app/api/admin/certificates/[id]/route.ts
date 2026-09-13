import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createAdminSupabaseClient();
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*, client:clients(*)')
      .eq('id', id)
      .single();

    if (error || !cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Map to frontend structure expected by the page
    const mappedCert = {
      id: cert.id,
      clientId: cert.client_id,
      certificateNumber: cert.certificate_number,
      policyType: cert.policy_type,
      policyNumber: cert.policy_number,
      insuredName: cert.insured_name || cert.client?.business_name || cert.client?.contact_name || 'Unknown Client',
      certificateHolderName: cert.certificate_holder_name,
      certificateHolderAddress: cert.certificate_holder_address,
      certificateDate: cert.effective_date,
      additionalInsured: cert.additional_insured,
      status: cert.status,
      lastUpdated: new Date(cert.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      effectiveDate: cert.effective_date ? new Date(cert.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
      expirationDate: cert.expiration_date || '',
      generalAggregateLimit: cert.general_aggregate_limit || '',
      eachOccurrenceLimit: cert.each_occurrence_limit || '',
      fileSize: cert.file_size || '1.2 MB',
      templateStoragePath: cert.template_storage_path,
      descriptionOfOperations: cert.description_of_operations,
      clientEmail: cert.client?.contact_email || '',
      clientContactName: cert.client?.contact_name || '',
    };

    return NextResponse.json(mappedCert);
  } catch (err) {
    console.error('Fetch cert error:', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
