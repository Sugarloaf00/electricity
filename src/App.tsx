import React, { useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_TARIFF_PARAMETERS,
  Language,
  MonthlyMeterEntry,
  TariffParameters,
  YearDatasetMap,
  computeMonthlyReport,
  computeYoYReport,
  createEmptyYearEntries,
  createRichMultiYearDataset,
  createScreenshotSeedDataset,
  formatCurrency,
  formatKwh,
  generateElectricityCsv,
  generateElectricityPdfString,
} from './utils/electricityCalculations';
import { RealTimeMeterOverview } from './components/RealTimeMeterOverview';
import { MeterReadingsInputView } from './components/MeterReadingsInputView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { YoYReportView } from './components/YoYReportView';

const STORAGE_KEY_DATASET = 'voltmetric_dataset_v1';
const STORAGE_KEY_TARIFF = 'voltmetric_tariff_v1';

export type ActiveTab = 'overview' | 'readings' | 'monthly' | 'yoy';

export default function App() {
  const [dataset, setDataset] = useState<YearDatasetMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATASET);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed[2026]) {
          return parsed;
        }
      }
    } catch {
      // Fallback to screenshot seed
    }
    return createScreenshotSeedDataset();
  });

  const [tariff, setTariff] = useState<TariffParameters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TARIFF);
      if (saved) {
        return { ...DEFAULT_TARIFF_PARAMETERS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_TARIFF_PARAMETERS };
  });

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [lang, setLang] = useState<Language>('en');
  const [presetMode, setPresetMode] = useState<'seed' | 'demo' | 'custom'>('seed');
  const [exportStatus, setExportStatus] = useState<{
    type: 'csv' | 'pdf';
    filename: string;
    preview: string;
  } | null>(null);
  const [newYearInput, setNewYearInput] = useState<string>('');
  const [showAddYearInput, setShowAddYearInput] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DATASET, JSON.stringify(dataset));
    } catch {
      // Ignore storage quota errors
    }
  }, [dataset]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TARIFF, JSON.stringify(tariff));
    } catch {
      // Ignore storage quota errors
    }
  }, [tariff]);

  const availableYears = useMemo(
    () =>
      Object.keys(dataset)
        .map(Number)
        .sort((a, b) => a - b),
    [dataset]
  );

  const currentYearEntries = useMemo(
    () => dataset[selectedYear] ?? createEmptyYearEntries(),
    [dataset, selectedYear]
  );

  const monthlySummary = useMemo(
    () => computeMonthlyReport(currentYearEntries, tariff),
    [currentYearEntries, tariff]
  );

  const yoySummary = useMemo(
    () => computeYoYReport(dataset, tariff, selectedYear),
    [dataset, tariff, selectedYear]
  );

  const handleUpdateEntry = (
    monthIndex: number,
    patch: Partial<MonthlyMeterEntry>
  ) => {
    setPresetMode('custom');
    setDataset((prev) => {
      const yearList = [...(prev[selectedYear] ?? createEmptyYearEntries())];
      yearList[monthIndex] = {
        ...yearList[monthIndex],
        ...patch,
      };
      return {
        ...prev,
        [selectedYear]: yearList,
      };
    });
  };

  const handleUpdateYearMonthKwh = (
    year: number,
    monthIndex: number,
    kwh: number | null
  ) => {
    setPresetMode('custom');
    setDataset((prev) => {
      const yearList = [...(prev[year] ?? createEmptyYearEntries())];
      const existing = yearList[monthIndex];
      if (kwh === null) {
        yearList[monthIndex] = {
          ...existing,
          previousReading: null,
          currentReading: null,
          manualConsumption: null,
          costOverride: null,
        };
      } else if (existing.previousReading !== null) {
        yearList[monthIndex] = {
          ...existing,
          currentReading: Number((existing.previousReading + kwh).toFixed(2)),
          manualConsumption: null,
          costOverride: null,
        };
      } else {
        yearList[monthIndex] = {
          ...existing,
          manualConsumption: kwh,
          costOverride: null,
        };
      }
      return {
        ...prev,
        [year]: yearList,
      };
    });
  };

  const handleUpdateTariff = (patch: Partial<TariffParameters>) => {
    setTariff((prev) => ({ ...prev, ...patch }));
  };

  const handleChainReadings = () => {
    setDataset((prev) => {
      const yearList = [...(prev[selectedYear] ?? createEmptyYearEntries())];
      for (let i = 1; i < yearList.length; i++) {
        const prevMonth = yearList[i - 1];
        if (prevMonth.currentReading !== null) {
          const oldDiff =
            yearList[i].currentReading !== null && yearList[i].previousReading !== null
              ? Math.max(0, yearList[i].currentReading! - yearList[i].previousReading!)
              : null;
          yearList[i] = {
            ...yearList[i],
            previousReading: prevMonth.currentReading,
            ...(oldDiff !== null && oldDiff > 0
              ? { currentReading: Number((prevMonth.currentReading + oldDiff).toFixed(2)) }
              : {}),
          };
        }
      }
      return {
        ...prev,
        [selectedYear]: yearList,
      };
    });
  };

  const handleClearYear = () => {
    setPresetMode('custom');
    setDataset((prev) => ({
      ...prev,
      [selectedYear]: createEmptyYearEntries(),
    }));
  };

  const handleLoadScreenshotSeed = () => {
    const seed = createScreenshotSeedDataset();
    setDataset(seed);
    setTariff({ ...DEFAULT_TARIFF_PARAMETERS });
    setSelectedYear(2026);
    setPresetMode('seed');
  };

  const handleLoadDemoDataset = () => {
    const demo = createRichMultiYearDataset();
    setDataset(demo);
    setSelectedYear(2026);
    setPresetMode('demo');
  };

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = parseInt(newYearInput, 10);
    if (!Number.isNaN(yr) && yr >= 2000 && yr <= 2100) {
      if (!dataset[yr]) {
        setDataset((prev) => ({
          ...prev,
          [yr]: createEmptyYearEntries(),
        }));
      }
      setSelectedYear(yr);
      setNewYearInput('');
      setShowAddYearInput(false);
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = generateElectricityCsv(selectedYear, dataset, tariff);
    const filename = `electricity-report-${selectedYear}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportStatus({
      type: 'csv',
      filename,
      preview: csvContent.split('\n').slice(0, 10).join('\n'),
    });
  };

  const handleDownloadPdf = () => {
    const pdfContent = generateElectricityPdfString(selectedYear, dataset, tariff);
    const filename = `electricity-report-${selectedYear}.pdf`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportStatus({
      type: 'pdf',
      filename,
      preview:
        `PDF 1.4 Document Generated (${filename})\n` +
        `Year: ${selectedYear} | Total Consumption: ${formatKwh(monthlySummary.totalConsumptionKwh)} | Total Cost: ${formatCurrency(monthlySummary.totalEnergyCost, tariff.currencySymbol)}\n` +
        `Historical Total (${availableYears[0]}–${availableYears[availableYears.length - 1]}): ${formatCurrency(yoySummary.totalHistoricalCost, tariff.currencySymbol)} (${formatKwh(yoySummary.totalHistoricalKwh)})`,
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#F5F7FA] dark:bg-[#070B12] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 Zones (1: Wordmark, 2: 4 Nav Links, 3: 1 Primary CTA with Button-in-Button Icon) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 no-print">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single Text Element Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
            className="text-lg font-extrabold tracking-tight text-[#1B4975] dark:text-white whitespace-nowrap shrink-0"
          >
            VoltMetric
          </a>

          {/* Zone 2: 4 Concise Single-Line Navigation Links */}
          <nav
            aria-label="Primary Workspace Views"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#1F4E79] text-[#1F4E79] dark:border-sky-400 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'af' ? 'Volledige Oorsig' : 'All Reports'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'monthly'
                  ? 'border-[#1F4E79] text-[#1F4E79] dark:border-sky-400 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'af' ? 'Maandverslag' : 'Monthly Report'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('readings')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'readings'
                  ? 'border-[#1F4E79] text-[#1F4E79] dark:border-sky-400 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'af' ? 'Meterlesings' : 'Meter Readings'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('yoy')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'yoy'
                  ? 'border-[#1F4E79] text-[#1F4E79] dark:border-sky-400 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'af' ? 'Jaar-na-Jaar' : 'YoY Report'}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Button (Button-in-Button Architecture) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="group flex items-center gap-3 rounded-full bg-[#1F4E79] hover:bg-[#163B5C] active:scale-[0.98] text-white pl-5 pr-1.5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap shrink-0"
            >
              <span>{lang === 'af' ? 'Voer PDF Verslag Uit' : 'Export PDF Report'}</span>
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Workspace Control Bar: Year Selector, Dataset Presets, Language Toggle, CSV & PDF Export */}
        <section
          aria-label="Report Controls and Export Toolbar"
          className="bg-slate-900/[0.03] dark:bg-white/[0.04] ring-1 ring-slate-900/[0.08] dark:ring-white/10 p-1.5 rounded-[2rem] no-print"
        >
          <div className="bg-white dark:bg-[#0D131F] rounded-[calc(2rem-0.375rem)] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Year Selector & Mobile View Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {lang === 'af' ? 'Verslagjaar:' : 'Active Year:'}
              </span>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
                      selectedYear === yr
                        ? 'bg-[#21527A] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
                {!showAddYearInput ? (
                  <button
                    type="button"
                    onClick={() => setShowAddYearInput(true)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-white dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    + {lang === 'af' ? 'Jaar' : 'Year'}
                  </button>
                ) : (
                  <form onSubmit={handleAddYear} className="inline-flex items-center gap-1 pl-1">
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="2027"
                      value={newYearInput}
                      onChange={(e) => setNewYearInput(e.target.value)}
                      className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-mono"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 rounded-lg bg-[#21527A] text-white text-xs font-semibold"
                    >
                      OK
                    </button>
                  </form>
                )}
              </div>

              {/* Mobile View Selector */}
              <div className="flex md:hidden flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                {(['overview', 'monthly', 'readings', 'yoy'] as ActiveTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                      activeTab === tab
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Dataset Preset Switcher, Language Switcher, CSV & PDF Export Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Dataset Presets */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLoadScreenshotSeed}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    presetMode === 'seed'
                      ? 'bg-white dark:bg-slate-800 text-[#1B4975] dark:text-sky-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lang === 'af' ? 'Voorbeeld Basis (110 kWh)' : 'Spreadsheet Seed (110 kWh)'}
                </button>
                <button
                  type="button"
                  onClick={handleLoadDemoDataset}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    presetMode === 'demo'
                      ? 'bg-white dark:bg-slate-800 text-[#1B4975] dark:text-sky-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lang === 'af' ? 'Volle 2023–2026 Data' : 'Load 2023–2026 Sample Data'}
                </button>
              </div>

              {/* Language Switcher (EN / AF) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    lang === 'en'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('af')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    lang === 'af'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  AF
                </button>
              </div>

              {/* Direct CSV & PDF Export Buttons */}
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap shrink-0"
              >
                {lang === 'af' ? 'Voer CSV Uit' : 'Export CSV'}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#21527A] hover:bg-[#183E5E] text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap shrink-0"
              >
                {lang === 'af' ? 'Voer PDF Uit' : 'Export PDF'}
              </button>
            </div>
          </div>
        </section>

        {/* Export Feedback Banner (When CSV or PDF is generated) */}
        {exportStatus && (
          <section
            aria-live="polite"
            className="bg-emerald-950/5 dark:bg-emerald-500/10 ring-1 ring-emerald-600/30 p-1.5 rounded-[1.5rem] no-print"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[calc(1.5rem-0.375rem)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {exportStatus.type === 'csv'
                    ? `CSV Export Ready: ${exportStatus.filename}`
                    : `PDF Report Generated: ${exportStatus.filename}`}
                </div>
                <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 max-h-28 overflow-y-auto">
                  {exportStatus.preview}
                </pre>
              </div>
              <button
                type="button"
                onClick={() => setExportStatus(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 self-start shrink-0"
              >
                {lang === 'af' ? 'Sluit' : 'Dismiss'}
              </button>
            </div>
          </section>
        )}

        {/* 1. Electricity Meter Reading Overview Section */}
        {activeTab === 'overview' && (
          <RealTimeMeterOverview
            lang={lang}
            selectedYear={selectedYear}
            entries={currentYearEntries}
            monthlySummary={monthlySummary}
            tariff={tariff}
            onUpdateEntry={handleUpdateEntry}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* 2. Monthly Electricity Consumption & Cost Report + Tariff Parameters (Screenshot 1) */}
        {(activeTab === 'overview' || activeTab === 'monthly') && (
          <MonthlyReportView
            lang={lang}
            selectedYear={selectedYear}
            entries={currentYearEntries}
            monthlySummary={monthlySummary}
            tariff={tariff}
            onUpdateEntry={handleUpdateEntry}
            onUpdateTariff={handleUpdateTariff}
          />
        )}

        {/* 3. Monthly Power Consumption & Meter Readings Input Ledger (Screenshot 3) */}
        {(activeTab === 'overview' || activeTab === 'readings') && (
          <MeterReadingsInputView
            lang={lang}
            selectedYear={selectedYear}
            entries={currentYearEntries}
            monthlySummary={monthlySummary}
            tariff={tariff}
            onUpdateEntry={handleUpdateEntry}
            onChainReadings={handleChainReadings}
            onClearYear={handleClearYear}
          />
        )}

        {/* 4. Year-to-Year Electricity Consumption & Cost Overview (Screenshot 2) */}
        {(activeTab === 'overview' || activeTab === 'yoy') && (
          <YoYReportView
            lang={lang}
            selectedYear={selectedYear}
            dataset={dataset}
            yoySummary={yoySummary}
            tariff={tariff}
            onUpdateYearMonthKwh={handleUpdateYearMonthKwh}
            onSelectYear={setSelectedYear}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 no-print">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>VoltMetric — Smart Electricity Meter & Tariff Analytics</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Download CSV
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Download PDF
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => window.print()}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Print Sheet
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
