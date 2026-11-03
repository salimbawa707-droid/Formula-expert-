import { CanonicalFormulaEvaluationResult } from '../../utils/orchestrator/types';

export class TraceExportUtility {
  public static exportTraceJson(result: CanonicalFormulaEvaluationResult) {
    const trace = result.executionTrace;
    if (!trace) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trace, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scientific_trace_${trace.traceId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  public static exportScientificReportHtml(result: CanonicalFormulaEvaluationResult, formulaName: string) {
    const p = result.pHResult;
    const a = result.activeMatterResult;
    const grade = result.aiGrade;
    const trace = result.executionTrace;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Formulator Scientific Analysis Report - ${formulaName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 10px; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
    .card-title { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .card-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <h1>Formulator Scientific Analysis Report</h1>
  <p><strong>Formulation:</strong> ${formulaName}</p>
  <p><strong>Fingerprint:</strong> <code>${result.provenance.fingerprint}</code></p>
  <p><strong>Trace ID:</strong> <code>${trace?.traceId || 'N/A'}</code></p>
  <p><strong>Evaluated At:</strong> ${new Date().toLocaleString()}</p>

  <h2>Executive Summary</h2>
  <div class="grid">
    <div class="card">
      <div class="card-title">Formulation Grade</div>
      <div class="card-value">${grade.grade} (${grade.numericScore || grade.score}/100)</div>
    </div>
    <div class="card">
      <div class="card-title">Equilibrium pH</div>
      <div class="card-value">${p.ph.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-title">Total Active Surfactants</div>
      <div class="card-value">${a.totalSurfactantActivePct.toFixed(2)}%</div>
    </div>
  </div>

  <h2>Scientific Engine Execution Trace</h2>
  <table>
    <thead>
      <tr>
        <th>Node ID</th>
        <th>Engine Name</th>
        <th>Status</th>
        <th>Duration (ms)</th>
        <th>Evidence Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        trace
          ? Object.values(trace.nodeTraces)
              .map(
                (node) => `
        <tr>
          <td><code>${node.nodeId}</code></td>
          <td>${node.engineName}</td>
          <td><strong>${node.executionStatus}</strong></td>
          <td>${node.durationMs} ms</td>
          <td><span class="badge">${node.evidenceStatus}</span></td>
        </tr>
      `
              )
              .join('')
          : '<tr><td colspan="5">No trace available</td></tr>'
      }
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const safeName = (formulaName || 'formula').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `scientific_report_${safeName}_${trace?.traceId || 'trace'}.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
}
