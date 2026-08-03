import React, { useState } from "react";
import { CHEMICALS } from "../data/chemicals";
import { searchUniversalIngredients, getAllUniversalIngredients } from "../data/universalIngredientLibrary";

export function getCategorySpecificIngredients(catName: string, searchQuery: string = "") {
  let categoryFilter = catName;
  if (catName === "Surfactants (Anionic)") categoryFilter = "Anionic";
  else if (catName === "Surfactants (Nonionic)") categoryFilter = "Nonionic";
  else if (catName === "Surfactants (Amphoteric)") categoryFilter = "Amphoteric";
  else if (catName === "Surfactants (Cationic)") categoryFilter = "Cationic";
  else if (catName === "Builders & Chelators") categoryFilter = "Builder";
  else if (catName === "Polymers & Thickeners") categoryFilter = "Polymer";
  else if (catName === "Enzymes") categoryFilter = "Enzyme";
  else if (catName === "pH Adjusters") categoryFilter = "Acid";
  else if (catName === "Preservatives") categoryFilter = "Preservative";
  else if (catName === "Colorants & Fragrance") categoryFilter = "Fragrance";
  else if (catName === "Solvents & Water Carriers") categoryFilter = "Solvent";

  let items = searchUniversalIngredients(searchQuery, { category: categoryFilter });

  if (catName === "Builders & Chelators") {
    const chelators = searchUniversalIngredients(searchQuery, { category: "Chelator" });
    const set = new Map();
    items.concat(chelators).forEach(ing => set.set(ing.id, ing));
    items = Array.from(set.values());
  } else if (catName === "pH Adjusters") {
    const alkalis = searchUniversalIngredients(searchQuery, { category: "Alkali" });
    const set = new Map();
    items.concat(alkalis).forEach(ing => set.set(ing.id, ing));
    items = Array.from(set.values());
  } else if (catName === "Colorants & Fragrance") {
    const colours = searchUniversalIngredients(searchQuery, { category: "Colour" });
    const brighteners = searchUniversalIngredients(searchQuery, { category: "Optical" });
    const set = new Map();
    items.concat(colours, brighteners).forEach(ing => set.set(ing.id, ing));
    items = Array.from(set.values());
  } else if (catName === "Solvents & Water Carriers") {
    const fillers = searchUniversalIngredients(searchQuery, { category: "Filler" });
    const set = new Map();
    items.concat(fillers).forEach(ing => set.set(ing.id, ing));
    items = Array.from(set.values());
  } else if (catName === "Electrolytes & Viscosity Modifiers") {
    const aids = searchUniversalIngredients(searchQuery, { category: "Processing" });
    const fillers = searchUniversalIngredients(searchQuery, { category: "Filler" });
    const set = new Map();
    aids.concat(fillers).forEach(ing => set.set(ing.id, ing));
    items = Array.from(set.values());
  } else if (!categoryFilter || catName === "Uncategorized / Additives") {
    items = searchUniversalIngredients(searchQuery);
  }

  return items;
}

export interface CategoryIngredientSelectorProps {
  catName: string;
  name: string;
  onSelectChange: (val: string) => void;
}

export const CategoryIngredientSelector: React.FC<CategoryIngredientSelectorProps> = React.memo(({
  catName,
  name,
  onSelectChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const items = React.useMemo(() => {
    return getCategorySpecificIngredients(catName, searchQuery);
  }, [catName, searchQuery]);

  const isKnown = React.useMemo(() => {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    return (
      items.some(i => i.name.toLowerCase() === n || i.commonName.toLowerCase() === n) ||
      getAllUniversalIngredients().some(i => i.name.toLowerCase() === n || i.commonName.toLowerCase() === n) ||
      CHEMICALS.some(c => c.commonName.toLowerCase() === n)
    );
  }, [name, items]);

  const selectedValue = isKnown ? name : name ? "custom" : "";

  return (
    <div className="space-y-1">
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`🔍 Search in ${catName}...`}
          className="w-full bg-gray-50 text-gray-800 placeholder:text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-1 text-gray-400 hover:text-gray-600 text-[10px] px-1 font-bold"
          >
            ✕
          </button>
        )}
      </div>

      <select
        value={selectedValue}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "custom") {
            onSelectChange("");
          } else {
            onSelectChange(val);
          }
        }}
        className="w-full bg-white text-gray-900 border border-[#e5e7eb] rounded px-1 py-0.5 text-[11px] font-semibold focus:outline-none cursor-pointer"
      >
        <option value="">-- Select {catName} --</option>
        {items.map((ing) => (
          <option key={ing.id} value={ing.name}>
            {ing.name} {ing.subCategory ? `(${ing.subCategory})` : ""}
          </option>
        ))}
        {name && isKnown && !items.some(i => i.name === name) && (
          <option key={name} value={name}>{name}</option>
        )}
        <option value="custom">✍️ Custom/Other...</option>
      </select>

      {(!isKnown || name === "") && (
        <input
          type="text"
          placeholder="Ingredient name..."
          value={name}
          onChange={(e) => onSelectChange(e.target.value)}
          className="w-full mt-1 bg-white text-gray-900 caret-[#0f766e] placeholder:text-gray-400 border border-[#e5e7eb] rounded px-1 py-0.5 text-[11px] focus:outline-none"
        />
      )}
    </div>
  );
});

export default CategoryIngredientSelector;
