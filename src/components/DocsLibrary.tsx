import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, CheckCircle2, Download, FileText, Plus, Search, ShieldAlert, Trash2, Upload, X } from 'lucide-react';
import { db, RndDocumentRecord, RndDocumentReviewStatus, RndDocumentType } from '../db/database';

const DOCUMENT_TYPES: { value: RndDocumentType; label: string }[] = [
  { value: 'SDS', label: 'Safety Data Sheet (SDS)' },
  { value: 'COA', label: 'Certificate of Analysis (COA)' },
  { value: 'TDS', label: 'Technical Data Sheet (TDS)' },
  { value: 'SOP', label: 'Standard Operating Procedure (SOP)' },
  { value: 'REGULATION', label: 'Regulation / Standard' },
  { value: 'CLAIM_EVIDENCE', label: 'Marketing Claim Evidence' },
  { value: 'TEST_REPORT', label: 'Laboratory Test Report' },
  { value: 'OTHER', label: 'Other' }
];

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function createDocumentId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return `doc_${cryptoApi.randomUUID()}`;
  if (typeof cryptoApi?.getRandomValues !== 'function') {
    throw new Error('Secure random ID generation is unavailable in this browser. Update Android System WebView or use a supported browser.');
  }
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `doc_${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function validateAttachment(file: File): Promise<{ error?: string; mimeType?: string }> {
  if (!file.size) return { error: 'Empty files cannot be registered.' };
  if (file.size > MAX_ATTACHMENT_BYTES) return { error: 'Attachment exceeds the 20 MB local storage limit.' };

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const expectedMime: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    txt: 'text/plain',
    csv: 'text/csv',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  const expected = expectedMime[extension];
  if (!expected) return { error: 'Unsupported file extension. Use PDF, PNG, JPEG, TXT, CSV or DOCX.' };
  const declared = file.type.trim().toLowerCase();
  const compatibleTextMime = extension === 'csv' && declared === 'text/plain';
  if (declared && declared !== expected && declared !== 'application/octet-stream' && !compatibleTextMime) {
    return { error: 'File extension and declared MIME type do not match.' };
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const starts = (...signature: number[]) => signature.every((byte, index) => header[index] === byte);
  if (extension === 'pdf' && !new TextDecoder().decode(header.slice(0, 5)).startsWith('%PDF-')) {
    return { error: 'The selected file does not contain a valid PDF signature.' };
  }
  if (extension === 'png' && !starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { error: 'The selected file does not contain a valid PNG signature.' };
  }
  if ((extension === 'jpg' || extension === 'jpeg') && !starts(0xff, 0xd8, 0xff)) {
    return { error: 'The selected file does not contain a valid JPEG signature.' };
  }
  if (extension === 'docx' && (!starts(0x50, 0x4b, 0x03, 0x04) || declared !== expected)) {
    return { error: 'DOCX files must have the official DOCX MIME type and a valid ZIP container signature.' };
  }
  if (extension === 'txt' || extension === 'csv') {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (text.includes('\\u0000')) return { error: 'The selected text file contains binary data.' };
    } catch {
      return { error: 'The selected text file is not valid readable text.' };
    }
  }
  return { mimeType: declared && declared !== 'application/octet-stream' ? declared : expected };
}

function dateState(expiryDate?: string): 'CURRENT' | 'EXPIRING' | 'EXPIRED' | 'NO_EXPIRY' | 'INVALID' {
  if (!expiryDate) return 'NO_EXPIRY';
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(expiryDate)) return 'INVALID';
  const expiry = new Date(`${expiryDate}T23:59:59`);
  if (!Number.isFinite(expiry.getTime()) || expiry.toISOString().slice(0, 10) !== expiryDate) return 'INVALID';
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'EXPIRED';
  if (days <= 30) return 'EXPIRING';
  return 'CURRENT';
}

function statusLabel(status: RndDocumentReviewStatus): string {
  if (status === 'REVIEWED_BY_USER') return 'Reviewed by user';
  if (status === 'REJECTED') return 'Rejected';
  return 'Unreviewed';
}

function formatSize(bytes?: number): string {
  if (!bytes) return 'No attachment';
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocsLibrary() {
  const [documents, setDocuments] = useState<RndDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | RndDocumentType>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<RndDocumentType>('SDS');
  const [issuer, setIssuer] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [revision, setRevision] = useState('');
  const [jurisdiction, setJurisdiction] = useState('INDIA');
  const [ingredientOrFormula, setIngredientOrFormula] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');
  const [reviewStatus, setReviewStatus] = useState<RndDocumentReviewStatus>('UNREVIEWED');
  const [attachment, setAttachment] = useState<File | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await db.documents.orderBy('updatedAt').reverse().toArray();
      setDocuments(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the local document register.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter(doc => {
      const matchesType = typeFilter === 'ALL' || doc.documentType === typeFilter;
      const haystack = [doc.title, doc.issuer, doc.referenceNumber, doc.ingredientOrFormula, doc.jurisdiction].filter(Boolean).join(' ').toLowerCase();
      return matchesType && (!q || haystack.includes(q));
    });
  }, [documents, search, typeFilter]);

  const resetForm = () => {
    setTitle(''); setDocumentType('SDS'); setIssuer(''); setReferenceNumber('');
    setRevision(''); setJurisdiction('INDIA'); setIngredientOrFormula('');
    setSourceUrl(''); setIssueDate(''); setExpiryDate(''); setReviewNotes('');
    setReviewedBy(''); setReviewStatus('UNREVIEWED'); setAttachment(null);
    setError('');
  };

  const saveDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!title.trim()) { setError('Document title is required.'); return; }
    if (!attachment && !sourceUrl.trim()) { setError('Attach a file or provide its source URL.'); return; }
    if (sourceUrl.trim()) {
      try {
        const parsed = new URL(sourceUrl.trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      } catch {
        setError('Source URL must be a valid HTTPS or HTTP URL.'); return;
      }
    }
    const attachmentValidation = attachment ? await validateAttachment(attachment) : {};
    if (attachmentValidation.error) { setError(attachmentValidation.error); return; }
    if (reviewStatus === 'REVIEWED_BY_USER' && !reviewedBy.trim()) {
      setError('Enter the reviewer name for a user-reviewed record.'); return;
    }
    if (expiryDate && issueDate && expiryDate < issueDate) {
      setError('Expiry / review date cannot be earlier than the issue date.'); return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const record: RndDocumentRecord = {
        id: createDocumentId(),
        title: title.trim(),
        documentType,
        issuer: issuer.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        revision: revision.trim() || undefined,
        jurisdiction: jurisdiction || undefined,
        ingredientOrFormula: ingredientOrFormula.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        reviewStatus,
        reviewedBy: reviewStatus === 'REVIEWED_BY_USER' ? reviewedBy.trim() : undefined,
        reviewedAt: reviewStatus === 'REVIEWED_BY_USER' ? now : undefined,
        reviewNotes: reviewNotes.trim() || undefined,
        fileName: attachment?.name,
        mimeType: attachment ? attachmentValidation.mimeType : undefined,
        fileSizeBytes: attachment?.size,
        attachment: attachment || undefined,
        createdAt: now,
        updatedAt: now
      };
      await db.documents.add(record);
      resetForm();
      setShowForm(false);
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save document.');
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = (doc: RndDocumentRecord) => {
    if (!doc.attachment || !doc.fileName) return;
    const url = URL.createObjectURL(doc.attachment);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = doc.fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Android WebView may start the download asynchronously; revoke only after
    // the click has been handed to the browser download pipeline.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const deleteDocument = async (id: string) => {
    if (!window.confirm('Delete this local document record and its stored attachment?')) return;
    try {
      await db.documents.delete(id);
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the document record.');
    }
  };

  const reviewDocument = async (doc: RndDocumentRecord) => {
    const reviewer = window.prompt('Name of the person who reviewed this document:');
    if (!reviewer?.trim()) return;
    try {
      const now = new Date().toISOString();
      await db.documents.update(doc.id, {
        reviewStatus: 'REVIEWED_BY_USER',
        reviewedBy: reviewer.trim(),
        reviewedAt: now,
        updatedAt: now
      });
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the document review state.');
    }
  };

  const unreviewDocument = async (doc: RndDocumentRecord) => {
    try {
      await db.documents.update(doc.id, {
        reviewStatus: 'UNREVIEWED',
        reviewedBy: undefined,
        reviewedAt: undefined,
        updatedAt: new Date().toISOString()
      });
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reopen the document review.');
    }
  };

  const expiredCount = documents.filter(d => dateState(d.expiryDate) === 'EXPIRED').length;
  const unreviewedCount = documents.filter(d => d.reviewStatus === 'UNREVIEWED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="docs-library-root">
      <div className="rounded-2xl border border-slate-700/80 bg-[#0e1629] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold text-white">
              <span className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400"><FileText className="h-6 w-6" /></span>
              Technical Documents & Evidence Register
            </h1>
            <p className="mt-2 text-sm text-slate-400">Track SDS, COA, TDS, SOPs, regulations and claim evidence with source and review history.</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
            <Plus className="h-4 w-4" /> Add document
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100">
        <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Local-only register:</strong> files and metadata are stored on this device in browser IndexedDB. They are not cloud-synced or backed up automatically. “Reviewed by user” records a human review action; it does not certify authenticity, legal compliance, product safety or a marketing claim.</div></div>
      </div>

      {error && !showForm && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-[#0e1629] p-4"><div className="text-xs text-slate-400">Total records</div><div className="mt-1 text-2xl font-bold text-white">{documents.length}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#0e1629] p-4"><div className="text-xs text-slate-400">Awaiting review</div><div className="mt-1 text-2xl font-bold text-amber-300">{unreviewedCount}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#0e1629] p-4"><div className="text-xs text-slate-400">Past review / expiry date</div><div className="mt-1 text-2xl font-bold text-rose-300">{expiredCount}</div></div>
      </div>

      {showForm && <form onSubmit={saveDocument} className="space-y-4 rounded-2xl border border-blue-500/30 bg-[#0e1629] p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-white">Register a document</h2><button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
        {error && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">Document title *<input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300">Document type<select value={documentType} onChange={e => setDocumentType(e.target.value as RndDocumentType)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white">{DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          <label className="text-sm text-slate-300">Issuer / supplier<input value={issuer} onChange={e => setIssuer(e.target.value)} maxLength={160} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300">Document / lot reference<input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300">Revision / version<input value={revision} onChange={e => setRevision(e.target.value)} maxLength={80} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300">Jurisdiction<select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white"><option value="INDIA">India</option><option value="EU">European Union</option><option value="US_FEDERAL">United States (Federal)</option><option value="GLOBAL_UN_GHS">Global / UN GHS</option><option value="OTHER">Other / not scoped</option></select></label>
          <label className="text-sm text-slate-300">Ingredient / formula association<input value={ingredientOrFormula} onChange={e => setIngredientOrFormula(e.target.value)} maxLength={160} placeholder="e.g. SLES 28%, Formula ID" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300">Source URL<input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300">Issue date<input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300">Expiry / next review date<input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} min={issueDate || undefined} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
          <label className="text-sm text-slate-300 md:col-span-2">Attachment (PDF, PNG, JPEG, TXT, CSV, DOCX; max 20 MB)<input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx" onChange={e => setAttachment(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white" /></label>
          <label className="text-sm text-slate-300">Initial review state<select value={reviewStatus} onChange={e => setReviewStatus(e.target.value as RndDocumentReviewStatus)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white"><option value="UNREVIEWED">Unreviewed</option><option value="REVIEWED_BY_USER">Reviewed by user</option><option value="REJECTED">Rejected</option></select></label>
          {reviewStatus === 'REVIEWED_BY_USER' && <label className="text-sm text-slate-300">Reviewer name *<input value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>}
          <label className="text-sm text-slate-300 md:col-span-2">Review notes<textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={2} maxLength={2000} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2.5 text-white" /></label>
        </div>
        <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Upload className="h-4 w-4" />{saving ? 'Saving…' : 'Save record'}</button></div>
      </form>}

      {error && !showForm && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, issuer, reference or ingredient…" className="w-full rounded-xl border border-slate-700 bg-[#0e1629] py-2.5 pl-9 pr-3 text-sm text-white" /></div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'ALL' | RndDocumentType)} className="rounded-xl border border-slate-700 bg-[#0e1629] px-3 py-2.5 text-sm text-white"><option value="ALL">All document types</option>{DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
      </div>

      {loading ? <div className="rounded-xl border border-slate-700 bg-[#0e1629] p-8 text-center text-slate-400">Loading local records…</div>
        : filteredDocuments.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 bg-[#0e1629] p-10 text-center"><Archive className="mx-auto h-8 w-8 text-slate-500" /><h3 className="mt-3 font-semibold text-white">No registered documents</h3><p className="mt-1 text-sm text-slate-400">Add your supplier SDS, COA, TDS, SOP or test evidence. No sample certificates are preloaded.</p></div>
        : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{filteredDocuments.map(doc => {
          const validity = dateState(doc.expiryDate);
          return <article key={doc.id} className="space-y-3 rounded-xl border border-slate-700 bg-[#0e1629] p-4">
            <div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wide text-blue-300">{DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label || doc.documentType}</span><h3 className="mt-1 font-bold text-white">{doc.title}</h3><p className="mt-1 text-xs text-slate-400">{doc.issuer || 'Issuer not recorded'}{doc.referenceNumber ? ` · ${doc.referenceNumber}` : ''}</p></div><button onClick={() => void deleteDocument(doc.id)} aria-label={`Delete ${doc.title}`} className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/40 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400"><div>Jurisdiction: <span className="text-slate-200">{doc.jurisdiction || 'Not specified'}</span></div><div>Revision: <span className="text-slate-200">{doc.revision || 'Not specified'}</span></div><div>Issue: <span className="text-slate-200">{doc.issueDate || 'Not recorded'}</span></div><div>Review / expiry: <span className={(validity === 'EXPIRED' || validity === 'INVALID') ? 'text-rose-300' : validity === 'EXPIRING' ? 'text-amber-300' : 'text-slate-200'}>{doc.expiryDate || 'No date'}{validity === 'INVALID' ? ' · Invalid date' : ''}</span></div></div>
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3"><span className={`rounded-full border px-2.5 py-1 text-xs ${doc.reviewStatus === 'REVIEWED_BY_USER' ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300' : doc.reviewStatus === 'REJECTED' ? 'border-rose-500/30 bg-rose-950/30 text-rose-300' : 'border-amber-500/30 bg-amber-950/30 text-amber-300'}`}>{statusLabel(doc.reviewStatus)}</span>{(validity === 'EXPIRED' || validity === 'INVALID') && <span className="inline-flex items-center gap-1 text-xs text-rose-300"><AlertTriangle className="h-3 w-3" />{validity === 'EXPIRED' ? 'Past review date' : 'Invalid expiry date'}</span>}{doc.reviewedBy && <span className="text-xs text-slate-400">Reviewer: {doc.reviewedBy}</span>}</div>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-slate-500">{doc.fileName || (doc.sourceUrl ? 'Source link only' : 'No file')} · {formatSize(doc.fileSizeBytes)}</span><div className="flex gap-2">{doc.attachment && <button onClick={() => downloadAttachment(doc)} className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"><Download className="h-3.5 w-3.5" />Download</button>}{doc.reviewStatus === 'UNREVIEWED' && <button onClick={() => void reviewDocument(doc)} className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"><CheckCircle2 className="h-3.5 w-3.5" />Mark reviewed</button>}{doc.reviewStatus === 'REVIEWED_BY_USER' && <button onClick={() => void unreviewDocument(doc)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300">Reopen review</button>}{doc.sourceUrl && <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-blue-300">Source</a>}</div></div>
          </article>;
        })}</div>}
      <p className="text-xs text-slate-500">This register tracks documents only. It does not generate SDS content, infer COA values, verify supplier authenticity, or grant regulatory approval. Keep separate backups of important attachments.</p>
    </div>
  );
}
