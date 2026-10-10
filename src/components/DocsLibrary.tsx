import { FileText, Download } from 'lucide-react';

export default function DocsLibrary(_props?: any) {
  const docs = [
    { id: '1', title: 'GHS Detergent Labeling Guidelines 2026', type: 'Regulatory Guidelines', date: 'Jan 2026' },
    { id: '2', title: 'Ecolabel EU Criteria for Laundry & Hard Surface Cleaners', type: 'Ecolabel Certification', date: 'Dec 2025' },
    { id: '3', title: 'SOP-204: Viscosity Control & Salt Curve Titration Protocol', type: 'Standard Operating Procedure', date: 'Feb 2026' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="docs-library-root">
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

