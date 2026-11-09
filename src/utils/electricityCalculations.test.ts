import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TARIFF_PARAMETERS,
  createScreenshotSeedDataset,
  createRichMultiYearDataset,
  calculateEntryConsumptionKwh,
  computeMonthlyReport,
  computeYoYReport,
  formatCurrency,
  formatKwh,
  formatPercent,
  generateElectricityCsv,
  generateElectricityPdfString,
} from './electricityCalculations';

test('screenshot seed dataset matches Screenshot 1, 2, and 3 values exactly', () => {
  const dataset = createScreenshotSeedDataset();
  const tariff = { ...DEFAULT_TARIFF_PARAMETERS };

  // Check Screenshot 3 (Meter reading input for 2026 Jan: prev 110, curr 220 -> 110 kWh)
  const janEntry = dataset[2026][0];
  assert.equal(janEntry.readingDate, '2026-11-01');
  assert.equal(janEntry.previousReading, 110);
  assert.equal(janEntry.currentReading, 220);

  const { consumptionKwh } = calculateEntryConsumptionKwh(janEntry);
  assert.equal(consumptionKwh, 110);

  // Check Screenshot 1 (Monthly Report for 2026)
  const monthly2026 = computeMonthlyReport(dataset[2026], tariff);
  assert.equal(monthly2026.totalConsumptionKwh, 110);
  assert.equal(monthly2026.totalEnergyCost, 387.42);
  assert.equal(monthly2026.avgMonthlyUsageKwh, 110);
  assert.equal(monthly2026.avgMonthlyCost, 387.42);
  assert.equal(monthly2026.avgRatePerKwh, 3.522);
  assert.equal(monthly2026.peakMonthUsageKwh, 110);
  assert.equal(monthly2026.lowestMonthUsageKwh, 110);
  assert.equal(monthly2026.avgUsageVarPercent, -9.1);
  assert.equal(monthly2026.avgMomCostVarPercent, 0.0);

  // Check February row in Screenshot 1
  const febRow = monthly2026.rows[1];
  assert.equal(febRow.consumptionKwh, 0);
  assert.equal(febRow.totalCost, 0);
  assert.equal(febRow.usageVarPercent, -100.0);
  assert.equal(febRow.momCostVarPercent, 0.0);

  // Check Screenshot 2 (Year-to-Year Overview 2023-2026)
  const yoy = computeYoYReport(dataset, tariff, 2026);
  assert.equal(yoy.totalHistoricalCost, 387.42);
  assert.equal(yoy.totalHistoricalKwh, 110);
  assert.equal(yoy.currentYearCost, 387.42);
  assert.equal(yoy.currentYearKwh, 110);
  assert.equal(yoy.averageAnnualCost, 96.86);
  assert.equal(yoy.averageHistoricalRate, 3.522);
});

test('editing meter readings and tariff parameters recalculates costs and variances accurately', () => {
  const dataset = createScreenshotSeedDataset();
  // Add February reading: Previous 220 kWh, Current 370 kWh -> 150 kWh
  dataset[2026][1] = {
    ...dataset[2026][1],
    readingDate: '2026-02-28',
    previousReading: 220,
    currentReading: 370,
  };

  const monthly = computeMonthlyReport(dataset[2026], DEFAULT_TARIFF_PARAMETERS);
  assert.equal(monthly.totalConsumptionKwh, 260); // 110 + 150
  assert.equal(monthly.rows[1].consumptionKwh, 150);
  assert.equal(monthly.rows[1].totalCost, 528.3); // 150 * 3.522
  assert.equal(monthly.totalEnergyCost, 915.72); // 387.42 + 528.30
  assert.equal(monthly.avgMonthlyUsageKwh, 130); // 260 / 2 active months
  assert.equal(monthly.peakMonthUsageKwh, 150);
  assert.equal(monthly.lowestMonthUsageKwh, 110);
  assert.equal(monthly.rows[1].usageVarPercent, 36.4); // (150 - 110) / 110 * 100 = 36.36%
  assert.equal(monthly.rows[1].momCostVarPercent, 36.4);

  // Test fixed network fee and tiered surcharge
  const customTariff = {
    ...DEFAULT_TARIFF_PARAMETERS,
    fixedNetworkFee: 50,
    tieredSurcharge: 0.5,
    tierThresholdKwh: 120,
  };
  const customMonthly = computeMonthlyReport(dataset[2026], customTariff);
  // Jan: 110 kWh (<= 120 threshold) -> 110 * 3.522 + 50 = 437.42
  assert.equal(customMonthly.rows[0].totalCost, 437.42);
  // Feb: 150 kWh (30 kWh above 120 threshold) -> 150 * 3.522 + 30 * 0.5 + 50 = 528.30 + 15 + 50 = 593.30
  assert.equal(customMonthly.rows[1].totalCost, 593.3);
});

test('formatting functions output South African comma-formatted currency, kWh, and percentages', () => {
  assert.equal(formatCurrency(387.42, 'R', 2, true), 'R387,42');
  assert.equal(formatCurrency(3.522, 'R', 3, true), 'R3,522');
  assert.equal(formatCurrency(96.86, 'R', 2, true), 'R96,86');
  assert.equal(formatKwh(110, 0, true), '110 kWh');
  assert.equal(formatKwh(110, 1, true), '110,0 kWh');
  assert.equal(formatPercent(-100.0, true), '-100,0%');
  assert.equal(formatPercent(null, true), '-');
});

test('CSV and PDF generators produce valid, non-empty outputs with report figures', () => {
  const dataset = createRichMultiYearDataset();
  const csv = generateElectricityCsv(2026, dataset, DEFAULT_TARIFF_PARAMETERS);
  assert.ok(csv.includes('MONTHLY ELECTRICITY CONSUMPTION & COST REPORT (2026)'));
  assert.ok(csv.includes('YEAR-TO-YEAR ELECTRICITY CONSUMPTION & COST OVERVIEW'));
  assert.ok(csv.includes('January'));

  const pdf = generateElectricityPdfString(2026, dataset, DEFAULT_TARIFF_PARAMETERS);
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.ok(pdf.includes('MONTHLY ELECTRICITY CONSUMPTION & COST REPORT - 2026'));
  assert.ok(pdf.trim().endsWith('%%EOF'));
});
