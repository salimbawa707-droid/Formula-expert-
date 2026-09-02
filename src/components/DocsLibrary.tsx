import { FileText, Download, Smartphone, CheckCircle } from 'lucide-react';

export default function DocsLibrary(_props?: any) {
  const docs = [
    { id: '1', title: 'GHS Detergent Labeling Guidelines 2026', type: 'Regulatory Guidelines', date: 'Jan 2026' },
    { id: '2', title: 'Ecolabel EU Criteria for Laundry & Hard Surface Cleaners', type: 'Ecolabel Certification', date: 'Dec 2025' },
    { id: '3', title: 'SOP-204: Viscosity Control & Salt Curve Titration Protocol', type: 'Standard Operating Procedure', date: 'Feb 2026' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="docs-library-root">
      {/* Mobile APK Download Spotlight */}
      <div className="bg-gradient-to-r from-[#0e1c36] via-[#122244] to-[#0c2438] border border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20 shrink-0">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white">Detergent Formula Expert Android App</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                v1.0.0 RELEASE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Native Android APK installation package with full offline formulation calculators, Newton-Raphson pH solvers, and laboratory inventory tracking.
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-teal-300"><CheckCircle size={12} /> Zipalign 4-byte Verified</span>
              <span className="flex items-center gap-1 text-teal-300"><CheckCircle size={12} /> v1/v2/v3 Signed</span>
              <span className="text-slate-400">Target SDK: Android 14 (API 34)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end w-full md:w-auto shrink-0">
          <a
            id="docs-download-apk-btn"
            href="/detergent-formula-expert-release.apk"
            download="detergent-formula-expert-release.apk"
            className="flex flex-col items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-emerald-950/50 border border-emerald-400/40 w-full sm:w-auto cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <span className="text-xs sm:text-sm font-black tracking-wide uppercase">DOWNLOAD APK</span>
            </div>
            <span className="text-[10px] font-normal text-emerald-100/90 whitespace-nowrap leading-none mt-0.5">
              Android APK • 946 KB
            </span>
          </a>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Technical Documentation & SDS Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Access regulatory compliance docs, Safety Data Sheets (SDS), and technical bulletins</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {docs.map(doc => (
          <div key={doc.id} className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 hover:border-blue-500/40 hover:bg-[#111c38] transition">
            <span className="inline-block text-xs font-bold text-blue-300 bg-blue-950/60 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              {doc.type}
            </span>
            <h3 className="font-extrabold text-white text-base">{doc.title}</h3>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-slate-800">
              <span>Updated: {doc.date}</span>
              <span className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition">
                <Download className="w-3.5 h-3.5" /> PDF
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

