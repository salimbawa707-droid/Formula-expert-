import { Scale } from "lucide-react";

interface CostingMarginsCardProps {
  analysisResult: any;
  overheadPct: number;
  setOverheadPct: (val: number) => void;
  packagingCost: number;
  setPackagingCost: (val: number) => void;
}

export function CostingMarginsCard({
  analysisResult,
  overheadPct,
  setOverheadPct,
  packagingCost,
  setPackagingCost,
}: CostingMarginsCardProps) {
  if (!analysisResult) return null;

  const safeNum = (val: any, digits: number = 1): string => {
    const num = Number(val);
    return isNaN(num) ? (0).toFixed(digits) : num.toFixed(digits);
  };

  const costing = analysisResult.costing;
  const isUnpriced = costing?.pricingStatus === 'NO_PRICING' || (costing?.isComplete === false && (!costing?.rawMaterialCost || costing?.rawMaterialCost === 0));
  const isPartial = costing?.pricingStatus === 'PARTIAL_PRICING';

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2">
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scale size={14} className="text-teal-600" /> Raw Materials Costing & Industry Margins Sheet
          </h4>
          <p className="text-[10px] text-gray-400 font-medium">Verify suggested margins before commercial production.</p>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">Overhead:</span>
            <input
              type="number"
              value={overheadPct}
              onChange={(e) => setOverheadPct(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 bg-gray-50 border rounded px-1.5 py-0.5 font-bold"
            />
            <span className="text-gray-400">%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500">Packaging:</span>
            <input
              type="number"
              value={packagingCost}
              onChange={(e) => setPackagingCost(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-16 bg-gray-50 border rounded px-1.5 py-0.5 font-bold"
            />
            <span className="text-gray-400">₹/kg</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 text-xs text-center">
        <div className="bg-gray-50 p-3 rounded-xl border">
          <span className="text-[9px] text-gray-400 font-extrabold block uppercase">
            {isPartial ? 'Raw Material (Partial)' : 'Raw Material'}
          </span>
          <span className="text-base font-black text-[#0f766e] mt-1 block">
            {isUnpriced ? 'Unset' : `₹${safeNum(costing?.rawMaterialCost, 2)}`}
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border">
          <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Mfg. Overhead</span>
          <span className="text-base font-black text-gray-700 mt-1 block">
            {isUnpriced ? '—' : `₹${safeNum(costing?.manufacturingCost, 2)}`}
          </span>
        </div>
        <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100">
          <span className="text-[9px] text-teal-800 font-extrabold block uppercase">Ex-Factory Cost</span>
          <span className="text-base font-black text-teal-700 mt-1 block">
            {isUnpriced ? '—' : `₹${safeNum(costing?.finalExFactoryCost, 2)}`}
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border">
          <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Suggest Whols. (+20%)</span>
          <span className="text-base font-black text-gray-700 mt-1 block">
            {isUnpriced ? '—' : `₹${safeNum(costing?.suggestedWholesale, 2)}`}
          </span>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border">
          <span className="text-[9px] text-gray-400 font-extrabold block uppercase">Distributor (+15%)</span>
          <span className="text-base font-black text-gray-700 mt-1 block">
            {isUnpriced ? '—' : `₹${safeNum(costing?.suggestedDistributor, 2)}`}
          </span>
        </div>
        <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
          <span className="text-[9px] text-emerald-800 font-extrabold block uppercase">MRP (incl. 18% GST)</span>
          <span className="text-base font-black text-emerald-700 mt-1 block">
            {isUnpriced ? '—' : `₹${safeNum(costing?.suggestedMRP, 2)}`}
          </span>
        </div>
      </div>

      {isUnpriced ? (
        <p className="text-[10px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed text-center">
          ℹ️ Price Input Required: Raw-material prices (₹/kg) have not been configured for this formulation. Enter supplier prices in the Formula Builder to calculate commercial margins.
        </p>
      ) : isPartial ? (
        <p className="text-[10px] text-amber-700 font-bold bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 leading-relaxed text-center">
          ⚠️ Partial Costing: Excludes {costing?.missingPriceCount || 'unpriced'} raw material(s). Commercial margin projections reflect partial inputs.
        </p>
      ) : (
        <p className="text-[10px] text-amber-600 font-bold bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 leading-relaxed text-center">
          ⚠️ Reference pricing based on cost + standard industry margins — not market-validated. Verify against local competitor pricing before finalizing.
        </p>
      )}
    </div>
  );
}
