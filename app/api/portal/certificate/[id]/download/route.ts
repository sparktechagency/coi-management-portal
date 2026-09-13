import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { generateCOI } from '@/lib/pdf/generateCOI';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAdminSupabaseClient();

    // Fetch the certificate
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .single();

    if (certError || !cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (!cert.template_storage_path) {
      return NextResponse.json(
        { error: 'No template PDF has been uploaded for this certificate yet.' },
        { status: 422 }
      );
    }

    // Download the raw template PDF from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('coi-templates')
      .download(cert.template_storage_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Template file could not be downloaded.' },
        { status: 404 }
      );
    }

    const templateBytes = new Uint8Array(await fileData.arrayBuffer());
    let pdfBytes: Uint8Array;

    try {
      // Stamp the latest edited fields onto the template
      pdfBytes = await generateCOI({
        templateBytes,
        certificateDate: cert.certificate_date || cert.effective_date || '',
        certificateHolderName: cert.certificate_holder_name || '',
        certificateHolderAddress: cert.certificate_holder_address || '',
        additionalInsured: Boolean(cert.additional_insured),
        descriptionOfOperations: cert.description_of_operations || '',
      });
    } catch (stampErr) {
      console.warn('COI stamping failed, falling back to original template:', stampErr);
      pdfBytes = templateBytes;
    }

    const safeNumber = (cert.certificate_number || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeNumber}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('PDF download route error:', err);
    return NextResponse.json({ error: 'Failed to download certificate PDF.' }, { status: 500 });
  }
}
