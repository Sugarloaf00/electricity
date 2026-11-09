export type Language = 'en' | 'af';

export interface TariffParameters {
  baseTariff: number; // Basistarief (R/kWh) e.g. 3.522
  fixedNetworkFee: number; // Vaste Netwerkfooi (R) e.g. 0.00
  vatRate: number; // BTW-koers (%) e.g. 15.0
  tieredSurcharge: number; // Traptarief Toeslag (R/kWh) e.g. 0.000
  tierThresholdKwh: number; // Threshold above which tiered surcharge applies (0 = all kWh)
  vatInclusive: boolean; // Whether baseTariff already includes VAT (true in user's sheet: 110 * 3.522 = 387.42)
  currencySymbol: string; // Default 'R'
}

export interface MonthlyMeterEntry {
  monthIndex: number; // 0 = Jan .. 11 = Dec
  monthEn: string;
  monthAf: string;
  billingPeriod: string;
  readingDate: string; // e.g. '2026-11-01' or ''
  previousReading: number | null; // Vorige Lesing (kWh)
  currentReading: number | null; // Huidige Lesing (kWh)
  manualConsumption: number | null; // Optional direct consumption override if readings are not used
  costOverride: number | null; // Optional manual cost override
  invoiceRef: string; // Faktuurverwysing
  notes: string; // Notas
}

export interface ComputedMonthRow {
  monthIndex: number;
  monthEn: string;
  monthAf: string;
  billingPeriod: string;
  readingDate: string;
  previousReading: number | null;
  currentReading: number | null;
  consumptionKwh: number;
  isActive: boolean;
  energyCostExclVat: number;
  vatAmount: number;
  fixedFeeAmount: number;
  surchargeAmount: number;
  totalCost: number;
  effectiveRate: number; // R/kWh
  usageVarPercent: number | null; // null for first month ('-')
  momCostVarPercent: number | null; // null for first month ('-')
  invoiceRef: string;
  notes: string;
}

export interface MonthlyReportSummary {
  rows: ComputedMonthRow[];
  totalConsumptionKwh: number;
  totalEnergyCost: number;
  totalExclVat: number;
  totalVatAmount: number;
  avgMonthlyUsageKwh: number;
  avgMonthlyCost: number;
  avgRatePerKwh: number;
  peakMonthUsageKwh: number;
  peakMonthNameEn: string;
  peakMonthNameAf: string;
  lowestMonthUsageKwh: number;
  lowestMonthNameEn: string;
  lowestMonthNameAf: string;
  avgUsageVarPercent: number;
  avgMomCostVarPercent: number;
  activeMonthsCount: number;
}

export interface YearlyYearSummaryRow {
  year: number;
  totalCost: number;
  totalConsumptionKwh: number;
  avgMonthlyCost: number;
  avgRatePerKwh: number;
  costVariancePercent: number | null; // null for first year ('-')
  monthlyCosts: number[]; // 12 months
  monthlyKwh: number[]; // 12 months
}

export interface YoYReportSummary {
  years: YearlyYearSummaryRow[];
  totalHistoricalCost: number;
  totalHistoricalKwh: number;
  currentYear: number;
  currentYearCost: number;
  currentYearKwh: number;
  averageAnnualCost: number;
  averageHistoricalRate: number;
  monthlyTotalsAcrossYears: number[]; // 12 months sum if needed
}

export type YearDatasetMap = Record<number, MonthlyMeterEntry[]>;

export const MONTHS_META = [
  { index: 0, en: 'January', af: 'Januarie', short: 'Jan', period: 'Jan 01 - Jan 31' },
  { index: 1, en: 'February', af: 'Februarie', short: 'Feb', period: 'Feb 01 - Feb 28' },
  { index: 2, en: 'March', af: 'Maart', short: 'Mar', period: 'Mar 01 - Mar 31' },
  { index: 3, en: 'April', af: 'April', short: 'Apr', period: 'Apr 01 - Apr 30' },
  { index: 4, en: 'May', af: 'Mei', short: 'May', period: 'May 01 - May 31' },
  { index: 5, en: 'June', af: 'Junie', short: 'Jun', period: 'Jun 01 - Jun 30' },
  { index: 6, en: 'July', af: 'Julie', short: 'Jul', period: 'Jul 01 - Jul 31' },
  { index: 7, en: 'August', af: 'Augustus', short: 'Aug', period: 'Aug 01 - Aug 31' },
  { index: 8, en: 'September', af: 'September', short: 'Sep', period: 'Sep 01 - Sep 30' },
  { index: 9, en: 'October', af: 'Oktober', short: 'Oct', period: 'Oct 01 - Oct 31' },
  { index: 10, en: 'November', af: 'November', short: 'Nov', period: 'Nov 01 - Nov 30' },
  { index: 11, en: 'December', af: 'Desember', short: 'Dec', period: 'Dec 01 - Dec 31' },
];

export const DEFAULT_TARIFF_PARAMETERS: TariffParameters = {
  baseTariff: 3.522,
  fixedNetworkFee: 0.0,
  vatRate: 15.0,
  tieredSurcharge: 0.0,
  tierThresholdKwh: 0,
  vatInclusive: true,
  currencySymbol: 'R',
};

export function createEmptyYearEntries(): MonthlyMeterEntry[] {
  return MONTHS_META.map((m) => ({
    monthIndex: m.index,
    monthEn: m.en,
    monthAf: m.af,
    billingPeriod: m.period,
    readingDate: '',
    previousReading: null,
    currentReading: null,
    manualConsumption: null,
    costOverride: null,
    invoiceRef: '',
    notes: '',
  }));
}

/**
 * Creates the exact dataset shown in the user's 3 reference screenshots:
 * - Years 2023, 2024, 2025: 0 kWh / R0,00
 * - Year 2026: January readingDate = '2026-11-01', previousReading = 110, currentReading = 220 -> 110 kWh -> R387,42
 */
export function createScreenshotSeedDataset(): YearDatasetMap {
  const y2023 = createEmptyYearEntries();
  const y2024 = createEmptyYearEntries();
  const y2025 = createEmptyYearEntries();
  const y2026 = createEmptyYearEntries();

  y2026[0] = {
    ...y2026[0],
    readingDate: '2026-11-01',
    previousReading: 110,
    currentReading: 220,
    manualConsumption: null,
    costOverride: null,
    invoiceRef: 'INV-2026-01',
    notes: 'Initial baseline meter reading',
  };

  return {
    2023: y2023,
    2024: y2024,
    2025: y2025,
    2026: y2026,
  };
}

/**
 * Creates a rich, realistic multi-year dataset (2023 - 2026) while keeping 2026 Jan at 110 kWh
 * so users can explore full multi-year charts and monthly trends with one click.
 */
export function createRichMultiYearDataset(): YearDatasetMap {
  const buildYear = (
    year: number,
    startMeter: number,
    monthlyUsages: (number | null)[]
  ): MonthlyMeterEntry[] => {
    let runningReading = startMeter;
    return MONTHS_META.map((m, idx) => {
      const usage = monthlyUsages[idx];
      if (usage === null || usage === undefined) {
        return {
          monthIndex: m.index,
          monthEn: m.en,
          monthAf: m.af,
          billingPeriod: m.period,
          readingDate: '',
          previousReading: null,
          currentReading: null,
          manualConsumption: null,
          costOverride: null,
          invoiceRef: '',
          notes: '',
        };
      }
      const prev = runningReading;
      const curr = prev + usage;
      runningReading = curr;
      const monthNum = String(idx + 1).padStart(2, '0');
      return {
        monthIndex: m.index,
        monthEn: m.en,
        monthAf: m.af,
        billingPeriod: m.period,
        readingDate: `${year}-${monthNum}-28`,
        previousReading: prev,
        currentReading: curr,
        manualConsumption: null,
        costOverride: null,
        invoiceRef: `INV-${year}-${monthNum}`,
        notes: idx === 5 || idx === 6 ? 'Winter heating peak' : idx === 0 ? 'Summer baseline' : '',
      };
    });
  };

  const y2023 = buildYear(2023, 10400, [310, 295, 320, 340, 390, 445, 460, 425, 360, 330, 315, 325]);
  const y2024 = buildYear(2024, 14715, [305, 290, 315, 335, 380, 430, 450, 410, 345, 320, 305, 310]);
  const y2025 = buildYear(2025, 18910, [285, 270, 295, 310, 355, 405, 420, 390, 330, 300, 290, 295]);
  const y2026 = buildYear(2026, 110, [110, 128, 135, 142, 168, 195, 210, 188, 154, 138, 125, null]);
  // Preserve exact screenshot date for 2026 Jan
  y2026[0].readingDate = '2026-11-01';

  return {
    2023: y2023,
    2024: y2024,
    2025: y2025,
    2026: y2026,
  };
}

/**
 * Calculates the consumption in kWh for a single monthly entry.
 * Priority:
 * 1. If manualConsumption is explicitly set (>= 0), use it.
 * 2. If both currentReading and previousReading are provided and currentReading >= previousReading, use (currentReading - previousReading).
 * 3. Otherwise 0.
 */
export function calculateEntryConsumptionKwh(entry: MonthlyMeterEntry): {
  consumptionKwh: number;
  isActive: boolean;
} {
  if (entry.manualConsumption !== null && entry.manualConsumption >= 0) {
    return {
      consumptionKwh: Number(entry.manualConsumption.toFixed(3)),
      isActive: entry.manualConsumption > 0,
    };
  }
  if (
    entry.currentReading !== null &&
    entry.previousReading !== null &&
    !Number.isNaN(entry.currentReading) &&
    !Number.isNaN(entry.previousReading)
  ) {
    const diff = Math.max(0, entry.currentReading - entry.previousReading);
    return {
      consumptionKwh: Number(diff.toFixed(3)),
      isActive: diff > 0 || entry.currentReading > 0,
    };
  }
  return { consumptionKwh: 0, isActive: false };
}

/**
 * Calculates the cost breakdown for a given kWh consumption and tariff parameters.
 */
export function calculateMonthCostBreakdown(
  consumptionKwh: number,
  isActive: boolean,
  tariff: TariffParameters,
  costOverride: number | null = null
): {
  energyCostExclVat: number;
  vatAmount: number;
  fixedFeeAmount: number;
  surchargeAmount: number;
  totalCost: number;
  effectiveRate: number;
} {
  if (costOverride !== null && !Number.isNaN(costOverride) && costOverride >= 0) {
    const totalCost = Number(costOverride.toFixed(2));
    const vatDivisor = 1 + tariff.vatRate / 100;
    const energyCostExclVat = Number((totalCost / vatDivisor).toFixed(2));
    const vatAmount = Number((totalCost - energyCostExclVat).toFixed(2));
    const effectiveRate = consumptionKwh > 0 ? Number((totalCost / consumptionKwh).toFixed(3)) : 0;
    return {
      energyCostExclVat,
      vatAmount,
      fixedFeeAmount: 0,
      surchargeAmount: 0,
      totalCost,
      effectiveRate,
    };
  }

  if (consumptionKwh <= 0 && !isActive) {
    return {
      energyCostExclVat: 0,
      vatAmount: 0,
      fixedFeeAmount: 0,
      surchargeAmount: 0,
      totalCost: 0,
      effectiveRate: 0,
    };
  }

  const surchargeEligibleKwh =
    tariff.tierThresholdKwh > 0
      ? Math.max(0, consumptionKwh - tariff.tierThresholdKwh)
      : consumptionKwh;

  const rawBase = consumptionKwh * tariff.baseTariff;
  const rawSurcharge = surchargeEligibleKwh * tariff.tieredSurcharge;
  const rawFixed = consumptionKwh > 0 ? tariff.fixedNetworkFee : 0;

  let totalCost = 0;
  let energyCostExclVat = 0;
  let vatAmount = 0;

  if (tariff.vatInclusive) {
    const gross = rawBase + rawSurcharge + rawFixed;
    totalCost = Number(gross.toFixed(2));
    const vatDivisor = 1 + tariff.vatRate / 100;
    energyCostExclVat = Number((totalCost / vatDivisor).toFixed(2));
    vatAmount = Number((totalCost - energyCostExclVat).toFixed(2));
  } else {
    const net = rawBase + rawSurcharge + rawFixed;
    energyCostExclVat = Number(net.toFixed(2));
    vatAmount = Number((net * (tariff.vatRate / 100)).toFixed(2));
    totalCost = Number((energyCostExclVat + vatAmount).toFixed(2));
  }

  const effectiveRate =
    consumptionKwh > 0 ? Number((totalCost / consumptionKwh).toFixed(3)) : 0;

  return {
    energyCostExclVat,
    vatAmount,
    fixedFeeAmount: Number(rawFixed.toFixed(2)),
    surchargeAmount: Number(rawSurcharge.toFixed(2)),
    totalCost,
    effectiveRate,
  };
}

/**
 * Computes the complete 12-month report for a given year's entries and tariff parameters.
 * Replicates the exact spreadsheet logic in Screenshot 1.
 */
export function computeMonthlyReport(
  entries: MonthlyMeterEntry[],
  tariff: TariffParameters
): MonthlyReportSummary {
  const rows: ComputedMonthRow[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const { consumptionKwh, isActive } = calculateEntryConsumptionKwh(entry);
    const costInfo = calculateMonthCostBreakdown(
      consumptionKwh,
      isActive,
      tariff,
      entry.costOverride
    );

    let usageVarPercent: number | null = null;
    let momCostVarPercent: number | null = null;

    if (i > 0) {
      const prevRow = rows[i - 1];
      if (prevRow.consumptionKwh > 0) {
        usageVarPercent = Number(
          (((consumptionKwh - prevRow.consumptionKwh) / prevRow.consumptionKwh) * 100).toFixed(1)
        );
      } else if (consumptionKwh > 0) {
        usageVarPercent = 100.0;
      } else {
        usageVarPercent = 0.0;
      }

      if (prevRow.totalCost > 0 && costInfo.totalCost > 0) {
        momCostVarPercent = Number(
          (((costInfo.totalCost - prevRow.totalCost) / prevRow.totalCost) * 100).toFixed(1)
        );
      } else {
        // Matches Screenshot 1 where Feb has R0,00 and MoM Cost Var shows 0,0%
        momCostVarPercent = 0.0;
      }
    }

    rows.push({
      monthIndex: entry.monthIndex,
      monthEn: entry.monthEn,
      monthAf: entry.monthAf,
      billingPeriod: entry.billingPeriod,
      readingDate: entry.readingDate,
      previousReading: entry.previousReading,
      currentReading: entry.currentReading,
      consumptionKwh,
      isActive: consumptionKwh > 0,
      energyCostExclVat: costInfo.energyCostExclVat,
      vatAmount: costInfo.vatAmount,
      fixedFeeAmount: costInfo.fixedFeeAmount,
      surchargeAmount: costInfo.surchargeAmount,
      totalCost: costInfo.totalCost,
      effectiveRate: costInfo.effectiveRate,
      usageVarPercent,
      momCostVarPercent,
      invoiceRef: entry.invoiceRef,
      notes: entry.notes,
    });
  }

  const activeRows = rows.filter((r) => r.consumptionKwh > 0 || r.totalCost > 0);
  const activeCount = activeRows.length;

  const totalConsumptionKwh = Number(
    rows.reduce((sum, r) => sum + r.consumptionKwh, 0).toFixed(2)
  );
  const totalEnergyCost = Number(
    rows.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)
  );
  const totalExclVat = Number(
    rows.reduce((sum, r) => sum + r.energyCostExclVat, 0).toFixed(2)
  );
  const totalVatAmount = Number(
    rows.reduce((sum, r) => sum + r.vatAmount, 0).toFixed(2)
  );

  const avgMonthlyUsageKwh =
    activeCount > 0 ? Number((totalConsumptionKwh / activeCount).toFixed(2)) : 0;
  const avgMonthlyCost =
    activeCount > 0 ? Number((totalEnergyCost / activeCount).toFixed(2)) : 0;
  const avgRatePerKwh =
    totalConsumptionKwh > 0
      ? Number((totalEnergyCost / totalConsumptionKwh).toFixed(3))
      : 0;

  let peakRow = activeRows[0] ?? null;
  let lowestRow = activeRows[0] ?? null;

  for (const r of activeRows) {
    if (!peakRow || r.consumptionKwh > peakRow.consumptionKwh) {
      peakRow = r;
    }
    if (!lowestRow || r.consumptionKwh < lowestRow.consumptionKwh) {
      lowestRow = r;
    }
  }

  const usageVars = rows
    .slice(1)
    .map((r) => r.usageVarPercent ?? 0);
  const momVars = rows
    .slice(1)
    .map((r) => r.momCostVarPercent ?? 0);

  const avgUsageVarPercent =
    usageVars.length > 0
      ? Number((usageVars.reduce((a, b) => a + b, 0) / usageVars.length).toFixed(1))
      : 0;
  const avgMomCostVarPercent =
    momVars.length > 0
      ? Number((momVars.reduce((a, b) => a + b, 0) / momVars.length).toFixed(1))
      : 0;

  return {
    rows,
    totalConsumptionKwh,
    totalEnergyCost,
    totalExclVat,
    totalVatAmount,
    avgMonthlyUsageKwh,
    avgMonthlyCost,
    avgRatePerKwh,
    peakMonthUsageKwh: peakRow ? peakRow.consumptionKwh : 0,
    peakMonthNameEn: peakRow ? peakRow.monthEn : '-',
    peakMonthNameAf: peakRow ? peakRow.monthAf : '-',
    lowestMonthUsageKwh: lowestRow ? lowestRow.consumptionKwh : 0,
    lowestMonthNameEn: lowestRow ? lowestRow.monthEn : '-',
    lowestMonthNameAf: lowestRow ? lowestRow.monthAf : '-',
    avgUsageVarPercent,
    avgMomCostVarPercent,
    activeMonthsCount: activeCount,
  };
}

/**
 * Computes the Year-to-Year (Jaar-na-Jaar) Overview across all years in the dataset.
 * Matches Screenshot 2 exactly.
 */
export function computeYoYReport(
  dataset: YearDatasetMap,
  tariff: TariffParameters,
  selectedCurrentYear?: number
): YoYReportSummary {
  const sortedYears = Object.keys(dataset)
    .map(Number)
    .sort((a, b) => a - b);

  const years: YearlyYearSummaryRow[] = [];

  for (let i = 0; i < sortedYears.length; i++) {
    const yr = sortedYears[i];
    const monthlyReport = computeMonthlyReport(dataset[yr], tariff);

    let costVariancePercent: number | null = null;
    if (i > 0) {
      const prevYear = years[i - 1];
      if (prevYear.totalCost > 0) {
        costVariancePercent = Number(
          (((monthlyReport.totalEnergyCost - prevYear.totalCost) / prevYear.totalCost) * 100).toFixed(1)
        );
      } else {
        costVariancePercent = 0.0;
      }
    }

    years.push({
      year: yr,
      totalCost: monthlyReport.totalEnergyCost,
      totalConsumptionKwh: monthlyReport.totalConsumptionKwh,
      avgMonthlyCost: monthlyReport.avgMonthlyCost,
      avgRatePerKwh: monthlyReport.avgRatePerKwh,
      costVariancePercent,
      monthlyCosts: monthlyReport.rows.map((r) => r.totalCost),
      monthlyKwh: monthlyReport.rows.map((r) => r.consumptionKwh),
    });
  }

  const totalHistoricalCost = Number(
    years.reduce((sum, y) => sum + y.totalCost, 0).toFixed(2)
  );
  const totalHistoricalKwh = Number(
    years.reduce((sum, y) => sum + y.totalConsumptionKwh, 0).toFixed(2)
  );

  const currentYear =
    selectedCurrentYear && dataset[selectedCurrentYear]
      ? selectedCurrentYear
      : sortedYears[sortedYears.length - 1] ?? 2026;

  const currentYearRow = years.find((y) => y.year === currentYear);
  const currentYearCost = currentYearRow ? currentYearRow.totalCost : 0;
  const currentYearKwh = currentYearRow ? currentYearRow.totalConsumptionKwh : 0;

  // In Screenshot 2: Average Annual Cost = Total Historical Cost / 4 years (387.42 / 4 = 96.86)
  const averageAnnualCost =
    years.length > 0 ? Number((totalHistoricalCost / years.length).toFixed(2)) : 0;

  const averageHistoricalRate =
    totalHistoricalKwh > 0
      ? Number((totalHistoricalCost / totalHistoricalKwh).toFixed(3))
      : 0;

  const monthlyTotalsAcrossYears = Array.from({ length: 12 }, (_, mIdx) =>
    Number(years.reduce((sum, y) => sum + (y.monthlyCosts[mIdx] ?? 0), 0).toFixed(2))
  );

  return {
    years,
    totalHistoricalCost,
    totalHistoricalKwh,
    currentYear,
    currentYearCost,
    currentYearKwh,
    averageAnnualCost,
    averageHistoricalRate,
    monthlyTotalsAcrossYears,
  };
}

/**
 * Formats numbers using South African / European comma decimal separator as in the screenshots:
 * e.g. formatCurrency(387.42, 'R', 2) -> "R387,42"
 *      formatRate(3.522, 'R') -> "R3,522"
 */
export function formatCurrency(
  amount: number,
  symbol = 'R',
  decimals = 2,
  useComma = true
): string {
  const fixed = Math.abs(amount).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sep = useComma ? ',' : '.';
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formattedInt}${decPart ? sep + decPart : ''}`;
}

export function formatKwh(
  kwh: number,
  decimals = 0,
  useComma = true
): string {
  const hasFraction = Math.abs(kwh % 1) > 0.001;
  const effectiveDecimals = decimals > 0 ? decimals : hasFraction ? 1 : 0;
  const fixed = kwh.toFixed(effectiveDecimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sep = useComma ? ',' : '.';
  return `${formattedInt}${decPart ? sep + decPart : ''} kWh`;
}

export function formatPercent(
  pct: number | null,
  useComma = true
): string {
  if (pct === null || Number.isNaN(pct)) return '-';
  const fixed = pct.toFixed(1);
  return `${useComma ? fixed.replace('.', ',') : fixed}%`;
}

/**
 * Generates a comprehensive CSV string containing Monthly Meter Readings, Monthly Report,
 * Tariff Parameters, and Year-to-Year Overview.
 */
export function generateElectricityCsv(
  selectedYear: number,
  dataset: YearDatasetMap,
  tariff: TariffParameters
): string {
  const yearEntries = dataset[selectedYear] ?? createEmptyYearEntries();
  const monthly = computeMonthlyReport(yearEntries, tariff);
  const yoy = computeYoYReport(dataset, tariff, selectedYear);

  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [];

  lines.push(`MONTHLY ELECTRICITY CONSUMPTION & COST REPORT (${selectedYear})`);
  lines.push(
    [
      'Total Consumption (kWh)',
      'Total Energy Cost (R)',
      'Avg Monthly Usage (kWh)',
      'Avg Monthly Cost (R)',
      'Avg Rate (R/kWh)',
      'Peak Month Usage (kWh)',
      'Lowest Month Usage (kWh)',
    ].join(',')
  );
  lines.push(
    [
      monthly.totalConsumptionKwh,
      monthly.totalEnergyCost.toFixed(2),
      monthly.avgMonthlyUsageKwh,
      monthly.avgMonthlyCost.toFixed(2),
      monthly.avgRatePerKwh.toFixed(3),
      monthly.peakMonthUsageKwh,
      monthly.lowestMonthUsageKwh,
    ].join(',')
  );
  lines.push('');

  lines.push('TARIFF PARAMETERS');
  lines.push('Parameter,Value');
  lines.push(`Base Tariff (R/kWh),${tariff.baseTariff.toFixed(3)}`);
  lines.push(`Fixed Network Fee (R),${tariff.fixedNetworkFee.toFixed(2)}`);
  lines.push(`VAT Rate (%),${tariff.vatRate.toFixed(1)}%`);
  lines.push(`Tiered Surcharge (R/kWh),${tariff.tieredSurcharge.toFixed(3)}`);
  lines.push('');

  lines.push('MONTHLY BREAKDOWN & METER READINGS');
  lines.push(
    [
      'Month',
      'Billing Period',
      'Reading Date',
      'Previous Reading (kWh)',
      'Current Reading (kWh)',
      'Consumption (kWh)',
      'Total Cost (R)',
      'Rate (R/kWh)',
      'Usage Var (%)',
      'MoM Cost Var (%)',
      'Invoice Reference',
      'Notes',
    ].join(',')
  );

  for (const r of monthly.rows) {
    lines.push(
      [
        r.monthEn,
        r.billingPeriod,
        r.readingDate,
        r.previousReading ?? '',
        r.currentReading ?? '',
        r.consumptionKwh,
        r.totalCost.toFixed(2),
        r.effectiveRate.toFixed(3),
        r.usageVarPercent === null ? '-' : `${r.usageVarPercent.toFixed(1)}%`,
        r.momCostVarPercent === null ? '-' : `${r.momCostVarPercent.toFixed(1)}%`,
        escapeCsv(r.invoiceRef),
        escapeCsv(r.notes),
      ].join(',')
    );
  }

  lines.push(
    [
      'Total',
      '-',
      '-',
      '-',
      '-',
      monthly.totalConsumptionKwh,
      monthly.totalEnergyCost.toFixed(2),
      monthly.avgRatePerKwh.toFixed(3),
      '-',
      '-',
      '-',
      '-',
    ].join(',')
  );
  lines.push(
    [
      'Average',
      '-',
      '-',
      '-',
      '-',
      monthly.avgMonthlyUsageKwh,
      monthly.avgMonthlyCost.toFixed(2),
      monthly.avgRatePerKwh.toFixed(3),
      `${monthly.avgUsageVarPercent.toFixed(1)}%`,
      `${monthly.avgMomCostVarPercent.toFixed(1)}%`,
      '-',
      '-',
    ].join(',')
  );
  lines.push('');

  lines.push('YEAR-TO-YEAR ELECTRICITY CONSUMPTION & COST OVERVIEW');
  lines.push('Year,Total Cost (R),Consumption (kWh),Avg Monthly Cost (R),Avg Rate (R/kWh),Cost Variance (%)');
  for (const y of yoy.years) {
    lines.push(
      [
        y.year,
        y.totalCost.toFixed(2),
        y.totalConsumptionKwh.toFixed(1),
        y.avgMonthlyCost.toFixed(2),
        y.avgRatePerKwh.toFixed(3),
        y.costVariancePercent === null ? '-' : `${y.costVariancePercent.toFixed(1)}%`,
      ].join(',')
    );
  }
  lines.push(
    [
      'Total',
      yoy.totalHistoricalCost.toFixed(2),
      yoy.totalHistoricalKwh.toFixed(1),
      yoy.averageAnnualCost.toFixed(2),
      yoy.averageHistoricalRate.toFixed(3),
      '-',
    ].join(',')
  );

  return lines.join('\n');
}

/**
 * Generates a valid, self-contained %PDF-1.4 document with vector tables, headers, KPIs,
 * Monthly Consumption & Cost Report, Meter Readings, and Year-to-Year Summary.
 * Zero external runtime dependencies required.
 */
export function generateElectricityPdfString(
  selectedYear: number,
  dataset: YearDatasetMap,
  tariff: TariffParameters
): string {
  const yearEntries = dataset[selectedYear] ?? createEmptyYearEntries();
  const monthly = computeMonthlyReport(yearEntries, tariff);
  const yoy = computeYoYReport(dataset, tariff, selectedYear);

  const sanitizePdfText = (str: string): string =>
    str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, ' ');

  const ops: string[] = [];

  // Header Banner (#21527A matching screenshot blue header)
  ops.push('0.129 0.322 0.478 rg');
  ops.push('36 770 540 38 re f');

  // Header Title
  ops.push('1 1 1 rg');
  ops.push('BT /F2 13 Tf 48 784 Td (MONTHLY ELECTRICITY CONSUMPTION & COST REPORT - ' + selectedYear + ') Tj ET');

  // KPI Summary Strip background
  ops.push('0.859 0.914 0.969 rg');
  ops.push('36 728 540 34 re f');

  ops.push('0.08 0.20 0.32 rg');
  const kpiSummaryText =
    `Total: ${monthly.totalConsumptionKwh} kWh   |   Cost: ${formatCurrency(monthly.totalEnergyCost, tariff.currencySymbol)}   |   ` +
    `Avg/Mo: ${monthly.avgMonthlyUsageKwh} kWh (${formatCurrency(monthly.avgMonthlyCost, tariff.currencySymbol)})   |   ` +
    `Avg Rate: ${formatCurrency(monthly.avgRatePerKwh, tariff.currencySymbol, 3)}/kWh`;
  ops.push(`BT /F2 9 Tf 44 742 Td (${sanitizePdfText(kpiSummaryText)}) Tj ET`);

  const tariffLine =
    `Tariff Parameters: Base ${formatCurrency(tariff.baseTariff, tariff.currencySymbol, 3)}/kWh  |  ` +
    `Fixed Fee: ${formatCurrency(tariff.fixedNetworkFee, tariff.currencySymbol, 2)}  |  ` +
    `VAT: ${tariff.vatRate.toFixed(1)}%  |  Surcharge: ${formatCurrency(tariff.tieredSurcharge, tariff.currencySymbol, 3)}/kWh`;
  ops.push(`BT /F1 8 Tf 44 732 Td (${sanitizePdfText(tariffLine)}) Tj ET`);

  // Monthly Table Header
  let y = 702;
  ops.push('0.129 0.322 0.478 rg');
  ops.push(`36 ${y} 540 18 re f`);
  ops.push('1 1 1 rg');
  ops.push(`BT /F2 8 Tf 42 ${y + 5} Td (Month) Tj ET`);
  ops.push(`BT /F2 8 Tf 110 ${y + 5} Td (Reading Date) Tj ET`);
  ops.push(`BT /F2 8 Tf 185 ${y + 5} Td (Prev -> Curr) Tj ET`);
  ops.push(`BT /F2 8 Tf 270 ${y + 5} Td (Usage kWh) Tj ET`);
  ops.push(`BT /F2 8 Tf 345 ${y + 5} Td (Total Cost) Tj ET`);
  ops.push(`BT /F2 8 Tf 420 ${y + 5} Td (Rate/kWh) Tj ET`);
  ops.push(`BT /F2 8 Tf 485 ${y + 5} Td (Usage Var) Tj ET`);

  y -= 15;
  for (let i = 0; i < monthly.rows.length; i++) {
    const r = monthly.rows[i];
    if (i % 2 === 1) {
      ops.push('0.95 0.97 0.99 rg');
      ops.push(`36 ${y} 540 15 re f`);
    }
    ops.push('0.1 0.15 0.2 rg');
    const readingsText =
      r.previousReading !== null && r.currentReading !== null
        ? `${r.previousReading} -> ${r.currentReading}`
        : '-';
    ops.push(`BT /F1 8 Tf 42 ${y + 4} Td (${sanitizePdfText(r.monthEn)}) Tj ET`);
    ops.push(`BT /F1 8 Tf 110 ${y + 4} Td (${sanitizePdfText(r.readingDate || r.billingPeriod)}) Tj ET`);
    ops.push(`BT /F1 8 Tf 185 ${y + 4} Td (${sanitizePdfText(readingsText)}) Tj ET`);
    ops.push(`BT /F1 8 Tf 270 ${y + 4} Td (${sanitizePdfText(formatKwh(r.consumptionKwh))}) Tj ET`);
    ops.push(`BT /F1 8 Tf 345 ${y + 4} Td (${sanitizePdfText(formatCurrency(r.totalCost, tariff.currencySymbol))}) Tj ET`);
    ops.push(`BT /F1 8 Tf 420 ${y + 4} Td (${sanitizePdfText(formatCurrency(r.effectiveRate, tariff.currencySymbol, 3))}) Tj ET`);
    ops.push(`BT /F1 8 Tf 485 ${y + 4} Td (${sanitizePdfText(formatPercent(r.usageVarPercent))}) Tj ET`);
    y -= 15;
  }

  // Total & Average rows
  ops.push('0.859 0.914 0.969 rg');
  ops.push(`36 ${y - 15} 540 30 re f`);
  ops.push('0.08 0.20 0.32 rg');
  ops.push(`BT /F2 8 Tf 42 ${y + 4} Td (Total) Tj ET`);
  ops.push(`BT /F2 8 Tf 270 ${y + 4} Td (${sanitizePdfText(formatKwh(monthly.totalConsumptionKwh))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 345 ${y + 4} Td (${sanitizePdfText(formatCurrency(monthly.totalEnergyCost, tariff.currencySymbol))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 420 ${y + 4} Td (${sanitizePdfText(formatCurrency(monthly.avgRatePerKwh, tariff.currencySymbol, 3))}) Tj ET`);

  y -= 15;
  ops.push(`BT /F2 8 Tf 42 ${y + 4} Td (Average) Tj ET`);
  ops.push(`BT /F2 8 Tf 270 ${y + 4} Td (${sanitizePdfText(formatKwh(monthly.avgMonthlyUsageKwh))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 345 ${y + 4} Td (${sanitizePdfText(formatCurrency(monthly.avgMonthlyCost, tariff.currencySymbol))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 420 ${y + 4} Td (${sanitizePdfText(formatCurrency(monthly.avgRatePerKwh, tariff.currencySymbol, 3))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 485 ${y + 4} Td (${sanitizePdfText(formatPercent(monthly.avgUsageVarPercent))}) Tj ET`);

  // Year-to-Year Section Header
  y -= 34;
  ops.push('0.129 0.322 0.478 rg');
  ops.push(`36 ${y} 540 22 re f`);
  ops.push('1 1 1 rg');
  ops.push(`BT /F2 10 Tf 44 ${y + 6} Td (YEAR-TO-YEAR ELECTRICITY CONSUMPTION & COST OVERVIEW) Tj ET`);

  y -= 18;
  ops.push('0.18 0.38 0.55 rg');
  ops.push(`36 ${y} 540 16 re f`);
  ops.push('1 1 1 rg');
  ops.push(`BT /F2 8 Tf 44 ${y + 4} Td (Year) Tj ET`);
  ops.push(`BT /F2 8 Tf 130 ${y + 4} Td (Total Cost) Tj ET`);
  ops.push(`BT /F2 8 Tf 230 ${y + 4} Td (Consumption) Tj ET`);
  ops.push(`BT /F2 8 Tf 340 ${y + 4} Td (Avg Monthly Cost) Tj ET`);
  ops.push(`BT /F2 8 Tf 445 ${y + 4} Td (Avg Rate/kWh) Tj ET`);
  ops.push(`BT /F2 8 Tf 520 ${y + 4} Td (YoY Var) Tj ET`);

  y -= 15;
  for (const yrRow of yoy.years) {
    ops.push('0.1 0.15 0.2 rg');
    ops.push(`BT /F1 8 Tf 44 ${y + 4} Td (${yrRow.year}) Tj ET`);
    ops.push(`BT /F1 8 Tf 130 ${y + 4} Td (${sanitizePdfText(formatCurrency(yrRow.totalCost, tariff.currencySymbol))}) Tj ET`);
    ops.push(`BT /F1 8 Tf 230 ${y + 4} Td (${sanitizePdfText(formatKwh(yrRow.totalConsumptionKwh, 1))}) Tj ET`);
    ops.push(`BT /F1 8 Tf 340 ${y + 4} Td (${sanitizePdfText(formatCurrency(yrRow.avgMonthlyCost, tariff.currencySymbol))}) Tj ET`);
    ops.push(`BT /F1 8 Tf 445 ${y + 4} Td (${sanitizePdfText(formatCurrency(yrRow.avgRatePerKwh, tariff.currencySymbol, 3))}) Tj ET`);
    ops.push(`BT /F1 8 Tf 520 ${y + 4} Td (${sanitizePdfText(formatPercent(yrRow.costVariancePercent))}) Tj ET`);
    y -= 15;
  }

  ops.push('0.859 0.914 0.969 rg');
  ops.push(`36 ${y} 540 16 re f`);
  ops.push('0.08 0.20 0.32 rg');
  ops.push(`BT /F2 8 Tf 44 ${y + 4} Td (Total / Avg) Tj ET`);
  ops.push(`BT /F2 8 Tf 130 ${y + 4} Td (${sanitizePdfText(formatCurrency(yoy.totalHistoricalCost, tariff.currencySymbol))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 230 ${y + 4} Td (${sanitizePdfText(formatKwh(yoy.totalHistoricalKwh, 1))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 340 ${y + 4} Td (${sanitizePdfText(formatCurrency(yoy.averageAnnualCost, tariff.currencySymbol))}) Tj ET`);
  ops.push(`BT /F2 8 Tf 445 ${y + 4} Td (${sanitizePdfText(formatCurrency(yoy.averageHistoricalRate, tariff.currencySymbol, 3))}) Tj ET`);

  const contentStream = ops.join('\n');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj'
  );
  objects.push(
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`
  );
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}
