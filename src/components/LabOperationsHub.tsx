import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Beaker, CalendarClock, Check, FileUp, FlaskConical, PackageCheck, Plus, ShieldAlert } from 'lucide-react';
import { db, LabMeasurementRecord, RawMaterialLotRecord, StabilityStudyRecord } from '../db/database';

type Workspace = 'measurements' | 'lots' | 'stability';
const id = (prefix: string) => prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
const isoNow = () => new Date().toISOString();

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const panel = 'rounded-2xl border border-slate-800 bg-slate-900/80 p-5';
const field = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none';
const button = 'inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function LabOperationsHub() {
  const [workspace, setWorkspace] = useState<Workspace>('measurements');
  const [measurements, setMeasurements] = useState<LabMeasurementRecord[]>([]);
  const [lots, setLots] = useState<RawMaterialLotRecord[]>([]);
  const [studies, setStudies] = useState<StabilityStudyRecord[]>([]);
  const [message, setMessage] = useState('');
  const [pendingRows, setPendingRows] = useState<LabMeasurementRecord[]>([]);
  const [csvName, setCsvName] = useState('');
  const [lotForm, setLotForm] = useState({ materialName: '', lotNumber: '', supplier: '', receivedKg: '', expiryDate: '', coaFileName: '' });
  const [studyForm, setStudyForm] = useState({ formulaName: '', batchNumber: '', sampleId: '', condition: '25 °C / ambient', intervalDays: '0, 7, 14, 28, 56, 84' });

  const refresh = async () => {
    const [m, l, s] = await Promise.all([
      db.labMeasurements.orderBy('measuredAt').reverse().toArray(),
      db.rawMaterialLots.orderBy('receivedAt').reverse().toArray(),
      db.stabilityStudies.orderBy('createdAt').reverse().toArray()
    ]);
    setMeasurements(m); setLots(l); setStudies(s);
  };
  useEffect(() => { refresh().catch(() => setMessage('Could not open local lab database.')); }, []);

  const dueCheckpoints = useMemo(() => studies.reduce((n, s) => n + s.observations.filter(o => o.status === 'DUE' && s.status === 'ACTIVE').length, 0), [studies]);

  const importCsv = async (file?: File) => {
    if (!file) return;
    setMessage('');
    try {
      const matrix = parseCsv(await file.text());
      if (matrix.length < 2) throw new Error('CSV needs a header row and at least one measurement.');
      const headers = matrix[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const col = (...names: string[]) => headers.findIndex(h => names.includes(h));
      const ix = {
        sample: col('sampleid', 'sample'), batch: col('batchnumber', 'batch'), parameter: col('parameter', 'test'),
        value: col('value'), unit: col('unit'), method: col('method'), instrument: col('instrumentid', 'instrument'),
        calibrated: col('calibrationvalid', 'calibrated'), analyst: col('analyst', 'operator'), measured: col('measuredat', 'timestamp', 'date')
      };
      const required = ['sample', 'parameter', 'value', 'unit', 'method', 'instrument', 'calibrated', 'analyst'];
      const missing = required.filter(k => ix[k as keyof typeof ix] < 0);
      if (missing.length) throw new Error('Missing required columns: ' + missing.join(', '));
      const importedAt = isoNow();
      const parsed = matrix.slice(1).map((cells, rowIndex) => {
        const get = (key: keyof typeof ix) => ix[key] >= 0 ? (cells[ix[key]] || '') : '';
        const value = Number(get('value'));
        const calibrationValid = ['true', 'yes', 'valid', '1'].includes(get('calibrated').toLowerCase());
        if (!get('sample').trim() || !get('parameter').trim() || !Number.isFinite(value) || !get('unit').trim() || !get('method').trim() || !get('instrument').trim() || !get('analyst').trim()) {
          throw new Error('Invalid measurement on CSV data row ' + (rowIndex + 2) + '. Check sample, parameter, numeric value, unit, method, instrument and analyst.');
        }
        const rawDate = get('measured');
        const measuredAt = rawDate ? new Date(rawDate).toISOString() : importedAt;
        return {
          id: id('meas'), sampleId: get('sample').trim(), batchNumber: get('batch').trim(),
          parameter: get('parameter').trim(), value, unit: get('unit').trim(), method: get('method').trim(),
          instrumentId: get('instrument').trim(), calibrationValid, analyst: get('analyst').trim(),
          measuredAt, evidenceLevel: calibrationValid ? 'MEASURED' as const : 'UNVERIFIED' as const,
          sourceFile: file.name, importedAt
        };
      });
      setCsvName(file.name); setPendingRows(parsed); setMessage(parsed.length + ' rows parsed. Review calibration status before importing.');
    } catch (error) {
      setPendingRows([]);
      setMessage(error instanceof Error ? error.message : 'CSV could not be read.');
    }
  };

  const commitCsv = async () => {
    if (!pendingRows.length) return;
    await db.labMeasurements.bulkAdd(pendingRows);
    setPendingRows([]); setCsvName('');
    setMessage('Imported ' + pendingRows.length + ' lab measurements into this device’s local database.');
    await refresh();
  };

  const saveLot = async (event: React.FormEvent) => {
    event.preventDefault();
    const receivedKg = Number(lotForm.receivedKg);
    if (!lotForm.materialName.trim() || !lotForm.lotNumber.trim() || !Number.isFinite(receivedKg) || receivedKg <= 0) {
      setMessage('Enter a material, lot number, and positive received mass.'); return;
    }
    await db.rawMaterialLots.add({
      id: id('lot'), materialName: lotForm.materialName.trim(), lotNumber: lotForm.lotNumber.trim(),
      supplier: lotForm.supplier.trim(), receivedKg, expiryDate: lotForm.expiryDate || undefined,
      coaFileName: lotForm.coaFileName || undefined, coaReviewed: false, status: 'QUARANTINE', receivedAt: isoNow()
    });
    setLotForm({ materialName: '', lotNumber: '', supplier: '', receivedKg: '', expiryDate: '', coaFileName: '' });
    setMessage('Lot recorded in quarantine. It is not released for production.');
    await refresh();
  };

  const saveStudy = async (event: React.FormEvent) => {
    event.preventDefault();
    const days = studyForm.intervalDays.split(',').map(v => Number(v.trim()));
    if (!studyForm.formulaName.trim() || !studyForm.sampleId.trim() || days.some(d => !Number.isInteger(d) || d < 0) || !days.length) {
      setMessage('Enter formula, sample, and comma-separated non-negative whole-day checkpoints.'); return;
    }
    const startDate = new Date().toISOString().slice(0, 10);
    await db.stabilityStudies.add({
      id: id('stability'), formulaName: studyForm.formulaName.trim(), batchNumber: studyForm.batchNumber.trim(),
      sampleId: studyForm.sampleId.trim(), condition: studyForm.condition.trim(), startDate,
      intervalDays: [...new Set(days)].sort((a, b) => a - b),
      observations: [...new Set(days)].sort((a, b) => a - b).map(day => ({ day, status: 'DUE' as const })),
      status: 'ACTIVE', createdAt: isoNow()
    });
    setStudyForm({ formulaName: '', batchNumber: '', sampleId: '', condition: '25 °C / ambient', intervalDays: '0, 7, 14, 28, 56, 84' });
    setMessage('Stability schedule created. Record observations at each checkpoint.');
    await refresh();
  };

  const recordCheckpoint = async (study: StabilityStudyRecord, day: number) => {
    const result = window.prompt('Record observed appearance, pH, viscosity, separation, or other results for day ' + day + '.');
    if (result === null || !result.trim()) return;
    await db.stabilityStudies.update(study.id, {
      observations: study.observations.map(o => o.day === day ? { ...o, result: result.trim(), observedAt: isoNow(), status: 'RECORDED' } : o)
    });
    await refresh();
  };

  const releaseLot = async (lot: RawMaterialLotRecord) => {
    if (!lot.coaFileName) { setMessage('Attach or record the supplier COA before a reviewer can release this lot.'); return; }
    if (!window.confirm('Confirm you reviewed the supplier COA and acceptance criteria for lot ' + lot.lotNumber + '?')) return;
    await db.rawMaterialLots.update(lot.id, { coaReviewed: true, status: 'RELEASED' });
    setMessage('Lot marked released by local user after confirmation. This is not a digital signature or independent QA approval.');
    await refresh();
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-4 text-slate-100 md:p-6">
      <header className="rounded-2xl border border-cyan-800/50 bg-gradient-to-r from-cyan-950/70 to-slate-900 p-6">
        <div className="flex items-center gap-3"><FlaskConical className="text-cyan-300" /><div><h1 className="text-2xl font-black">Lab-to-Production Workflows</h1><p className="text-sm text-slate-300">Measured evidence intake, raw-material lot control, stability scheduling, and hardware readiness.</p></div></div>
        <p className="mt-4 rounded-lg border border-amber-600/40 bg-amber-950/30 p-3 text-xs text-amber-200"><AlertTriangle className="mr-1 inline h-4 w-4" /> Local-first pilot: records stay in this browser database. CSV values are not independently verified; a valid calibration flag is supplied by the importing operator.</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {([['measurements', 'Lab data intake'], ['lots', 'Raw material lots'], ['stability', 'Stability studies']] as [Workspace, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setWorkspace(key)} className={'rounded-lg border px-4 py-2 text-sm font-bold ' + (workspace === key ? 'border-cyan-500 bg-cyan-950 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-300')}>{label}</button>
        ))}
      </nav>
      {message && <div role="status" className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">{message}</div>}

      {workspace === 'measurements' && <section className={panel + ' space-y-4'}>
        <div className="flex items-center gap-2"><Activity className="text-cyan-300" /><h2 className="text-lg font-bold">Import instrument results</h2></div>
        <p className="text-sm text-slate-400">CSV headers: sampleId, batchNumber, parameter, value, unit, method, instrumentId, calibrationValid, analyst, measuredAt. Invalid rows block the whole import.</p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm hover:border-cyan-500"><FileUp size={16} />Choose results CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={e => importCsv(e.target.files?.[0])} /></label>
        {csvName && <div className="text-xs text-slate-400">{csvName}: {pendingRows.length} rows ready for review.</div>}
        {pendingRows.length > 0 && <div className="space-y-3">
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-800"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-800"><tr>{['Sample','Batch','Parameter','Value','Unit','Instrument','Calibration','Evidence'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{pendingRows.slice(0, 100).map(row => <tr key={row.id} className="border-t border-slate-800"><td className="p-2">{row.sampleId}</td><td className="p-2">{row.batchNumber || '—'}</td><td className="p-2">{row.parameter}</td><td className="p-2">{row.value}</td><td className="p-2">{row.unit}</td><td className="p-2">{row.instrumentId}</td><td className="p-2">{row.calibrationValid ? 'Marked valid' : 'Not valid'}</td><td className="p-2">{row.evidenceLevel}</td></tr>)}</tbody></table></div>
          {pendingRows.length > 100 && <p className="text-xs text-amber-300">Showing first 100 of {pendingRows.length} rows.</p>}
          <button className={button} onClick={commitCsv}><Check size={16} />Import reviewed rows</button>
        </div>}
        <div className="overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="text-slate-400">{['Sample','Batch','Parameter','Result','Method / instrument','Analyst','Evidence'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{measurements.slice(0, 100).map(m => <tr key={m.id} className="border-t border-slate-800"><td className="p-2">{m.sampleId}</td><td className="p-2">{m.batchNumber || '—'}</td><td className="p-2">{m.parameter}</td><td className="p-2">{m.value} {m.unit}</td><td className="p-2">{m.method} / {m.instrumentId}</td><td className="p-2">{m.analyst}</td><td className="p-2">{m.evidenceLevel}</td></tr>)}</tbody></table></div>
      </section>}

      {workspace === 'lots' && <section className={panel + ' space-y-4'}>
        <div className="flex items-center gap-2"><PackageCheck className="text-cyan-300" /><h2 className="text-lg font-bold">Supplier lot and COA control</h2></div>
        <form onSubmit={saveLot} className="grid gap-3 md:grid-cols-3">
          <input className={field} placeholder="Material name *" value={lotForm.materialName} onChange={e => setLotForm({ ...lotForm, materialName: e.target.value })} />
          <input className={field} placeholder="Supplier lot number *" value={lotForm.lotNumber} onChange={e => setLotForm({ ...lotForm, lotNumber: e.target.value })} />
          <input className={field} placeholder="Supplier" value={lotForm.supplier} onChange={e => setLotForm({ ...lotForm, supplier: e.target.value })} />
          <input className={field} type="number" min="0.001" step="0.001" placeholder="Received kg *" value={lotForm.receivedKg} onChange={e => setLotForm({ ...lotForm, receivedKg: e.target.value })} />
          <input className={field} type="date" aria-label="Expiry date" value={lotForm.expiryDate} onChange={e => setLotForm({ ...lotForm, expiryDate: e.target.value })} />
          <input className={field} placeholder="COA file name / reference" value={lotForm.coaFileName} onChange={e => setLotForm({ ...lotForm, coaFileName: e.target.value })} />
          <button className={button} type="submit"><Plus size={16} />Receive lot into quarantine</button>
        </form>
        <div className="overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="text-slate-400">{['Material','Lot','Supplier','Received','Expiry','COA reference','Status','Review'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{lots.map(lot => <tr key={lot.id} className="border-t border-slate-800"><td className="p-2">{lot.materialName}</td><td className="p-2">{lot.lotNumber}</td><td className="p-2">{lot.supplier || '—'}</td><td className="p-2">{lot.receivedKg} kg</td><td className="p-2">{lot.expiryDate || '—'}</td><td className="p-2">{lot.coaFileName || 'Missing'}</td><td className="p-2 font-bold">{lot.status}</td><td className="p-2">{lot.status === 'QUARANTINE' ? <button className="text-cyan-300 underline" onClick={() => releaseLot(lot)}>Review / release</button> : lot.coaReviewed ? 'Reviewed' : '—'}</td></tr>)}</tbody></table></div>
        <p className="text-xs text-amber-300"><ShieldAlert className="mr-1 inline h-4 w-4" />These lot records are not yet linked to stock deduction or production genealogy; a release click records a local confirmation, not a QA e-signature.</p>
      </section>}

      {workspace === 'stability' && <section className={panel + ' space-y-4'}>
        <div className="flex items-center gap-2"><CalendarClock className="text-cyan-300" /><h2 className="text-lg font-bold">Stability study schedule</h2><span className="rounded-full bg-amber-950 px-2 py-1 text-xs text-amber-200">{dueCheckpoints} checkpoints due</span></div>
        <form onSubmit={saveStudy} className="grid gap-3 md:grid-cols-3">
          <input className={field} placeholder="Formula name *" value={studyForm.formulaName} onChange={e => setStudyForm({ ...studyForm, formulaName: e.target.value })} />
          <input className={field} placeholder="Batch number" value={studyForm.batchNumber} onChange={e => setStudyForm({ ...studyForm, batchNumber: e.target.value })} />
          <input className={field} placeholder="Sample ID *" value={studyForm.sampleId} onChange={e => setStudyForm({ ...studyForm, sampleId: e.target.value })} />
          <input className={field} placeholder="Storage condition" value={studyForm.condition} onChange={e => setStudyForm({ ...studyForm, condition: e.target.value })} />
          <input className={field} placeholder="Checkpoint days, e.g. 0, 7, 14, 28" value={studyForm.intervalDays} onChange={e => setStudyForm({ ...studyForm, intervalDays: e.target.value })} />
          <button className={button} type="submit"><Plus size={16} />Create study</button>
        </form>
        <div className="space-y-3">{studies.map(study => <article key={study.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{study.formulaName} — {study.sampleId}</h3><p className="text-xs text-slate-400">Batch {study.batchNumber || '—'} · {study.condition} · Started {study.startDate}</p></div><span className="text-xs text-cyan-300">{study.status}</span></div>
          <div className="mt-3 flex flex-wrap gap-2">{study.observations.map(o => <button key={o.day} disabled={study.status !== 'ACTIVE'} onClick={() => recordCheckpoint(study, o.day)} className={'rounded-lg border px-3 py-2 text-xs ' + (o.status === 'RECORDED' ? 'border-emerald-700 bg-emerald-950/50 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-300')}>Day {o.day}: {o.status}{o.result ? ' · ' + o.result : ''}</button>)}</div>
        </article>)}</div>
        {studies.length === 0 && <p className="text-sm text-slate-400"><Beaker className="mr-1 inline h-4 w-4" />No stability studies have been created on this device.</p>}
      </section>}

      <footer className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">This pilot stores data in browser IndexedDB. No real instrument connection, verified CSV signature, cloud synchronization, predictive shelf-life claim, or regulatory release decision is provided.</footer>
    </div>
  );
}
