export const SIZES_OFFERED = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;
export type Size = (typeof SIZES_OFFERED)[number];

export type SizeRow = {
  size: Size;
  halfChest: number;   // cm — measurement A
  bodyLength: number;  // cm — measurement B
  sleeveLength: number; // cm — measurement C
};

// Stanley/Stella Creator 2.0 STTU169
export const SIZE_GUIDE_CM: SizeRow[] = [
  { size: "XXS", halfChest: 45.5, bodyLength: 62, sleeveLength: 20 },
  { size: "XS",  halfChest: 47.5, bodyLength: 65, sleeveLength: 21 },
  { size: "S",   halfChest: 49.5, bodyLength: 69, sleeveLength: 22.5 },
  { size: "M",   halfChest: 53.5, bodyLength: 73, sleeveLength: 24 },
  { size: "L",   halfChest: 56.5, bodyLength: 75, sleeveLength: 24.5 },
  { size: "XL",  halfChest: 59.5, bodyLength: 77, sleeveLength: 25 },
  { size: "2XL", halfChest: 63.5, bodyLength: 79, sleeveLength: 25.5 },
  { size: "3XL", halfChest: 67.5, bodyLength: 81, sleeveLength: 26 },
];

export const MATERIAL = {
  fit: "Medium Fit · Unisex",
  weightGsm: 180,
  composition: "100% Bio-Baumwolle (kammgarn, ringgesponnen)",
  care: "30°C waschen · Druck nicht bügeln · auf links waschen",
  origin: "Bangladesh",
  certs: ["GOTS", "OEKO-TEX", "VEGAN", "FAIR WEAR"] as const,
};

export function filterSizeGuide(availableSizes: string[]): SizeRow[] {
  if (availableSizes.length === 0) return SIZE_GUIDE_CM;
  const upper = availableSizes.map((s) => s.toUpperCase());
  return SIZE_GUIDE_CM.filter((row) => upper.includes(row.size));
}
