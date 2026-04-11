// ===============================
// UK Tax Utilities
// ===============================

// Estimate net annual income using UK Income Tax bands
// (England / Wales / NI default)

function estimateNetAnnualUK(grossAnnual) {

  const gross = Math.max(0, Number(grossAnnual) || 0);

  const personalAllowance = 12570;
  const basicUpper = 50270;
  const higherUpper = 125140;

  const taxable = Math.max(0, gross - personalAllowance);

  const basicWidth = basicUpper - personalAllowance;   // 37,700
  const higherWidth = higherUpper - basicUpper;        // 74,870

  const basicTaxable = Math.min(taxable, basicWidth);
  const higherTaxable = Math.min(Math.max(0, taxable - basicWidth), higherWidth);
  const additionalTaxable = Math.max(0, taxable - basicWidth - higherWidth);

  const incomeTax =
    basicTaxable * 0.20 +
    higherTaxable * 0.40 +
    additionalTaxable * 0.45;

  // Simple NI estimate
  const niPrimaryThreshold = 12570;
  const niUpperEarningsLimit = 50270;

  let ni = 0;

  const niBand1 = Math.min(
    Math.max(0, gross - niPrimaryThreshold),
    niUpperEarningsLimit - niPrimaryThreshold
  );

  ni += niBand1 * 0.08;

  const niBand2 = Math.max(0, gross - niUpperEarningsLimit);

  ni += niBand2 * 0.02;

  const net = gross - incomeTax - ni;

  return Math.max(0, net);
}