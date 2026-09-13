'use client';

import React, { use, useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Upload, FileText, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Avatar } from '@/components/shared/Avatar';
import { deleteCertificateAction } from '@/app/actions/certificates';
import { deleteClientAction } from '@/app/actions/clients';
import { EmailCertificateModal, EmailModalCertificate } from '@/components/admin/EmailCertificateModal';

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const clientId = resolvedParams.clientId;

  const [client, setClient] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & modal states
  const [activeTab, setActiveTab] = useState<'overview' | 'certificates'>('overview');
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [policyType, setPolicyType] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-09-01');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [emailModalCert, setEmailModalCert] = useState<EmailModalCertificate | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchClient = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error('Failed to fetch client details', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading client details...</div>;
  }

  if (!client) {
    return <div className="p-8 text-center text-slate-500">Client not found.</div>;
  }

  const handleDeleteClient = async () => {
    if (!confirm(`Are you sure you want to delete client "${client.contactName}"? This action cannot be undone.`)) {
      return;
    }
    setIsDeletingClient(true);
    try {
      const res = await deleteClientAction(client.id);
      if (res?.error) {
        alert(`Error deleting client: ${res.error}`);
        setIsDeletingClient(false);
      } else {
        router.push('/admin/clients');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete client');
      setIsDeletingClient(false);
    }
  };

  const handleSendEmail = (certName: string) => {
    setToastMessage(`Certificate "${certName}" sent to ${client.contactEmail}`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setModalError('Please attach a valid PDF document (.pdf).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setModalError('File size exceeds the 20MB limit.');
      return;
    }
    setSelectedFile(file);
    setModalError(null);
    // Auto-suggest policy type name if empty
    if (!policyType) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setPolicyType(cleanName);
    }
  };

  const handleAddCertificateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyType.trim()) {
      setModalError('Please enter a policy type name.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      const formData = new FormData();
      formData.append('clientId', clientId);
      formData.append('policyType', policyType.trim());
      formData.append('effectiveDate', effectiveDate);
      formData.append('insuredName', client.businessName || client.contactName);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/admin/certificates/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add certificate.');
      }

      // Re-fetch client & certificates to get live updated data
      await fetchClient();

      // Reset modal fields
      setShowAddCertModal(false);
      setPolicyType('');
      setEffectiveDate('2026-09-01');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setToastMessage(`Certificate "${policyType.trim()}" added for ${client.contactName}`);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err: any) {
      setModalError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCertificate = async (certId: string, certName: string) => {
    if (!confirm(`Are you sure you want to delete certificate "${certName}"?`)) {
      return;
    }
    setDeletingCertId(certId);
    try {
      const res = await deleteCertificateAction(certId);
      if (res?.error) {
        alert(`Error deleting certificate: ${res.error}`);
      } else {
        await fetchClient();
        setToastMessage(`Certificate "${certName}" deleted.`);
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete certificate');
    } finally {
      setDeletingCertId(null);
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
              <Link href="/admin/clients" className="hover:text-slate-700 transition-colors">
                Clients
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 font-semibold">{client.contactName}</span>
            </nav>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{client.contactName}</h1>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push('/admin/clients')}
              className="bg-white border-slate-300 text-slate-700 font-semibold px-5 rounded-lg"
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={isDeletingClient}
              onClick={handleDeleteClient}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 rounded-lg disabled:opacity-50"
            >
              {isDeletingClient ? 'Deleting...' : 'Delete Client'}
            </Button>
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar initials={client.avatarInitials} size="lg" />
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">{client.contactName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{client.contactEmail}</p>
            </div>
          </div>
        </Card>

        {/* Tabs Bar */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-[#0e2a47]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e2a47] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'certificates'
                  ? 'text-[#0e2a47]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Certificates ({certificates.length})
              {activeTab === 'certificates' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0e2a47] rounded-full" />
              )}
            </button>
          </nav>
        </div>

        {/* TAB 1: OVERVIEW CONTENT */}
        {activeTab === 'overview' && (
          <Card className="p-6 sm:p-8 space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Client Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </span>
                <p className="text-sm font-semibold text-slate-900">{client.contactName}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Created
                </span>
                <p className="text-sm font-semibold text-slate-900">{client.createdAt || 'Jan 15, 2025'}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email
                </span>
                <p className="text-sm font-semibold text-slate-900">{client.contactEmail}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Certificates
                </span>
                <p className="text-sm font-semibold text-slate-900">{certificates.length}</p>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 2: CERTIFICATES CONTENT */}
        {activeTab === 'certificates' && (
          <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Certificates</h3>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4 text-white" />}
                className="bg-[#0e2a47] hover:bg-[#0a1e33] font-semibold text-xs py-2 px-3 rounded-lg"
                onClick={() => {
                  setModalError(null);
                  setShowAddCertModal(true);
                }}
              >
                Add Certificate
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Certificate</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 leading-tight">{cert.policyType}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cert.certificateNumber ? `${cert.certificateNumber} • ` : ''}
                          Updated {cert.lastUpdated}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                        {cert.effectiveDate || '—'}
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
                            onClick={() => setEmailModalCert({
                              id: cert.id,
                              policyType: cert.policyType,
                              certificateNumber: cert.certificateNumber,
                              recipientEmail: client.contactEmail,
                              clientName: client.contactName,
                            })}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition-colors cursor-pointer"
                          >
                            Email
                          </button>
                          <button
                            onClick={() => handleDeleteCertificate(cert.id, cert.policyType)}
                            disabled={deletingCertId === cert.id}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {deletingCertId === cert.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {certificates.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                        No certificates added yet for this client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* Add Certificate Modal */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Add Certificate</h2>
              <button
                type="button"
                onClick={() => setShowAddCertModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddCertificateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                  placeholder="e.g. Cyber Liability 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e2a47]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attach PDF Document</label>
                
                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) handleFile(dropped);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-[#0e2a47] bg-sky-50/70 scale-[1.01]'
                      : selectedFile
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-200 hover:border-slate-400 bg-slate-50/60'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-700 font-semibold">
                        Click to select <span className="font-normal text-slate-500">or drag and drop</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PDF certificate document (up to 20MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={submitting}
                  onClick={() => setShowAddCertModal(false)}
                  className="w-1/3 py-2.5 rounded-xl text-slate-700 border-slate-300 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="w-2/3 py-2.5 rounded-xl bg-[#0e2a47] hover:bg-[#0a1e33] text-white font-semibold shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    'Add Certificate'
                  )}
                </Button>
              </div>
            </form>
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

