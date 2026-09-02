import { useState } from 'react';
import { PenTool, Plus } from 'lucide-react';

export default function LabNotebook(_props?: any) {
  const [notes, setNotes] = useState([
    { id: '1', title: 'Batch #2026-08A LABSA Neutralization', date: '2026-08-07', text: 'Exotherm reached 42°C during NaOH addition. Cooling jacket maintained 28°C. Final pH 8.42.' }
  ]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setNotes([
      { id: Date.now().toString(), title: title.trim(), date: new Date().toISOString().split('T')[0], text: text.trim() },
      ...notes
    ]);
    setTitle('');
    setText('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left" id="lab-notebook-root">
      <div className="flex justify-between items-center bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <PenTool className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            R&D Laboratory Notebook
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Record trial observations, batch logs, and physical test data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={addNote} className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-extrabold text-white text-base">New Experiment Log</h3>
          <div>
            <input
              type="text"
              placeholder="Title (e.g. Viscosity Curve Trial)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#131d35] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:bg-[#0b1020] focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
            />
          </div>
          <div>
            <textarea
              rows={4}
              placeholder="Observations, temperature, pH, appearance..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#131d35] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:bg-[#0b1020] focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Save Entry
          </button>
        </form>

        <div className="md:col-span-2 space-y-4">
          {notes.map(note => (
            <div key={note.id} className="bg-[#0e1629] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-2 hover:border-slate-600 transition">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-white text-sm sm:text-base">{note.title}</h4>
                <span className="text-xs font-mono font-bold text-slate-400">{note.date}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
