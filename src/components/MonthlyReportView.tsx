import React, { useState } from 'react';
import {
  Language,
  MonthlyMeterEntry,
  MonthlyReportSummary,
  TariffParameters,
  formatCurrency,
  formatKwh,
  formatPercent,
} from '../utils/electricityCalculations';

interface MonthlyReportViewProps {
  lang: Language;
  selectedYear: number;
  entries: MonthlyMeterEntry[];
  monthlySummary: MonthlyReportSummary;
  tariff: TariffParameters;
  onUpdateEntry: (monthIndex: number, patch: Partial<MonthlyMeterEntry>) => void;
  onUpdateTariff: (patch: Partial<TariffParameters>) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  lang,
  selectedYear,
  entries,
  monthlySummary,
  tariff,
  onUpdateEntry,
  onUpdateTariff,
}) => {
  const [chartMetric, setChartMetric] = useState<'kwh' | 'cost' | 'both'>('kwh');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const handleConsumptionInlineEdit = (monthIdx: number, raw: string) => {
    const val = raw.trim() === '' ? null : parseFloat(raw);
    const parsed = val !== null && !Number.isNaN(val) && val >= 0 ? val : null;
    const entry = entries[monthIdx];
    if (parsed !== null && entry.previousReading !== null) {
      onUpdateEntry(monthIdx, {
        currentReading: Number((entry.previousReading + parsed).toFixed(2)),
        manualConsumption: null,
      });
    } else {
      onUpdateEntry(monthIdx, {
        manualConsumption: parsed,
        ...(parsed === null ? { previousReading: null, currentReading: null } : {}),
      });
    }
  };

  // Chart geometry matching Screenshot 1 ("Monthly Electricity Consumption Trend (kWh)")
  const maxKwhVal = Math.max(120, ...monthlySummary.rows.map((r) => r.consumptionKwh));
  const yAxisMaxKwh = Math.ceil(maxKwhVal / 20) * 20;
  const maxCostVal = Math.max(450, ...monthlySummary.rows.map((r) => r.totalCost));
  const yAxisMaxCost = Math.ceil(maxCostVal / 50) * 50;

  const svgW = 860;
  const svgH = 310;
  const padL = 74;
  const padR = 64;
  const padT = 36;
  const padB = 48;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const points = monthlySummary.rows.map((r, i) => {
    const x = padL + (i / 11) * plotW;
    const yKwh = padT + plotH - (r.consumptionKwh / Math.max(1, yAxisMaxKwh)) * plotH;
    const yCost = padT + plotH - (r.totalCost / Math.max(1, yAxisMaxCost)) * plotH;
    return { x, yKwh, yCost, row: r };
  });

  const kwhPolyline = points.map((p) => `${p.x.toFixed(1)},${p.yKwh.toFixed(1)}`).join(' ');
  const costPolyline = points.map((p) => `${p.x.toFixed(1)},${p.yCost.toFixed(1)}`).join(' ');

  return (
    <div className="space-y-8">
      {/* Main Report + Tariff Parameters Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 9 Columns: Monthly Consumption & Cost Report Card (Double-Bezel) */}
        <div className="xl:col-span-9 bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem]">
          <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {/* Report Title Header Matching Screenshot 1 */}
            <div className="bg-[#21527A] text-white px-6 py-3.5 text-center">
              <h2 className="text-base sm:text-lg font-bold tracking-wider">
                {lang === 'af'
                  ? `MAANDELIKSE ELEKTRISITEITSVERBRUIK & KOSTEVERSLAG (${selectedYear})`
                  : `MONTHLY ELECTRICITY CONSUMPTION & COST REPORT (${selectedYear})`}
              </h2>
            </div>

            {/* 7-Column KPI Strip Matching Screenshot 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 border-b border-slate-200 dark:border-slate-800">
              <div className="col-span-2 sm:col-span-1 border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
                <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                  {lang === 'af' ? 'Totale Verbruik' : 'Total Consumption'}
                </div>
                <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                  {formatKwh(monthlySummary.totalConsumptionKwh)}
                </div>
              </div>

              <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
                <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                  {lang === 'af' ? 'Totale Energiekoste' : 'Total Energy Cost'}
                </div>
                <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                  {formatCurrency(monthlySummary.totalEnergyCost, tariff.currencySymbol)}
                </div>
              </div>

              <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
                <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                  {lang === 'af' ? 'Gem. Maandverbruik' : 'Avg Monthly Usage'}
                </div>
                <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                  {formatKwh(monthlySummary.avgMonthlyUsageKwh)}
                </div>
              </div>

              <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
                <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                  {lang === 'af' ? 'Gem. Maandkoste' : 'Avg Monthly Cost'}
                </div>
                <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                  {formatCurrency(monthlySummary.avgMonthlyCost, tariff.currencySymbol)}
                </div>
              </div>

              <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
                <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                  {lang === 'af' ? `Gem. Tarief (${tariff.currencySymbol}/kWh)` : `Avg Rate (${tariff.currencySymbol}/kWh)`}
                </div>
                <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                  {formatCurrency(monthlySummary.avgRatePerKwh, tariff.currencySymbol, 3)}
                </div>
              </div>

              <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
                <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                  {lang === 'af' ? 'Piek Maandverbruik' : 'Peak Month Usage'}
                </div>
                <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                  {formatKwh(monthlySummary.peakMonthUsageKwh)}
                </div>
              </div>

              <div>
                <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                  {lang === 'af' ? 'Laagste Maandverbruik' : 'Lowest Month Usage'}
                </div>
                <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                  {formatKwh(monthlySummary.lowestMonthUsageKwh)}
                </div>
              </div>
            </div>

            {/* 12-Month Report Table Matching Screenshot 1 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#21527A] text-white text-xs font-bold">
                    <th className="py-2.5 px-4 border-r border-white/15">
                      {lang === 'af' ? 'Maand' : 'Month'}
                    </th>
                    <th className="py-2.5 px-3 border-r border-white/15 text-center">
                      {lang === 'af' ? 'Faktuurperiode' : 'Billing Period'}
                    </th>
                    <th className="py-2.5 px-3 border-r border-white/15 text-right">
                      {lang === 'af' ? 'Verbruik (kWh)' : 'Consumption (kWh)'}
                    </th>
                    <th className="py-2.5 px-3 border-r border-white/15 text-right">
                      {lang === 'af' ? `Totale Koste (${tariff.currencySymbol})` : `Total Cost (${tariff.currencySymbol})`}
                    </th>
                    <th className="py-2.5 px-3 border-r border-white/15 text-right">
                      {lang === 'af' ? `Tarief (${tariff.currencySymbol}/kWh)` : `Rate (${tariff.currencySymbol}/kWh)`}
                    </th>
                    <th className="py-2.5 px-3 border-r border-white/15 text-right">
                      {lang === 'af' ? 'Verbruik Var' : 'Usage Var'}
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      {lang === 'af' ? 'MmM Koste Var' : 'MoM Cost Var'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                  {monthlySummary.rows.map((r, idx) => {
                    const isEven = idx % 2 === 1;
                    return (
                      <tr
                        key={r.monthIndex}
                        className={`${
                          isEven
                            ? 'bg-[#F2F6FA] dark:bg-slate-900/60'
                            : 'bg-white dark:bg-[#0D131F]'
                        } hover:bg-sky-50/70 dark:hover:bg-sky-950/30 transition-colors`}
                      >
                        <td className="py-2 px-4 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200/70 dark:border-slate-800">
                          {lang === 'af' ? r.monthAf : r.monthEn}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200/70 dark:border-slate-800 whitespace-nowrap">
                          {r.billingPeriod}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono tabular-nums border-r border-slate-200/70 dark:border-slate-800">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.1"
                              aria-label={`${r.monthEn} Consumption kWh`}
                              placeholder="-"
                              value={r.consumptionKwh > 0 ? r.consumptionKwh : ''}
                              onChange={(e) => handleConsumptionInlineEdit(idx, e.target.value)}
                              className="w-20 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded px-1.5 py-0.5 text-right font-mono tabular-nums text-slate-900 dark:text-white border border-transparent focus:border-sky-500 focus:outline-none"
                            />
                            {r.consumptionKwh > 0 && (
                              <span className="text-xs text-slate-500">kWh</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 border-r border-slate-200/70 dark:border-slate-800">
                          {formatCurrency(r.totalCost, tariff.currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200/70 dark:border-slate-800">
                          {formatCurrency(r.effectiveRate, tariff.currencySymbol, 3)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-200/70 dark:border-slate-800">
                          {formatPercent(r.usageVarPercent)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {formatPercent(r.momCostVarPercent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {/* Total Row */}
                  <tr className="bg-[#D9E8F6] dark:bg-sky-950/75 text-[#0F2C4C] dark:text-sky-100 font-bold text-xs sm:text-sm border-t-2 border-[#21527A]">
                    <td className="py-2.5 px-4 border-r border-sky-200/60 dark:border-sky-900">
                      {lang === 'af' ? 'Totaal' : 'Total'}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-sky-200/60 dark:border-sky-900">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                      {formatKwh(monthlySummary.totalConsumptionKwh)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                      {formatCurrency(monthlySummary.totalEnergyCost, tariff.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                      {formatCurrency(monthlySummary.avgRatePerKwh, tariff.currencySymbol, 3)}
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-sky-200/60 dark:border-sky-900">
                      -
                    </td>
                    <td className="py-2.5 px-4 text-right">-</td>
                  </tr>

                  {/* Average Row */}
                  <tr className="bg-[#E6F0FA] dark:bg-sky-950/50 text-[#0F2C4C] dark:text-sky-100 font-bold text-xs sm:text-sm border-t border-[#21527A]/40 border-b-4 border-double border-[#21527A]">
                    <td className="py-2.5 px-4 border-r border-sky-200/60 dark:border-sky-900">
                      {lang === 'af' ? 'Gemiddeld' : 'Average'}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-sky-200/60 dark:border-sky-900">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                      {formatKwh(monthlySummary.avgMonthlyUsageKwh)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                      {formatCurrency(monthlySummary.avgMonthlyCost, tariff.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                      {formatCurrency(monthlySummary.avgRatePerKwh, tariff.currencySymbol, 3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                      {formatPercent(monthlySummary.avgUsageVarPercent)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatPercent(monthlySummary.avgMomCostVarPercent)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right 3 Columns: Editable Tariefparameter / Waarde Table Matching Screenshot 1 (Double-Bezel) */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem]">
            <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="grid grid-cols-12 bg-[#21527A] text-white text-xs font-bold">
                <div className="col-span-7 py-3 px-4 border-r border-white/15">
                  {lang === 'af' ? 'Tariefparameter' : 'Tariefparameter / Tariff'}
                </div>
                <div className="col-span-5 py-3 px-3 text-right">
                  {lang === 'af' ? 'Waarde' : 'Waarde / Value'}
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                {/* Basistarief (R/kWh) */}
                <div className="grid grid-cols-12 items-center bg-white dark:bg-[#0D131F] px-4 py-3">
                  <label
                    htmlFor="tariff-base-input"
                    className="col-span-7 font-medium text-slate-800 dark:text-slate-200 pr-2"
                  >
                    <div>Basistarief ({tariff.currencySymbol}/kWh)</div>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(tariff.baseTariff, tariff.currencySymbol, 3)}
                    </div>
                  </label>
                  <div className="col-span-5 flex items-center justify-end gap-1">
                    <span className="font-mono font-bold text-slate-500">
                      {tariff.currencySymbol}
                    </span>
                    <input
                      id="tariff-base-input"
                      type="number"
                      step="0.001"
                      value={tariff.baseTariff}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!Number.isNaN(val) && val >= 0) {
                          onUpdateTariff({ baseTariff: val });
                        }
                      }}
                      className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Vaste Netwerkfooi (R) */}
                <div className="grid grid-cols-12 items-center bg-[#F2F6FA] dark:bg-slate-900/60 px-4 py-3">
                  <label
                    htmlFor="tariff-fixed-input"
                    className="col-span-7 font-medium text-slate-800 dark:text-slate-200 pr-2"
                  >
                    <div>Vaste Netwerkfooi ({tariff.currencySymbol})</div>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(tariff.fixedNetworkFee, tariff.currencySymbol, 2)}
                    </div>
                  </label>
                  <div className="col-span-5 flex items-center justify-end gap-1">
                    <span className="font-mono font-bold text-slate-500">
                      {tariff.currencySymbol}
                    </span>
                    <input
                      id="tariff-fixed-input"
                      type="number"
                      step="0.50"
                      value={tariff.fixedNetworkFee}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!Number.isNaN(val) && val >= 0) {
                          onUpdateTariff({ fixedNetworkFee: val });
                        }
                      }}
                      className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* BTW-koers (%) */}
                <div className="grid grid-cols-12 items-center bg-white dark:bg-[#0D131F] px-4 py-3">
                  <label
                    htmlFor="tariff-vat-input"
                    className="col-span-7 font-medium text-slate-800 dark:text-slate-200 pr-2"
                  >
                    <div>BTW-koers</div>
                    <div className="text-[11px] text-slate-400">
                      {tariff.vatRate.toFixed(1).replace('.', ',')}% VAT
                    </div>
                  </label>
                  <div className="col-span-5 flex items-center justify-end gap-1">
                    <input
                      id="tariff-vat-input"
                      type="number"
                      step="0.5"
                      value={tariff.vatRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!Number.isNaN(val) && val >= 0) {
                          onUpdateTariff({ vatRate: val });
                        }
                      }}
                      className="w-18 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                    />
                    <span className="font-mono font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* Traptarief Toeslag (R/kWh) */}
                <div className="grid grid-cols-12 items-center bg-[#F2F6FA] dark:bg-slate-900/60 px-4 py-3">
                  <label
                    htmlFor="tariff-surcharge-input"
                    className="col-span-7 font-medium text-slate-800 dark:text-slate-200 pr-2"
                  >
                    <div>Traptarief Toeslag ({tariff.currencySymbol}/kWh)</div>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(tariff.tieredSurcharge, tariff.currencySymbol, 3)}
                    </div>
                  </label>
                  <div className="col-span-5 flex items-center justify-end gap-1">
                    <span className="font-mono font-bold text-slate-500">
                      {tariff.currencySymbol}
                    </span>
                    <input
                      id="tariff-surcharge-input"
                      type="number"
                      step="0.01"
                      value={tariff.tieredSurcharge}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!Number.isNaN(val) && val >= 0) {
                          onUpdateTariff({ tieredSurcharge: val });
                        }
                      }}
                      className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* VAT Mode & Tax Breakdown Summary */}
              <div className="p-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'af' ? 'BTW-modus:' : 'VAT Mode:'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTariff({ vatInclusive: !tariff.vatInclusive })
                    }
                    className="px-2.5 py-1 rounded-lg font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-sky-500 transition-colors"
                  >
                    {tariff.vatInclusive
                      ? lang === 'af'
                        ? 'Ingesluit by Basistarief'
                        : 'Included in Base Tariff'
                      : lang === 'af'
                      ? 'Bygevoeg bo-op Tarief'
                      : 'Added on Top (+VAT)'}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 font-mono tabular-nums">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{lang === 'af' ? 'Subtotaal (Uitgesl. BTW):' : 'Net Energy (Excl. VAT):'}</span>
                    <span>{formatCurrency(monthlySummary.totalExclVat, tariff.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>
                      {lang === 'af'
                        ? `BTW Bedrag (${tariff.vatRate.toFixed(1)}%):`
                        : `VAT Component (${tariff.vatRate.toFixed(1)}%):`}
                    </span>
                    <span>{formatCurrency(monthlySummary.totalVatAmount, tariff.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span>{lang === 'af' ? 'Totale Koste:' : 'Total Cost (Incl. VAT):'}</span>
                    <span>{formatCurrency(monthlySummary.totalEnergyCost, tariff.currencySymbol)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Chart Card Matching Screenshot 1 ("Monthly Electricity Consumption Trend (kWh)") */}
      <div className="bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem]">
        <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                {lang === 'af'
                  ? `Maandelikse Elektrisiteitsverbruik Tendens (kWh) — ${selectedYear}`
                  : `Monthly Electricity Consumption Trend (kWh) — ${selectedYear}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'af'
                  ? 'Beweeg oor enige maandpunt vir gedetailleerde kWh en koste-ontleding.'
                  : 'Hover or click any month node to inspect consumption, effective tariff, and month-over-month variance.'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 self-start">
              <button
                type="button"
                onClick={() => setChartMetric('kwh')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  chartMetric === 'kwh'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {lang === 'af' ? 'Verbruik (kWh)' : 'Consumption (kWh)'}
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('cost')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  chartMetric === 'cost'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {lang === 'af' ? `Koste (${tariff.currencySymbol})` : `Cost (${tariff.currencySymbol})`}
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  chartMetric === 'both'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {lang === 'af' ? 'Albei (Dubbel-as)' : 'Dual Overlay'}
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full min-w-[640px] h-72 select-none"
              role="img"
              aria-label="Monthly Electricity Consumption Trend Chart"
            >
              {/* Horizontal Grid Lines & Y-Axis Labels (0 to yAxisMaxKwh in 6 steps matching Screenshot 1) */}
              {[0, 1, 2, 3, 4, 5, 6].map((step) => {
                const ratio = step / 6;
                const y = padT + plotH - ratio * plotH;
                const kwhVal = Math.round(ratio * yAxisMaxKwh);
                const costVal = Math.round(ratio * yAxisMaxCost);
                return (
                  <g key={step}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={svgW - padR}
                      y2={y}
                      stroke="#CBD5E1"
                      strokeWidth="1"
                      className="dark:stroke-slate-800"
                    />
                    <text
                      x={padL - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-600 dark:fill-slate-400 text-[11px] font-mono"
                    >
                      {chartMetric === 'cost'
                        ? `${tariff.currencySymbol}${costVal}`
                        : `${kwhVal} kWh`}
                    </text>
                    {chartMetric === 'both' && (
                      <text
                        x={svgW - padR + 10}
                        y={y + 4}
                        textAnchor="start"
                        className="fill-amber-600 dark:fill-amber-400 text-[11px] font-mono"
                      >
                        {tariff.currencySymbol}
                        {costVal}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Y-Axis Title */}
              <text
                x={18}
                y={padT + plotH / 2}
                transform={`rotate(-90, 18, ${padT + plotH / 2})`}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 text-[11px] font-semibold"
              >
                {chartMetric === 'cost' ? `Cost (${tariff.currencySymbol})` : 'kWh'}
              </text>

              {/* Consumption (kWh) Line (#2574A9 matching Screenshot 1 blue line) */}
              {(chartMetric === 'kwh' || chartMetric === 'both') && (
                <polyline
                  fill="none"
                  stroke="#2574A9"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={kwhPolyline}
                />
              )}

              {/* Cost (R) Line (#D97706 orange accent) */}
              {(chartMetric === 'cost' || chartMetric === 'both') && (
                <polyline
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="2.5"
                  strokeDasharray={chartMetric === 'both' ? '5 3' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={costPolyline}
                />
              )}

              {/* Month Labels & Interactive Data Points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredMonth === idx;
                const activeY = chartMetric === 'cost' ? pt.yCost : pt.yKwh;
                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredMonth(idx)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="cursor-pointer"
                  >
                    {/* X-Axis Month Label */}
                    <text
                      x={pt.x}
                      y={padT + plotH + 22}
                      textAnchor="middle"
                      className="fill-slate-700 dark:fill-slate-300 text-[11px] font-medium"
                    >
                      {lang === 'af' ? pt.row.monthAf : pt.row.monthEn}
                    </text>

                    {/* Invisible hover column */}
                    <rect
                      x={pt.x - plotW / 24}
                      y={padT}
                      width={plotW / 12}
                      height={plotH}
                      fill="transparent"
                    />

                    {(chartMetric === 'kwh' || chartMetric === 'both') && (
                      <circle
                        cx={pt.x}
                        cy={pt.yKwh}
                        r={isHovered ? 6 : 4}
                        className="fill-[#2574A9] stroke-white dark:stroke-slate-900 stroke-2 transition-all"
                      />
                    )}

                    {(chartMetric === 'cost' || chartMetric === 'both') && (
                      <circle
                        cx={pt.x}
                        cy={pt.yCost}
                        r={isHovered ? 6 : 4}
                        className="fill-amber-600 stroke-white dark:stroke-slate-900 stroke-2 transition-all"
                      />
                    )}

                    {isHovered && (
                      <g>
                        <rect
                          x={Math.min(Math.max(pt.x - 75, padL), svgW - padR - 150)}
                          y={Math.max(8, activeY - 48)}
                          width="150"
                          height="38"
                          rx="8"
                          className="fill-slate-900/95"
                        />
                        <text
                          x={Math.min(Math.max(pt.x, padL + 75), svgW - padR - 75)}
                          y={Math.max(8, activeY - 48) + 15}
                          textAnchor="middle"
                          className="fill-white text-[10px] font-bold"
                        >
                          {pt.row.monthEn}: {formatKwh(pt.row.consumptionKwh)}
                        </text>
                        <text
                          x={Math.min(Math.max(pt.x, padL + 75), svgW - padR - 75)}
                          y={Math.max(8, activeY - 48) + 29}
                          textAnchor="middle"
                          className="fill-sky-300 text-[10px] font-mono"
                        >
                          {formatCurrency(pt.row.totalCost, tariff.currencySymbol)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* X-Axis Title */}
              <text
                x={padL + plotW / 2}
                y={svgH - 6}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-400 text-[11px] font-semibold"
              >
                {lang === 'af' ? 'Maand' : 'Month'}
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
