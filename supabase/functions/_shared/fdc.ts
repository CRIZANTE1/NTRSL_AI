const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';

const NUTRIENT_ENERGY = [1008, 2047, 2048];
const NUTRIENT_PROTEIN = [1003];
const NUTRIENT_CARBS = [1005];
const NUTRIENT_FAT = [1004];

export interface FdcMacros {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
}

export interface FdcFoodSummary {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string | null;
  macros: FdcMacros;
  raw: Record<string, unknown>;
}

interface FdcNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  value?: number;
  amount?: number;
}

function readNutrient(nutrients: FdcNutrient[] | undefined, ids: number[]): number {
  if (!nutrients?.length) return 0;
  for (const id of ids) {
    const hit = nutrients.find((n) => n.nutrientId === id);
    const val = hit?.value ?? hit?.amount;
    if (typeof val === 'number' && Number.isFinite(val)) return val;
  }
  return 0;
}

export function extractMacrosFromFdc(food: Record<string, unknown>): FdcMacros {
  const nutrients = food.foodNutrients as FdcNutrient[] | undefined;
  return {
    calorias: round(readNutrient(nutrients, NUTRIENT_ENERGY)),
    proteina: round(readNutrient(nutrients, NUTRIENT_PROTEIN)),
    carboidratos: round(readNutrient(nutrients, NUTRIENT_CARBS)),
    gordura: round(readNutrient(nutrients, NUTRIENT_FAT)),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function getFdcApiKey(): string {
  const key = Deno.env.get('FDC_API_KEY');
  if (!key) {
    throw new Response(JSON.stringify({ error: 'FDC_API_KEY não configurada.' }), { status: 500 });
  }
  return key;
}

export async function searchFdcFoods(query: string, pageSize = 25): Promise<FdcFoodSummary[]> {
  const apiKey = getFdcApiKey();
  const url = new URL(`${FDC_BASE}/foods/search`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded,Survey (FNDDS)');

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Response(
      JSON.stringify({ error: `FDC search falhou (${res.status}): ${text.slice(0, 200)}` }),
      { status: 502 },
    );
  }

  const data = (await res.json()) as { foods?: Record<string, unknown>[] };
  const foods = Array.isArray(data.foods) ? data.foods : [];

  return foods
    .map((food) => {
      const fdcId = Number(food.fdcId);
      if (!Number.isFinite(fdcId)) return null;
      const description = String(food.description ?? '').trim();
      if (!description) return null;
      return {
        fdcId,
        description,
        dataType: String(food.dataType ?? 'Unknown'),
        brandOwner: (food.brandOwner as string | null | undefined) ?? null,
        macros: extractMacrosFromFdc(food),
        raw: food,
      } satisfies FdcFoodSummary;
    })
    .filter((f): f is FdcFoodSummary => f !== null);
}

export async function fetchFdcFoodDetail(fdcId: number): Promise<FdcFoodSummary | null> {
  const apiKey = getFdcApiKey();
  const url = new URL(`${FDC_BASE}/food/${fdcId}`);
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url);
  if (!res.ok) return null;

  const food = (await res.json()) as Record<string, unknown>;
  const id = Number(food.fdcId);
  if (!Number.isFinite(id)) return null;

  return {
    fdcId: id,
    description: String(food.description ?? '').trim(),
    dataType: String(food.dataType ?? 'Unknown'),
    brandOwner: (food.brandOwner as string | null | undefined) ?? null,
    macros: extractMacrosFromFdc(food),
    raw: food,
  };
}
