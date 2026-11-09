import React, { useState, useEffect } from 'react';
import {
  Language,
  MonthlyMeterEntry,
  MonthlyReportSummary,
  TariffParameters,
  MONTHS_META,
  formatCurrency,
  formatKwh,
} from '../utils/electricityCalculations';

interface MeterOverviewProps {
  lang: Language;
  selectedYear: number;
  entries: MonthlyMeterEntry[];
  monthlySummary: MonthlyReportSummary;
  tariff: TariffParameters;
  onUpdateEntry: (monthIndex: number, patch: Partial<MonthlyMeterEntry>) => void;
  onNavigateTab: (tab: 'readings' | 'monthly' | 'yoy') => void;
}

export const RealTimeMeterOverview: React.FC<MeterOverviewProps> = ({
  lang,
  selectedYear,
  entries,
  monthlySummary,
  tariff,
  onUpdateEntry,
  onNavigateTab,
}) => {
  // Derive opening and latest meter readings purely from entered meter readings
  const recordedEntries = entries.filter(
    (e) => e.previousReading !== null || e.currentReading !== null || (e.manualConsumption ?? 0) > 0
  );

  const openingReading =
    recordedEntries.find((e) => e.previousReading !== null)?.previousReading ?? 0;

  const latestClosingReading = entries.reduce((max, e) => {
    if (e.currentReading !== null && e.currentReading > max) return e.currentReading;
    if (e.previousReading !== null && e.previousReading > max) return e.previousReading;
    return max;
  }, openingReading);

  const latestMonthWithReading = [...entries]
    .reverse()
    .find((e) => e.currentReading !== null || (e.manualConsumption ?? 0) > 0);

  // Quick Meter Reading Form State
  const [quickMonthIdx, setQuickMonthIdx] = useState<number>(() => {
    const firstEmpty = entries.findIndex(
      (e) => e.currentReading === null && e.manualConsumption === null
    );
    return firstEmpty >= 0 ? firstEmpty : 0;
  });

  const selectedQuickEntry = entries[quickMonthIdx] ?? entries[0];
  const [quickPrev, setQuickPrev] = useState<string>(
    selectedQuickEntry?.previousReading !== null
      ? String(selectedQuickEntry.previousReading)
      : String(latestClosingReading)
  );
  const [quickCurr, setQuickCurr] = useState<string>(
    selectedQuickEntry?.currentReading !== null
      ? String(selectedQuickEntry.currentReading)
      : ''
  );
  const [quickDate, setQuickDate] = useState<string>(
    selectedQuickEntry?.readingDate ||
      `${selectedYear}-${String(quickMonthIdx + 1).padStart(2, '0')}-01`
  );
  const [quickRef, setQuickRef] = useState<string>(
    selectedQuickEntry?.invoiceRef || ''
  );
  const [quickSavedFeedback, setQuickSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    const entry = entries[quickMonthIdx];
    if (!entry) return;
    const prevMonthEntry = quickMonthIdx > 0 ? entries[quickMonthIdx - 1] : null;
    const defaultPrev =
      entry.previousReading !== null
        ? entry.previousReading
        : prevMonthEntry?.currentReading ?? latestClosingReading;
    setQuickPrev(defaultPrev > 0 ? String(defaultPrev) : '');
    setQuickCurr(
      entry.currentReading !== null ? String(entry.currentReading) : ''
    );
    setQuickDate(
      entry.readingDate ||
        `${selectedYear}-${String(quickMonthIdx + 1).padStart(2, '0')}-01`
    );
    setQuickRef(entry.invoiceRef || '');
  }, [quickMonthIdx, selectedYear, entries, latestClosingReading]);

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prevNum = parseFloat(quickPrev);
    const currNum = parseFloat(quickCurr);
    if (Number.isNaN(prevNum) || Number.isNaN(currNum) || currNum < prevNum) {
      setQuickSavedFeedback(
        lang === 'af'
          ? 'Fout: Huidige lesing moet groter of gelyk aan vorige lesing wees.'
          : 'Error: Current reading must be greater than or equal to previous reading.'
      );
      return;
    }
    onUpdateEntry(quickMonthIdx, {
      readingDate: quickDate,
      previousReading: prevNum,
      currentReading: currNum,
      manualConsumption: null,
      invoiceRef: quickRef,
    });
    const monthLabel =
      lang === 'af' ? MONTHS_META[quickMonthIdx].af : MONTHS_META[quickMonthIdx].en;
    setQuickSavedFeedback(
      lang === 'af'
        ? `Gestoor: ${monthLabel} (${currNum - prevNum} kWh verbruik).`
        : `Saved: ${monthLabel} (${currNum - prevNum} kWh consumption).`
    );
  };

  const paddedMeterRegister = String(Math.round(latestClosingReading)).padStart(6, '0');
  const previewUsage = Math.max(
    0,
    (parseFloat(quickCurr) || 0) - (parseFloat(quickPrev) || 0)
  );
  const previewCost = previewUsage * tariff.baseTariff;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left 8 Columns: Electricity Meter Register & Reading Statistics */}
      <div className="lg:col-span-8 bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem] flex flex-col">
        <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex-1 flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
            <div>
              <p className="text-xs font-semibold text-[#1F4E79] dark:text-sky-400 tracking-wide">
                {lang === 'af'
                  ? `ELEKTRISITEITSMETER OORSIG · ${selectedYear}`
                  : `ELECTRICITY METER OVERVIEW · ${selectedYear}`}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {lang === 'af'
                  ? 'Geregistreerde Meterlesings & Koste-opsomming'
                  : 'Recorded Meter Readings & Cost Summary'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {latestMonthWithReading
                  ? lang === 'af'
                    ? `Laaste aangetekende lesing: ${latestMonthWithReading.monthAf} (${latestMonthWithReading.readingDate || latestMonthWithReading.billingPeriod})`
                    : `Latest recorded reading: ${latestMonthWithReading.monthEn} (${latestMonthWithReading.readingDate || latestMonthWithReading.billingPeriod})`
                  : lang === 'af'
                  ? 'Geen meterlesings aangeteken vir hierdie jaar nie'
                  : 'No meter readings recorded for this year yet'}
              </p>
            </div>

            {/* Static Recorded Meter Register Display */}
            <div className="bg-[#0F2537] text-white px-4 py-3 rounded-2xl border border-slate-800 flex flex-col items-end shrink-0">
              <span className="text-[11px] text-sky-200/80 tracking-wider font-mono">
                {lang === 'af' ? 'HUIDIGE METERSTAND (kWh)' : 'LATEST METER READING (kWh)'}
              </span>
              <div className="flex items-baseline gap-1 mt-1 font-mono tabular-nums">
                {paddedMeterRegister.split('').map((digit, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center justify-center w-6 h-8 rounded bg-slate-900 border border-slate-700 text-base font-bold text-sky-300"
                  >
                    {digit}
                  </span>
                ))}
                <span className="text-xs text-sky-200 ml-1.5">kWh</span>
              </div>
            </div>
          </div>

          {/* 4 Key Meter Reading Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'af' ? 'Beginlesing (Jaar)' : 'Opening Meter Reading'}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {formatKwh(openingReading)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'af' ? 'Vorige lesing basis' : 'Initial baseline'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'af' ? 'Laaste Lesing (Jaar)' : 'Latest Closing Reading'}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {formatKwh(latestClosingReading)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'af'
                  ? `${monthlySummary.activeMonthsCount} van 12 maande`
                  : `${monthlySummary.activeMonthsCount} of 12 months logged`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'af' ? 'Berekende Verbruik' : 'Total Meter Usage'}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-400 mt-1">
                {formatKwh(monthlySummary.totalConsumptionKwh)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                {lang === 'af' ? 'Gem.' : 'Avg'} {formatKwh(monthlySummary.avgMonthlyUsageKwh)}/m
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'af' ? `Totale Koste (${selectedYear})` : `Total Cost (${selectedYear})`}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-400 mt-1">
                {formatCurrency(monthlySummary.totalEnergyCost, tariff.currencySymbol)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                @ {formatCurrency(monthlySummary.avgRatePerKwh || tariff.baseTariff, tariff.currencySymbol, 3)}/kWh
              </div>
            </div>
          </div>

          {/* Recorded Meter Progression Bar Across 12 Months */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'af'
                  ? `Maandelikse Meterlesing Status (${selectedYear})`
                  : `Monthly Meter Reading Status (${selectedYear})`}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {monthlySummary.activeMonthsCount} / 12 {lang === 'af' ? 'Maande Ingesleutel' : 'Months Entered'}
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {monthlySummary.rows.map((row, idx) => {
                const hasData = row.consumptionKwh > 0;
                return (
                  <button
                    key={row.monthIndex}
                    type="button"
                    onClick={() => setQuickMonthIdx(idx)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      quickMonthIdx === idx
                        ? ' ring-2 ring-[#1F4E79] border-[#1F4E79]'
                        : ''
                    } ${
                      hasData
                        ? 'bg-[#D9E8F6] dark:bg-sky-950/80 border-sky-300 dark:border-sky-800 text-[#0F2C4C] dark:text-sky-200'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{MONTHS_META[idx].short}</div>
                    <div className="text-[10px] font-mono tabular-nums mt-0.5 truncate">
                      {hasData ? `${row.consumptionKwh}` : '-'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right 4 Columns: Log Monthly Meter Reading Form */}
      <div className="lg:col-span-4 bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem] flex flex-col">
        <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex-1 flex flex-col justify-between space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#1F4E79] dark:text-sky-400 tracking-wide">
              {lang === 'af' ? 'METERLESING INVOER' : 'METER READING ENTRY'}
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {lang === 'af' ? `Voeg ${selectedYear} Lesing By` : `Enter ${selectedYear} Meter Reading`}
            </h3>

            <form onSubmit={handleQuickLogSubmit} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="quick-month-select"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {lang === 'af' ? 'Maand' : 'Month'}
                  </label>
                  <select
                    id="quick-month-select"
                    value={quickMonthIdx}
                    onChange={(e) => {
                      setQuickMonthIdx(Number(e.target.value));
                      setQuickSavedFeedback(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {MONTHS_META.map((m) => (
                      <option key={m.index} value={m.index}>
                        {lang === 'af' ? m.af : m.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="quick-reading-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {lang === 'af' ? 'Leesdatum' : 'Reading Date'}
                  </label>
                  <input
                    id="quick-reading-date"
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="quick-prev-kwh"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {lang === 'af' ? 'Vorige Lesing (kWh)' : 'Previous (kWh)'}
                  </label>
                  <input
                    id="quick-prev-kwh"
                    type="number"
                    step="0.1"
                    placeholder="110"
                    value={quickPrev}
                    onChange={(e) => setQuickPrev(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="quick-curr-kwh"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {lang === 'af' ? 'Huidige Lesing (kWh)' : 'Current (kWh)'}
                  </label>
                  <input
                    id="quick-curr-kwh"
                    type="number"
                    step="0.1"
                    placeholder="220"
                    value={quickCurr}
                    onChange={(e) => setQuickCurr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#D9E8F6]/60 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-600 dark:text-sky-300">
                    {lang === 'af' ? 'Berekende Verbruik' : 'Calculated Consumption'}
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-[#1B4975] dark:text-white">
                    {formatKwh(previewUsage, 1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-600 dark:text-sky-300">
                    {lang === 'af' ? 'Totale Koste' : 'Calculated Cost'}
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-[#1B4975] dark:text-sky-300">
                    {formatCurrency(previewCost, tariff.currencySymbol)}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="group w-full flex items-center justify-between rounded-full bg-[#1F4E79] hover:bg-[#183E61] active:scale-[0.98] text-white pl-5 pr-2 py-2 text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <span>{lang === 'af' ? 'Stoor Meterlesing' : 'Save Meter Reading'}</span>
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              {quickSavedFeedback && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {quickSavedFeedback}
                </p>
              )}
            </form>
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('readings')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors text-center truncate"
            >
              {lang === 'af' ? 'Meterlesings' : 'Readings Sheet'}
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('monthly')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors text-center truncate"
            >
              {lang === 'af' ? 'Maandverslag' : 'Monthly Sheet'}
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('yoy')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors text-center truncate"
            >
              {lang === 'af' ? 'Jaar-na-Jaar' : 'YoY Sheet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
