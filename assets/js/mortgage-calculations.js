// ===============================
// Mortgage Readiness Calculations
// ===============================

function calculateMetrics(inputs) {

  const loanAmount = inputs.propertyPrice - inputs.deposit;

  const ltv = loanAmount / inputs.propertyPrice;
  const lti = loanAmount / inputs.incomeAnnual;

  const monthlyIncome = inputs.incomeAnnual / 12;
  const dti = inputs.debtMonthly / monthlyIncome;

  return { loanAmount, ltv, lti, dti };

}

function scoreMetric(value, config) {

  if (value <= config.green) return "green";
  if (value <= config.amber) return "amber";

  return "red";

}

function scoreBuffer(value, config) {

  if (value >= config.green) return "green";
  if (value >= config.amber) return "amber";

  return "red";

}