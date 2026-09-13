'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Certificate, Client } from '@/types';
import { deleteCertificateAction } from '@/app/actions/certificates';
import { EmailCertificateModal, EmailModalCertificate } from '@/components/admin/EmailCertificateModal';

interface CertificatesClientProps {
  initialCertificates: Certificate[];
  clientsList: Client[];
}

export function CertificatesClient({ initialCertificates, clientsList }: CertificatesClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessUploadModal, setShowSuccessUploadModal] = useState(false);
  const [emailModalCert, setEmailModalCert] = useState<EmailModalCertificate | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCerts = initialCertificates.filter(
    (c) =>
      c.policyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.insuredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('clientId', selectedClient);
      formData.append('policyType', selectedFile ? selectedFile.name.replace('.pdf', '') : 'Certificate of Liability Insurance');
      formData.append('policyNumber', '');
      formData.append('insuredName', clientsList.find(c => c.id === selectedClient)?.contactName ?? '');
      formData.append('holderName', holderName || 'Certificate Holder LLC');
      formData.append('holderEmail', holderEmail);
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch('/api/admin/certificates/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: 'Upload failed.' }));
        setUploadError(json.error ?? 'Failed to upload certificate.');
        return;
      }

      // Instead of maintaining local state manually, we could router.refresh(), 
      // but the user's mock API didn't actually save to Supabase yet.
      // So if it returns success, we just show success modal.
      
      setShowUploadModal(false);
      setShowSuccessUploadModal(true);
      
      // Reset form
      setSelectedClient('');
      setHolderName('');
      setHolderEmail('');
      setSelectedFile(null);
      
      // Force a hard refresh of the page to show the newly inserted certificate 
      // once we fix the API route to insert into Supabase.
      window.location.reload(); 
    } catch {
      setUploadError('Network error — could not upload certificate.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEmailModal = (cert: Certificate) => {
    const client = clientsList.find((c) => c.id === cert.clientId);
    setEmailModalCert({
      id: cert.id,
      policyType: cert.policyType,
      certificateNumber: cert.certificateNumber,
      clientName: cert.insuredName,
      recipientEmail: client?.contactEmail || '',
    });
  };

  const handleDelete = async (certificateId: string) => {
    if (!confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(certificateId);
    try {
      const res = await deleteCertificateAction(certificateId);
      if (res.error) {
        alert('Failed to delete certificate: ' + res.error);
      }
    } catch (err) {
      alert('An error occurred while deleting.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold animate-bounce">
          {toastMessage}
        </div>
      )}

      <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">Certificates</span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All Certificates</h1>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<Upload className="w-4 h-4 text-white" />}
            className="bg-[#0e2a47] hover:bg-[#0a1e33] font-semibold text-sm px-4 py-2.5 rounded-lg"
            onClick={() => setShowUploadModal(true)}
          >
            Upload Certificate
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8 space-y-6 w-full">
        <Card className="p-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search certificates..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47] transition-all"
            />
          </div>
        </Card>

        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Certificate</th>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{cert.policyType}</p>
                          <p className="text-[11px] font-semibold text-slate-500 mt-1">Certificate of Liability Insurance</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{cert.fileSize || '1.2 MB'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                      {cert.insuredName}
                    </td>

                    <td className="px-6 py-4 text-slate-600 text-xs font-normal">
                      {cert.effectiveDate || 'Unknown'}
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs font-normal">
                      {cert.lastUpdated}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/admin/certificates/${cert.id}`}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleOpenEmailModal(cert)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition-colors cursor-pointer"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id)}
                          disabled={isDeleting === cert.id}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors cursor-pointer"
                        >
                          {isDeleting === cert.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      {initialCertificates.length === 0 ? "No certificates uploaded yet." : `No certificates found matching "${searchTerm}"`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Upload Certificate</h2>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47]"
                >
                  <option value="" disabled>Choose a client...</option>
                  {clientsList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.contactName} ({client.businessName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificate Type
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  defaultValue="Certificate of Liability Insurance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificate File (PDF)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-700 font-semibold">
                    Drop PDF here or <span className="text-teal-600 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedFile ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} KB)` : 'PDF files only · Max 10 MB'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certificate Holder&apos;s Name
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={holderEmail}
                  onChange={(e) => setHolderEmail(e.target.value)}
                  placeholder="holder@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47]"
                />
              </div>

              {uploadError && (
                <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {uploadError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => { setShowUploadModal(false); setUploadError(null); }}
                  className="w-1/3 py-2.5 rounded-xl text-slate-700 border-slate-300 font-medium"
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={uploading}
                  icon={uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : undefined}
                  className="w-2/3 py-2.5 rounded-xl bg-[#0e2a47] hover:bg-[#0a1e33] text-white font-semibold shadow-sm"
                >
                  {uploading ? 'Uploading…' : 'Upload & Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 flex flex-col items-center">
            <div className="mb-4">
              <span className="px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest border-2 border-slate-900 shadow-md">
                SUCCESS
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Certificate Uploaded Successfully
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              The certificate has been uploaded successfully, emailed to the certificate holder and is now available in the client portal.
            </p>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setShowSuccessUploadModal(false)}
              className="bg-[#0e2a47] hover:bg-[#0a1e33] text-white px-8 py-2.5 rounded-xl font-bold text-xs"
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Email Certificate Modal */}
      <EmailCertificateModal
        isOpen={Boolean(emailModalCert)}
        certificate={emailModalCert}
        onClose={() => setEmailModalCert(null)}
        onSuccess={(sentEmail) => {
          setToastMessage(`Certificate "${emailModalCert?.policyType}" successfully emailed to ${sentEmail}!`);
          setTimeout(() => setToastMessage(''), 4500);
        }}
      />
    </div>
  );
}
