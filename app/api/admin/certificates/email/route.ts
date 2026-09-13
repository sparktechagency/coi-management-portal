import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { generateCOI } from '@/lib/pdf/generateCOI';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { certificateId, recipientEmail, subject, message } = body;

    if (!certificateId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: certificateId and recipientEmail' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const supabase = await createAdminSupabaseClient();

    // Fetch certificate and linked client
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('*, client:clients(*)')
      .eq('id', certificateId)
      .single();

    if (certError || !cert) {
      return NextResponse.json({ error: 'Certificate not found in database.' }, { status: 404 });
    }

    if (!cert.template_storage_path) {
      return NextResponse.json(
        { error: 'No PDF document template is attached to this certificate.' },
        { status: 422 }
      );
    }

    // Download PDF from storage bucket
    const { data: templateData, error: downloadError } = await supabase.storage
      .from('coi-templates')
      .download(cert.template_storage_path);

    if (downloadError || !templateData) {
      return NextResponse.json(
        { error: 'Failed to download certificate PDF from storage bucket.' },
        { status: 500 }
      );
    }

    const templateBytes = new Uint8Array(await templateData.arrayBuffer());
    let pdfBuffer: Buffer;

    try {
      // Stamp fields if applicable
      const pdfBytes = await generateCOI({
        templateBytes,
        certificateDate: cert.certificate_date || cert.effective_date || new Date().toISOString().split('T')[0],
        certificateHolderName: cert.certificate_holder_name || '',
        certificateHolderAddress: cert.certificate_holder_address || '',
        additionalInsured: Boolean(cert.additional_insured),
        descriptionOfOperations: cert.description_of_operations || '',
      });
      pdfBuffer = Buffer.from(pdfBytes);
    } catch {
      // Fallback to original uploaded PDF if stamping fails or isn't needed
      pdfBuffer = Buffer.from(templateBytes);
    }

    // Check SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: 'SMTP credentials missing in .env.local (SMTP_HOST, SMTP_USER, SMTP_PASS required).' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailSubject = subject?.trim() || `Certificate of Insurance - ${cert.policy_type} (${cert.certificate_number})`;
    const emailBodyText = message?.trim() || `Hello,

Please find attached the Certificate of Insurance (${cert.certificate_number}) for ${cert.insured_name || cert.client?.business_name || cert.client?.contact_name}.

This certificate has been generated securely via The Ewing Agency Portal.

Thank you,
The Ewing Agency`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0e2a47; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">The Ewing Agency Inc.</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Certificate of Insurance Management</p>
        </div>
        <div style="padding: 24px 28px;">
          <p style="font-size: 15px; margin-top: 0;">Hello,</p>
          <p style="font-size: 14px; color: #334155;">
            Please find attached your Certificate of Insurance <strong>(${cert.certificate_number})</strong> for <strong>${cert.policy_type}</strong>.
          </p>
          ${message?.trim() ? `<div style="background-color: #f8fafc; border-left: 4px solid #0e2a47; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #475569;">${message.trim().replace(/\n/g, '<br/>')}</div>` : ''}
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            If you have any questions or require modifications, please contact our team.
          </p>
          <p style="font-size: 14px; font-weight: 600; color: #0e2a47; margin-bottom: 0;">
            The Ewing Agency
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Sent via The Ewing Agency Portal • Confidential Insurance Documentation
        </div>
      </div>
    `;

    const fileName = `${cert.policy_type.replace(/[^a-zA-Z0-9_-]/g, '_')}_${cert.certificate_number}.pdf`;

    const mailOptions = {
      from: `"The Ewing Agency" <${process.env.SMTP_USER}>`,
      to: recipientEmail.trim(),
      subject: emailSubject,
      text: emailBodyText,
      html: htmlBody,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the activity
    await supabase.from('activities').insert({
      certificate_id: cert.id,
      client_name: cert.insured_name || cert.client?.business_name || cert.client?.contact_name || 'Client',
      title: cert.policy_type,
      action: `Certificate emailed to ${recipientEmail.trim()}`,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Email sending error:', error);
    let errorMsg = error.message || 'Failed to send email.';
    if (error.responseCode === 535 || error.code === 'EAUTH') {
      errorMsg = `SMTP Authentication failed with ${process.env.SMTP_HOST}. Please verify SMTP_USER and SMTP_PASS in .env.local.`;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
