interface HLBGlossaryProps {
  onClose?: () => void;
  collapsible?: boolean;
}

export default function HLBGlossary({ onClose, collapsible: _collapsible }: HLBGlossaryProps) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="font-semibold text-gray-900">Hydrophilic-Lipophilic Balance (HLB) Guide</h3>
        {onClose && <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>}
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        <p>The HLB scale ranges from 1 to 20 to classify nonionic surfactants based on their solubility in water or oil.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-semibold text-emerald-700">HLB 1 - 3:</span> Anti-foaming agents</li>
          <li><span className="font-semibold text-emerald-700">HLB 4 - 6:</span> Water-in-oil (W/O) emulsifiers</li>
          <li><span className="font-semibold text-emerald-700">HLB 7 - 9:</span> Wetting and spreading agents</li>
          <li><span className="font-semibold text-emerald-700">HLB 8 - 16:</span> Oil-in-water (O/W) emulsifiers</li>
          <li><span className="font-semibold text-emerald-700">HLB 13 - 15:</span> Detergent and grease removal workhorses</li>
          <li><span className="font-semibold text-emerald-700">HLB 16 - 18:</span> Solubilizers and hydrotropes</li>
        </ul>
      </div>
    </div>
  );
}
