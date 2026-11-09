import React, { useState } from 'react';
import {
  Language,
  MONTHS_META,
  TariffParameters,
  YearDatasetMap,
  YoYReportSummary,
  formatCurrency,
  formatKwh,
  formatPercent,
} from '../utils/electricityCalculations';

interface YoYReportViewProps {
  lang: Language;
  selectedYear: number;
  dataset: YearDatasetMap;
  yoySummary: YoYReportSummary;
  tariff: TariffParameters;
  onUpdateYearMonthKwh: (year: number, monthIndex: number, kwh: number | null) => void;
  onSelectYear: (year: number) => void;
}

export const YoYReportView: React.FC<YoYReportViewProps> = ({
  lang,
  selectedYear,
  yoySummary,
  tariff,
  onUpdateYearMonthKwh,
  onSelectYear,
}) => {
  const [matrixMode, setMatrixMode] = useState<'cost' | 'kwh'>('cost');

  const handleMatrixCellChange = (year: number, monthIdx: number, raw: string) => {
    const val = raw.trim() === '' ? null : parseFloat(raw);
    if (val === null || Number.isNaN(val) || val < 0) {
      onUpdateYearMonthKwh(year, monthIdx, null);
      return;
    }
    if (matrixMode === 'kwh') {
      onUpdateYearMonthKwh(year, monthIdx, val);
    } else {
      // Convert entered Cost (R) to Consumption (kWh) using baseTariff
      const effectiveTariff = tariff.baseTariff > 0 ? tariff.baseTariff : 3.522;
      const derivedKwh = Number((val / effectiveTariff).toFixed(2));
      onUpdateYearMonthKwh(year, monthIdx, derivedKwh);
    }
  };

  // Combo Chart geometry matching Screenshot 2 ("Jaarlikse Elektrisiteitskoste (R) & Verbruik (kWh) Tendens (2023 - 2026)")
  const maxYearCost = Math.max(450, ...yoySummary.years.map((y) => y.totalCost));
  const leftAxisMax = Math.ceil(maxYearCost / 50) * 50;

  const maxYearKwh = Math.max(120, ...yoySummary.years.map((y) => y.totalConsumptionKwh));
  const rightAxisMax = Math.ceil(maxYearKwh / 20) * 20;

  const svgW = 860;
  const svgH = 340;
  const padL = 82;
  const padR = 82;
  const padT = 36;
  const padB = 64;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const yearCount = Math.max(1, yoySummary.years.length);
  const colWidth = plotW / yearCount;
  const barWidth = Math.min(72, colWidth * 0.42);

  const chartNodes = yoySummary.years.map((yRow, idx) => {
    const centerX = padL + idx * colWidth + colWidth / 2;
    const barH = (yRow.totalCost / Math.max(1, leftAxisMax)) * plotH;
    const barY = padT + plotH - barH;
    const lineY =
      padT + plotH - (yRow.totalConsumptionKwh / Math.max(1, rightAxisMax)) * plotH;
    return {
      centerX,
      barY,
      barH,
      lineY,
      yRow,
    };
  });

  const kwhTrendLinePoints = chartNodes
    .map((n) => `${n.centerX.toFixed(1)},${n.lineY.toFixed(1)}`)
    .join(' ');

  return (
    <div className="space-y-8">
      {/* Main YoY Overview Card (Double-Bezel) */}
      <div className="bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem]">
        <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* Header Banner Matching Screenshot 2 */}
          <div className="bg-[#21527A] text-white px-6 py-4 text-center">
            <h2 className="text-base sm:text-lg font-bold tracking-wider">
              {lang === 'af'
                ? 'JAAR-NA-JAAR ELEKTRISITEITSVERBRUIK EN KOSTE-OORSIG'
                : 'JAAR-NA-JAAR ELEKTRISITEITSVERBRUIK EN KOSTE-OORSIG · YEAR-TO-YEAR OVERVIEW'}
            </h2>
          </div>

          {/* 6-Column KPI Strip Matching Screenshot 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-slate-200 dark:border-slate-800">
            <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
              <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                {lang === 'af' ? 'Totale Historiese Koste' : 'Totale Historiese Koste / Total Cost'}
              </div>
              <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                {formatCurrency(yoySummary.totalHistoricalCost, tariff.currencySymbol)}
              </div>
            </div>

            <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
              <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                {lang === 'af' ? 'Totale Kragverbruik' : 'Totale Kragverbruik / Total Usage'}
              </div>
              <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                {formatKwh(yoySummary.totalHistoricalKwh)}
              </div>
            </div>

            <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
              <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                {lang === 'af'
                  ? `Huidige Jaar Koste (${yoySummary.currentYear})`
                  : `Current Year Cost (${yoySummary.currentYear})`}
              </div>
              <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                {formatCurrency(yoySummary.currentYearCost, tariff.currencySymbol)}
              </div>
            </div>

            <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
              <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                {lang === 'af'
                  ? `Huidige Jaar Verbruik (${yoySummary.currentYear})`
                  : `Current Year Usage (${yoySummary.currentYear})`}
              </div>
              <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                {formatKwh(yoySummary.currentYearKwh)}
              </div>
            </div>

            <div className="border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-800">
              <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                {lang === 'af' ? 'Gemiddelde Jaarkoste' : 'Gemiddelde Jaarkoste / Avg Annual'}
              </div>
              <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                {formatCurrency(yoySummary.averageAnnualCost, tariff.currencySymbol)}
              </div>
            </div>

            <div>
              <div className="bg-[#D9E8F6] dark:bg-sky-950/70 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-sky-200 text-center truncate">
                {lang === 'af'
                  ? `Gemiddelde Tarief (${tariff.currencySymbol}/kWh)`
                  : `Avg Tariff (${tariff.currencySymbol}/kWh)`}
              </div>
              <div className="py-3 px-2 text-center text-base sm:text-lg font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                {formatCurrency(yoySummary.averageHistoricalRate, tariff.currencySymbol, 3)}
              </div>
            </div>
          </div>

          {/* Table 1: Annual Summary Table (2023 - 2026 + Totaal) Matching Screenshot 2 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#21527A] text-white text-xs font-bold">
                  <th className="py-2.5 px-4 border-r border-white/15 text-center">
                    {lang === 'af' ? 'Jaar' : 'Jaar / Year'}
                  </th>
                  <th className="py-2.5 px-4 border-r border-white/15 text-right">
                    {lang === 'af' ? `Totale Koste (${tariff.currencySymbol})` : `Totale Koste (${tariff.currencySymbol})`}
                  </th>
                  <th className="py-2.5 px-4 border-r border-white/15 text-right">
                    {lang === 'af' ? 'Verbruik (kWh)' : 'Verbruik / Usage (kWh)'}
                  </th>
                  <th className="py-2.5 px-4 border-r border-white/15 text-right">
                    {lang === 'af' ? `Gem. Maandkoste (${tariff.currencySymbol})` : `Gem. Maandkoste (${tariff.currencySymbol})`}
                  </th>
                  <th className="py-2.5 px-4 border-r border-white/15 text-right">
                    {lang === 'af' ? `Gem. Tarief (${tariff.currencySymbol}/kWh)` : `Gem. Tarief (${tariff.currencySymbol}/kWh)`}
                  </th>
                  <th className="py-2.5 px-4 text-right">
                    {lang === 'af' ? 'Koste Wisseling' : 'Koste Wisseling / YoY Var'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                {yoySummary.years.map((yrRow, idx) => {
                  const isCurrentSelected = yrRow.year === selectedYear;
                  const isEven = idx % 2 === 1;
                  return (
                    <tr
                      key={yrRow.year}
                      onClick={() => onSelectYear(yrRow.year)}
                      className={`cursor-pointer ${
                        isCurrentSelected
                          ? 'font-bold bg-sky-50/90 dark:bg-sky-950/40'
                          : isEven
                          ? 'bg-[#F2F6FA] dark:bg-slate-900/60'
                          : 'bg-white dark:bg-[#0D131F]'
                      } hover:bg-sky-100/60 dark:hover:bg-sky-900/30 transition-colors`}
                    >
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums text-slate-900 dark:text-white border-r border-slate-200/70 dark:border-slate-800">
                        {yrRow.year}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-white border-r border-slate-200/70 dark:border-slate-800">
                        {formatCurrency(yrRow.totalCost, tariff.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-white border-r border-slate-200/70 dark:border-slate-800">
                        {formatKwh(yrRow.totalConsumptionKwh, 1)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 border-r border-slate-200/70 dark:border-slate-800">
                        {formatCurrency(yrRow.avgMonthlyCost, tariff.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 border-r border-slate-200/70 dark:border-slate-800">
                        {formatCurrency(yrRow.avgRatePerKwh, tariff.currencySymbol, 3)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatPercent(yrRow.costVariancePercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#D9E8F6] dark:bg-sky-950/80 text-[#0F2C4C] dark:text-sky-100 font-bold text-xs sm:text-sm border-t-2 border-[#21527A] border-b-4 border-double border-[#21527A]">
                  <td className="py-2.5 px-4 text-center border-r border-sky-200/60 dark:border-sky-900">
                    {lang === 'af' ? 'Totaal' : 'Totaal / Total'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                    {formatCurrency(yoySummary.totalHistoricalCost, tariff.currencySymbol)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                    {formatKwh(yoySummary.totalHistoricalKwh, 1)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                    {formatCurrency(yoySummary.averageAnnualCost, tariff.currencySymbol)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                    {formatCurrency(yoySummary.averageHistoricalRate, tariff.currencySymbol, 3)}
                  </td>
                  <td className="py-2.5 px-4 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Table 2: Monthly Cross-Year Comparison Matrix (Editable) Matching Screenshot 2 */}
      <div className="bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem]">
        <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="bg-[#21527A] text-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {lang === 'af'
                  ? 'MAANDELIKSE KOSTE- EN VERBRUIKSMATRIKS OOR JARE (2023 – 2026)'
                  : 'MONTHLY CROSS-YEAR COMPARISON MATRIX (2023 – 2026) · EDITABLE CELLS'}
              </h3>
              <p className="text-xs text-sky-100/80">
                {lang === 'af'
                  ? 'Wysig enige maand- en jaarsel direk om historiese reekse by te werk.'
                  : 'Edit any cell directly to populate or adjust historical monthly figures across years.'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setMatrixMode('cost')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  matrixMode === 'cost'
                    ? 'bg-white text-[#21527A]'
                    : 'text-sky-100 hover:bg-white/10'
                }`}
              >
                {lang === 'af' ? `Wys Koste (${tariff.currencySymbol})` : `Cost (${tariff.currencySymbol})`}
              </button>
              <button
                type="button"
                onClick={() => setMatrixMode('kwh')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  matrixMode === 'kwh'
                    ? 'bg-white text-[#21527A]'
                    : 'text-sky-100 hover:bg-white/10'
                }`}
              >
                {lang === 'af' ? 'Wys Verbruik (kWh)' : 'Consumption (kWh)'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2B5B84] text-white text-xs font-bold">
                  <th className="py-2.5 px-4 border-r border-white/15">
                    {lang === 'af' ? 'Maand' : 'Maand / Month'}
                  </th>
                  {yoySummary.years.map((yr) => (
                    <th
                      key={yr.year}
                      className="py-2.5 px-4 border-r border-white/15 text-right"
                    >
                      {matrixMode === 'cost'
                        ? `${yr.year} Koste (${tariff.currencySymbol})`
                        : `${yr.year} Verbruik (kWh)`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                {MONTHS_META.map((m, mIdx) => {
                  const isEven = mIdx % 2 === 1;
                  return (
                    <tr
                      key={m.index}
                      className={`${
                        isEven
                          ? 'bg-[#F2F6FA] dark:bg-slate-900/60'
                          : 'bg-white dark:bg-[#0D131F]'
                      } hover:bg-sky-50/70 dark:hover:bg-sky-950/30 transition-colors`}
                    >
                      <td className="py-2 px-4 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200/70 dark:border-slate-800">
                        {lang === 'af' ? m.af : `${m.af} (${m.en})`}
                      </td>
                      {yoySummary.years.map((yr) => {
                        const cellCost = yr.monthlyCosts[mIdx] ?? 0;
                        const cellKwh = yr.monthlyKwh[mIdx] ?? 0;
                        const displayVal =
                          matrixMode === 'cost'
                            ? cellCost > 0
                              ? cellCost.toFixed(2)
                              : ''
                            : cellKwh > 0
                            ? String(cellKwh)
                            : '';

                        return (
                          <td
                            key={yr.year}
                            className="py-1.5 px-3 text-right font-mono tabular-nums border-r border-slate-200/70 dark:border-slate-800"
                          >
                            <div className="inline-flex items-center justify-end gap-0.5">
                              {matrixMode === 'cost' && (
                                <span className="text-xs font-semibold text-slate-500">
                                  {tariff.currencySymbol}
                                </span>
                              )}
                              <input
                                type="number"
                                step={matrixMode === 'cost' ? '0.01' : '0.1'}
                                aria-label={`${yr.year} ${m.en} ${matrixMode}`}
                                placeholder="0,00"
                                value={displayVal}
                                onChange={(e) =>
                                  handleMatrixCellChange(yr.year, mIdx, e.target.value)
                                }
                                className="w-20 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded px-1 py-0.5 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white border border-transparent focus:border-sky-500 focus:outline-none"
                              />
                              {matrixMode === 'kwh' && (
                                <span className="text-xs text-slate-400">kWh</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#D9E8F6] dark:bg-sky-950/80 text-[#0F2C4C] dark:text-sky-100 font-bold text-xs sm:text-sm border-t-2 border-[#21527A] border-b-4 border-double border-[#21527A]">
                  <td className="py-2.5 px-4 border-r border-sky-200/60 dark:border-sky-900">
                    {lang === 'af' ? 'Totaal' : 'Totaal / Total'}
                  </td>
                  {yoySummary.years.map((yr) => (
                    <td
                      key={yr.year}
                      className="py-2.5 px-4 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900"
                    >
                      {matrixMode === 'cost'
                        ? formatCurrency(yr.totalCost, tariff.currencySymbol)
                        : formatKwh(yr.totalConsumptionKwh, 1)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Combo Chart Matching Screenshot 2 ("Jaarlikse Elektrisiteitskoste (R) & Verbruik (kWh) Tendens (2023 - 2026)") */}
      <div className="bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem]">
        <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="text-center mb-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
              {lang === 'af'
                ? `Jaarlikse Elektrisiteitskoste (${tariff.currencySymbol}) & Verbruik (kWh) Tendens (${yoySummary.years[0]?.year ?? 2023} - ${yoySummary.years[yoySummary.years.length - 1]?.year ?? 2026})`
                : `Annual Electricity Cost (${tariff.currencySymbol}) & Consumption (kWh) Trend (${yoySummary.years[0]?.year ?? 2023} - ${yoySummary.years[yoySummary.years.length - 1]?.year ?? 2026})`}
            </h3>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full min-w-[620px] h-80 select-none"
              role="img"
              aria-label="Annual Electricity Cost and Consumption Combo Chart"
            >
              {/* Horizontal Grid Lines, Left Axis (R), Right Axis (kWh) */}
              {[0, 1, 2, 3, 4, 5, 6].map((step) => {
                const ratio = step / 6;
                const y = padT + plotH - ratio * plotH;
                const costVal = ratio * leftAxisMax;
                const kwhVal = ratio * rightAxisMax;
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
                      {formatCurrency(costVal, `${tariff.currencySymbol} `, 2)}
                    </text>
                    <text
                      x={svgW - padR + 10}
                      y={y + 4}
                      textAnchor="start"
                      className="fill-slate-600 dark:fill-slate-400 text-[11px] font-mono"
                    >
                      {formatKwh(kwhVal, 1)}
                    </text>
                  </g>
                );
              })}

              {/* Left Y-Axis Title */}
              <text
                x={18}
                y={padT + plotH / 2}
                transform={`rotate(-90, 18, ${padT + plotH / 2})`}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-400 text-[11px] font-semibold"
              >
                {lang === 'af' ? `Totale Koste (${tariff.currencySymbol})` : `Total Cost (${tariff.currencySymbol})`}
              </text>

              {/* Bars for Totale Koste (R) */}
              {chartNodes.map((n) => (
                <g key={n.yRow.year}>
                  <rect
                    x={n.centerX - barWidth / 2}
                    y={n.barY}
                    width={barWidth}
                    height={Math.max(2, n.barH)}
                    fill="#21527A"
                    rx="3"
                  />
                  {/* Year X-Axis Label */}
                  <text
                    x={n.centerX}
                    y={padT + plotH + 20}
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-300 text-xs font-mono font-semibold"
                  >
                    {n.yRow.year}
                  </text>
                </g>
              ))}

              {/* Orange Line for Totale Verbruik (kWh) */}
              {kwhTrendLinePoints && (
                <polyline
                  fill="none"
                  stroke="#EA7117"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={kwhTrendLinePoints}
                />
              )}

              {chartNodes.map((n) => (
                <circle
                  key={n.yRow.year}
                  cx={n.centerX}
                  cy={n.lineY}
                  r="4.5"
                  className="fill-[#EA7117] stroke-white dark:stroke-slate-900 stroke-2"
                />
              ))}

              {/* X-Axis Title */}
              <text
                x={padL + plotW / 2}
                y={padT + plotH + 38}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-400 text-[11px] font-semibold"
              >
                {lang === 'af' ? 'Jaar' : 'Year'}
              </text>

              {/* Legend at Bottom Matching Screenshot 2 */}
              <g transform={`translate(${padL + plotW / 2 - 130}, ${svgH - 12})`}>
                <rect x="0" y="-8" width="20" height="8" fill="#21527A" rx="1" />
                <text
                  x="26"
                  y="-1"
                  className="fill-slate-700 dark:fill-slate-300 text-[11px] font-medium"
                >
                  {lang === 'af' ? `Totale Koste (${tariff.currencySymbol})` : `Total Cost (${tariff.currencySymbol})`}
                </text>

                <line x1="135" y1="-4" x2="157" y2="-4" stroke="#EA7117" strokeWidth="2.5" />
                <text
                  x="163"
                  y="-1"
                  className="fill-slate-700 dark:fill-slate-300 text-[11px] font-medium"
                >
                  {lang === 'af' ? 'Totale Verbruik (kWh)' : 'Total Consumption (kWh)'}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
