import React, { useState } from 'react';
import {
  Language,
  MonthlyMeterEntry,
  MonthlyReportSummary,
  TariffParameters,
  formatCurrency,
  formatKwh,
} from '../utils/electricityCalculations';

interface MeterReadingsInputViewProps {
  lang: Language;
  selectedYear: number;
  entries: MonthlyMeterEntry[];
  monthlySummary: MonthlyReportSummary;
  tariff: TariffParameters;
  onUpdateEntry: (monthIndex: number, patch: Partial<MonthlyMeterEntry>) => void;
  onChainReadings: () => void;
  onClearYear: () => void;
}

export const MeterReadingsInputView: React.FC<MeterReadingsInputViewProps> = ({
  lang,
  selectedYear,
  entries,
  monthlySummary,
  tariff,
  onUpdateEntry,
  onChainReadings,
  onClearYear,
}) => {
  const [autoChainNextMonth, setAutoChainNextMonth] = useState(true);

  const handlePreviousChange = (monthIdx: number, raw: string) => {
    const val = raw.trim() === '' ? null : parseFloat(raw);
    onUpdateEntry(monthIdx, {
      previousReading: val !== null && !Number.isNaN(val) ? val : null,
      manualConsumption: null,
    });
  };

  const handleCurrentChange = (monthIdx: number, raw: string) => {
    const val = raw.trim() === '' ? null : parseFloat(raw);
    const parsed = val !== null && !Number.isNaN(val) ? val : null;
    onUpdateEntry(monthIdx, {
      currentReading: parsed,
      manualConsumption: null,
    });

    // If auto-chain is enabled and next month has no current reading yet, set next month's previous reading
    if (autoChainNextMonth && parsed !== null && monthIdx < 11) {
      const nextEntry = entries[monthIdx + 1];
      if (nextEntry && nextEntry.currentReading === null) {
        onUpdateEntry(monthIdx + 1, {
          previousReading: parsed,
        });
      }
    }
  };

  const handleDirectConsumptionChange = (monthIdx: number, raw: string) => {
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
      });
    }
  };

  const handleCostOverrideChange = (monthIdx: number, raw: string) => {
    const val = raw.trim() === '' ? null : parseFloat(raw);
    onUpdateEntry(monthIdx, {
      costOverride: val !== null && !Number.isNaN(val) && val >= 0 ? val : null,
    });
  };

  return (
    <div className="bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem]">
      <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* Banner Matching Screenshot 3 (#21527A Steel Blue Header) */}
        <div className="bg-[#21527A] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-wide">
              {lang === 'af'
                ? `MAANDELIKSE KRAGVERBRUIK & METERLESINGS INVOER (${selectedYear})`
                : `MAANDELIKSE KRAGVERBRUIK & METERLESINGS INVOER · METER READINGS INPUT (${selectedYear})`}
            </h2>
            <p className="text-xs text-sky-100/85 mt-0.5">
              {lang === 'af'
                ? 'Klik op enige sel om Leesdatum, Vorige Lesing, Huidige Lesing, Verbruik, Koste, Faktuurverwysing of Notas te wysig.'
                : 'Click any cell to edit Reading Date, Previous Reading, Current Reading, Calculated Consumption, Cost, Invoice Reference, or Notes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label className="inline-flex items-center gap-2 text-xs text-sky-100 bg-white/10 px-3 py-1.5 rounded-full cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoChainNextMonth}
                onChange={(e) => setAutoChainNextMonth(e.target.checked)}
                className="rounded border-white/30 text-sky-500 focus:ring-0"
              />
              <span>
                {lang === 'af' ? 'Skakel Maandlesings Outomaties' : 'Auto-Chain Next Month Prev Reading'}
              </span>
            </label>

            <button
              type="button"
              onClick={onChainReadings}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white transition-colors whitespace-nowrap"
            >
              {lang === 'af' ? 'Sinkroniseer Ketting' : 'Chain All Readings'}
            </button>

            <button
              type="button"
              onClick={onClearYear}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 transition-colors whitespace-nowrap"
            >
              {lang === 'af' ? `Maak ${selectedYear} Skoon` : `Clear ${selectedYear}`}
            </button>
          </div>
        </div>

        {/* Editable Spreadsheet Table Matching Screenshot 3 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2B5B84] text-white text-xs font-semibold">
                <th className="py-3 px-4 border-r border-white/15 w-32">
                  {lang === 'af' ? 'Maand' : 'Maand / Month'}
                </th>
                <th className="py-3 px-3 border-r border-white/15 text-center w-36">
                  {lang === 'af' ? 'Leesdatum' : 'Leesdatum / Date'}
                </th>
                <th className="py-3 px-3 border-r border-white/15 text-right w-40">
                  {lang === 'af' ? 'Vorige Lesing (kWh)' : 'Vorige Lesing / Prev (kWh)'}
                </th>
                <th className="py-3 px-3 border-r border-white/15 text-right w-40">
                  {lang === 'af' ? 'Huidige Lesing (kWh)' : 'Huidige Lesing / Curr (kWh)'}
                </th>
                <th className="py-3 px-3 border-r border-white/15 text-right w-44">
                  {lang === 'af'
                    ? 'Berekende Verbruik (kWh)'
                    : 'Berekende Verbruik / Usage (kWh)'}
                </th>
                <th className="py-3 px-3 border-r border-white/15 text-right w-36">
                  {lang === 'af' ? `Totale Koste (${tariff.currencySymbol})` : `Totale Koste (${tariff.currencySymbol})`}
                </th>
                <th className="py-3 px-3 border-r border-white/15 w-40">
                  {lang === 'af' ? 'Faktuurverwysing' : 'Faktuurverwysing / Invoice'}
                </th>
                <th className="py-3 px-4 min-w-[180px]">
                  {lang === 'af' ? 'Notas' : 'Notas / Notes'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
              {entries.map((entry, idx) => {
                const computed = monthlySummary.rows[idx];
                const isEven = idx % 2 === 1;
                const monthName = lang === 'af' ? entry.monthAf : `${entry.monthAf} (${entry.monthEn})`;

                return (
                  <tr
                    key={entry.monthIndex}
                    className={`${
                      isEven
                        ? 'bg-[#F2F6FA] dark:bg-slate-900/60'
                        : 'bg-white dark:bg-[#0D131F]'
                    } hover:bg-sky-50/70 dark:hover:bg-sky-950/30 transition-colors`}
                  >
                    {/* Maand */}
                    <td className="py-2 px-4 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200/70 dark:border-slate-800 whitespace-nowrap">
                      {monthName}
                    </td>

                    {/* Leesdatum */}
                    <td className="py-1.5 px-2 border-r border-slate-200/70 dark:border-slate-800">
                      <input
                        type="date"
                        aria-label={`${entry.monthEn} Reading Date`}
                        value={entry.readingDate}
                        onChange={(e) =>
                          onUpdateEntry(idx, { readingDate: e.target.value })
                        }
                        className="w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-800 dark:text-slate-200 border border-transparent focus:border-sky-500 focus:outline-none"
                      />
                    </td>

                    {/* Vorige Lesing (kWh) */}
                    <td className="py-1.5 px-2 border-r border-slate-200/70 dark:border-slate-800">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.1"
                          aria-label={`${entry.monthEn} Previous Reading kWh`}
                          placeholder="-"
                          value={entry.previousReading !== null ? entry.previousReading : ''}
                          onChange={(e) => handlePreviousChange(idx, e.target.value)}
                          className="w-24 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-lg px-2 py-1 text-right font-mono tabular-nums text-xs sm:text-sm text-slate-900 dark:text-slate-100 border border-transparent focus:border-sky-500 focus:outline-none"
                        />
                        {entry.previousReading !== null && (
                          <span className="text-[11px] font-mono text-slate-400 select-none">
                            kWh
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Huidige Lesing (kWh) */}
                    <td className="py-1.5 px-2 border-r border-slate-200/70 dark:border-slate-800">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.1"
                          aria-label={`${entry.monthEn} Current Reading kWh`}
                          placeholder="-"
                          value={entry.currentReading !== null ? entry.currentReading : ''}
                          onChange={(e) => handleCurrentChange(idx, e.target.value)}
                          className="w-24 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-lg px-2 py-1 text-right font-mono tabular-nums text-xs sm:text-sm text-slate-900 dark:text-slate-100 border border-transparent focus:border-sky-500 focus:outline-none"
                        />
                        {entry.currentReading !== null && (
                          <span className="text-[11px] font-mono text-slate-400 select-none">
                            kWh
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Berekende Verbruik (kWh) */}
                    <td className="py-1.5 px-2 border-r border-slate-200/70 dark:border-slate-800">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.1"
                          aria-label={`${entry.monthEn} Calculated Consumption kWh`}
                          placeholder=""
                          value={
                            computed.consumptionKwh > 0 || entry.manualConsumption !== null
                              ? computed.consumptionKwh
                              : ''
                          }
                          onChange={(e) => handleDirectConsumptionChange(idx, e.target.value)}
                          className="w-24 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-lg px-2 py-1 text-right font-mono tabular-nums font-semibold text-xs sm:text-sm text-slate-900 dark:text-white border border-transparent focus:border-sky-500 focus:outline-none"
                        />
                        {computed.consumptionKwh > 0 && (
                          <span className="text-[11px] font-mono text-slate-500 select-none">
                            kWh
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Totale Koste (R) */}
                    <td className="py-1.5 px-3 border-r border-slate-200/70 dark:border-slate-800 text-right font-mono tabular-nums">
                      {computed.totalCost > 0 || entry.costOverride !== null ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-slate-400">{tariff.currencySymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            aria-label={`${entry.monthEn} Total Cost`}
                            value={
                              entry.costOverride !== null
                                ? entry.costOverride
                                : computed.totalCost
                            }
                            onChange={(e) => handleCostOverrideChange(idx, e.target.value)}
                            className="w-24 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-lg px-1.5 py-1 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white border border-transparent focus:border-sky-500 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700"></span>
                      )}
                    </td>

                    {/* Faktuurverwysing */}
                    <td className="py-1.5 px-2 border-r border-slate-200/70 dark:border-slate-800">
                      <input
                        type="text"
                        aria-label={`${entry.monthEn} Invoice Reference`}
                        placeholder={lang === 'af' ? 'Faktuur #' : 'Invoice ref...'}
                        value={entry.invoiceRef}
                        onChange={(e) =>
                          onUpdateEntry(idx, { invoiceRef: e.target.value })
                        }
                        className="w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-lg px-2 py-1 font-mono text-xs text-slate-700 dark:text-slate-300 border border-transparent focus:border-sky-500 focus:outline-none"
                      />
                    </td>

                    {/* Notas */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        aria-label={`${entry.monthEn} Notes`}
                        placeholder={lang === 'af' ? 'Voeg nota by...' : 'Add note...'}
                        value={entry.notes}
                        onChange={(e) =>
                          onUpdateEntry(idx, { notes: e.target.value })
                        }
                        className="w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 border border-transparent focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totaal Footer Row Matching Screenshot 3 */}
            <tfoot>
              <tr className="bg-[#D9E8F6] dark:bg-sky-950/80 text-[#0F2C4C] dark:text-sky-100 font-bold text-xs sm:text-sm border-t-2 border-[#21527A] border-b-4 border-double border-[#21527A]">
                <td className="py-3 px-4 border-r border-sky-200/60 dark:border-sky-900">
                  {lang === 'af' ? 'Totaal' : 'Totaal / Total'}
                </td>
                <td className="py-3 px-3 text-center border-r border-sky-200/60 dark:border-sky-900">
                  -
                </td>
                <td className="py-3 px-3 text-center border-r border-sky-200/60 dark:border-sky-900">
                  -
                </td>
                <td className="py-3 px-3 text-center border-r border-sky-200/60 dark:border-sky-900">
                  -
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                  {formatKwh(monthlySummary.totalConsumptionKwh)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums border-r border-sky-200/60 dark:border-sky-900">
                  {formatCurrency(monthlySummary.totalEnergyCost, tariff.currencySymbol)}
                </td>
                <td className="py-3 px-3 text-center border-r border-sky-200/60 dark:border-sky-900">
                  -
                </td>
                <td className="py-3 px-4 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
