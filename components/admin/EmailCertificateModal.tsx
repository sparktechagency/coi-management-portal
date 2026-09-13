'use client';

import React, { useState, useEffect } from 'react';
import { Mail, X, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';

export interface EmailModalCertificate {
  id: string;
  policyType: string;
  certificateNumber?: string;
  recipientEmail?: string;
  clientName?: string;
  insuredName?: string;
}

interface EmailCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: EmailModalCertificate | null;
  onSuccess?: (recipientEmail: string) => void;
}

export const EmailCertificateModal: React.FC<EmailCertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (certificate) {
      setRecipientEmail(certificate.recipientEmail || '');
      setSubject(`Certificate of Insurance - ${certificate.policyType}${certificate.certificateNumber ? ` (${certificate.certificateNumber})` : ''}`);
      setMessage(
        `Hello,\n\nPlease find attached the Certificate of Insurance for ${certificate.policyType}.\n\nThank you,\nThe Ewing Agency`
      );
      setError(null);
    }
  }, [certificate]);

  if (!isOpen || !certificate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      setError('Please provide a recipient email address.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/certificates/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: certificate.id,
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send certificate email.');
      }

      onSuccess?.(recipientEmail.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending the email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg p-6 sm:p-7 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0e2a47]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Email Certificate</h2>
              <p className="text-xs text-slate-500">Send certificate PDF directly to recipient</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Badge */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{certificate.policyType}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {certificate.certificateNumber ? `${certificate.certificateNumber} • ` : ''}
              {certificate.clientName || certificate.insuredName ? `${certificate.clientName || certificate.insuredName} • ` : ''}
              PDF attachment included
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. client@company.com or holder@domain.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Message / Note</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={sending}
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl text-slate-700 border-slate-300 font-medium text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={sending}
              className="w-2/3 py-2.5 rounded-xl bg-[#0e2a47] hover:bg-[#0a1e33] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
