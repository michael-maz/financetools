// ===============================
// Mortgage Readiness Calculator
// ===============================

// ---- Config (easy to tweak later) ----
const MR_CONFIG = {
  thresholds: {
    ltv: {
      green: 0.80,
      amber: 0.90
    },
    lti: {
      green: 4.0,
      amber: 4.5
    },
    dti: {
      green: 0.30,
      amber: 0.40
    },
    buffer: {
  green: 0.20,
  amber: 0.10
}
  }
};


// ---- Utilities ----
const formatNumberInput = (value) => {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getRawNumber = (value) => {
  const raw = String(value).replace(/,/g, "").trim();
  return raw ? Number(raw) : 0;
};

const formatCurrency = (num) =>
  "£" + num.toLocaleString("en-GB", { maximumFractionDigits: 0 });

const formatPercent = (num) =>
  (num * 100).toFixed(1) + "%";

const formatRatio = (num) =>
  num.toFixed(2) + "x";

// ---- Core Calculations ----


// ---- Scoring ----


function getOverallBand(scores) {
  if (scores.includes("red")) return "red";
  if (scores.includes("amber")) return "amber";
  return "green";
}

// ---- Suggestions ----
function generateSuggestions(metrics, scores) {
  const suggestions = [];

  if (scores.ltv !== "green") {
    suggestions.push("Increase deposit to reduce Loan-to-Value.");
  }

  if (scores.lti !== "green") {
    suggestions.push("Lower target property price or increase income to reduce Loan-to-Income.");
  }

  if (scores.dti !== "green") {
    suggestions.push("Reduce monthly debt payments before applying.");
  }

  if (suggestions.length === 0) {
    suggestions.push("You’re in a strong position based on core affordability metrics.");
  }

  if (scores.buffer && scores.buffer !== "green") {
  suggestions.push("Your monthly buffer looks tight. Aim to keep at least 20% of income after rent, council tax, utilities and debts.");
}

  return suggestions;
}

// ---- DOM Handling ----
document.addEventListener("DOMContentLoaded", () => {
  
  const form = document.getElementById("mr-form");
  const errorEl = document.getElementById("mr-error");
  const resetBtn = document.getElementById("mr-resetBtn");

  function disableCalculator() {

  const inputs = document.querySelectorAll("#mr-form input, #mr-form select, #mr-form button, #mr-guidedSection input, #mr-guidedSection button");

  inputs.forEach(el => {
    if (el.id !== "mr-resetBtn") {
      el.disabled = true;
    }
  });
}

disableCalculator();

    // FIRST TIME BUYER GATE
  const ftbYes = document.getElementById("mr-ftbYes");
  const ftbNo = document.getElementById("mr-ftbNo");


let isFirstTimeBuyer = null;


function resetCalculator() {
  const form = document.getElementById("mr-form");

  if (form) form.reset();

  clearResults(); // you already have this function
}

if (ftbYes && ftbNo) {
ftbYes.addEventListener("click", () => {

  if (isFirstTimeBuyer !== true) {
    resetCalculator();
  }

  isFirstTimeBuyer = true;

  ftbYes.classList.add("btn-selected");
ftbYes.classList.remove("btn-secondary");

ftbNo.classList.remove("btn-selected");
ftbNo.classList.add("btn-secondary");

  enableCalculator();  

});

ftbNo.addEventListener("click", () => {

  if (isFirstTimeBuyer !== false) {
    resetCalculator();
  }

  isFirstTimeBuyer = false;

  ftbNo.classList.add("btn-selected");
ftbNo.classList.remove("btn-secondary");

ftbYes.classList.remove("btn-selected");
ftbYes.classList.add("btn-secondary");

   enableCalculator();

});
}

function enableCalculator() {

  const inputs = document.querySelectorAll(
    "#mr-form input, #mr-form select, #mr-form button, #mr-guidedSection input, #mr-guidedSection button"
  );

  inputs.forEach(el => {
    el.disabled = false;
  });

}
  // ===============================
  // Guided mode controller (3 steps)
  // ===============================
  const expertSection = document.getElementById("mr-expertSection");
  const guidedSection = document.getElementById("mr-guidedSection");
  const modeExpertBtn = document.getElementById("mr-modeExpertBtn");
  const modeGuidedBtn = document.getElementById("mr-modeGuidedBtn");

  const guidedInput = document.getElementById("mr-guidedInput");
  const guidedPrompt = document.getElementById("mr-guidedPrompt");
  const guidedHint = document.getElementById("mr-guidedHint");
  const guidedError = document.getElementById("mr-guidedError");

  const prevBtn = document.getElementById("mr-prevBtn");
  const nextBtn = document.getElementById("mr-nextBtn");
  const finishBtn = document.getElementById("mr-finishBtn");

  const progressText = document.getElementById("mr-progressText");
  const timeRemaining = document.getElementById("mr-timeRemaining");
  const progressFill = document.getElementById("mr-progressFill");

  const GUIDED_STEPS = [

{
  key: "propertyPrice",
  label: "What property price are you considering?",
  hint: "This is the purchase price of the home you want to buy. Example: £250,000 is close to the UK average house price.",
  placeholder: "e.g. 250,000"
},

{
  key: "deposit",
  label: "How much deposit can you put down?",
  hint: "Your deposit determines your Loan-to-Value (LTV). Lower LTV usually means better mortgage rates and more lender options.",
  placeholder: "e.g. 25,000"
},

{
  key: "incomeAnnual",
  label: "What is your total household income before tax?",
  hint: "Mortgage lenders usually lend around 4x–4.5x household income.",
  placeholder: "e.g. 60,000"
},

{
  key: "debtMonthly",
  label: "Do you have any monthly debt payments?",
  hint: "Examples: car finance, personal loans, credit cards. These reduce borrowing capacity.",
  placeholder: "e.g. 300"
},

{
  key: "rentMonthly",
  label: "What is your current monthly rent?",
  hint: "This helps estimate your financial buffer after housing costs.",
  placeholder: "e.g. 900"
},

{
  key: "utilitiesMonthly",
  label: "Estimate your monthly council tax + utilities",
  hint: "Typical combined range is £250–£400 depending on property size.",
  placeholder: "e.g. 300"
}

];
  const EST_SECONDS_PER_STEP = 25;

  let guidedIndex = 0;
  let guidedState = {}; // stores formatted strings, we convert to raw at the end

  function setMode(mode) {
    const isGuided = mode === "guided";
    guidedSection.hidden = !isGuided;
    expertSection.hidden = isGuided;

    // simple button state
    modeExpertBtn.className = isGuided ? "btn btn-secondary" : "btn";
    modeGuidedBtn.className = isGuided ? "btn" : "btn btn-secondary";
  }

  function initGuided() {
    guidedIndex = 0;
    guidedState = {};
    guidedError.textContent = "";
    renderGuidedStep();
  }

  function renderGuidedStep() {
    const step = GUIDED_STEPS[guidedIndex];
    const total = GUIDED_STEPS.length;

    guidedPrompt.textContent = step.label;
    guidedHint.textContent = step.hint;
    guidedInput.placeholder = step.placeholder;
    guidedInput.value = guidedState[step.key] || "";

    // progress UI
    progressText.textContent = `Question ${guidedIndex + 1} of ${total}`;

    const remainingSteps = total - (guidedIndex + 1);
    const remainingSeconds = remainingSteps * EST_SECONDS_PER_STEP;
    const remainingMins = remainingSeconds <= 0 ? 0 : Math.max(1, Math.round(remainingSeconds / 60));
    timeRemaining.textContent = remainingSteps === 0 ? "Done" : `~${remainingMins} min remaining`;

    const pct = Math.round(((guidedIndex + 1) / total) * 100);
    progressFill.style.width = `${isFinite(pct) ? pct : 0}%`;

    // buttons
    prevBtn.disabled = guidedIndex === 0;
    const isLast = guidedIndex === total - 1;
    nextBtn.hidden = isLast;
    finishBtn.hidden = !isLast;

    guidedError.textContent = "";

    guidedInput.focus();
    guidedInput.setSelectionRange(guidedInput.value.length, guidedInput.value.length);
  }

  // Format guided input with commas while typing
  guidedInput.addEventListener("input", () => {
    guidedInput.value = formatNumberInput(guidedInput.value.replace(/,/g, ""));
    guidedInput.setSelectionRange(guidedInput.value.length, guidedInput.value.length);
  });

  function saveGuidedStep() {
    const step = GUIDED_STEPS[guidedIndex];
    const raw = getRawNumber(guidedInput.value);

    if (raw < 0) {
  guidedError.textContent = "Please enter a valid amount.";
  return false;
}

// Some fields must be greater than zero
if (
  (step.key === "propertyPrice" || 
   step.key === "deposit" || 
   step.key === "incomeAnnual") 
   && raw === 0
) {
  guidedError.textContent = "Please enter an amount greater than zero.";
  return false;
}

    // deposit cannot exceed property price (once price exists)
    if (step.key === "deposit") {
      const price = getRawNumber(guidedState.propertyPrice || "0");
      if (price > 0 && raw > price) {
        guidedError.textContent = "Deposit cannot exceed property price.";
        return false;
      }
    }

    guidedState[step.key] = formatNumberInput(String(raw));
    return true;
  }

  nextBtn.addEventListener("click", () => {
    if (!saveGuidedStep()) return;
    guidedIndex += 1;
    renderGuidedStep();
  });

  prevBtn.addEventListener("click", () => {
    // optional save attempt (won't block going back)
    saveGuidedStep();
    guidedIndex = Math.max(0, guidedIndex - 1);
    renderGuidedStep();
  });

  guidedInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (guidedIndex === GUIDED_STEPS.length - 1) finishBtn.click();
      else nextBtn.click();
    }
  });

  finishBtn.addEventListener("click", () => {
    if (!saveGuidedStep()) return;

 const inputs = {
  propertyPrice: getRawNumber(guidedState.propertyPrice || "0"),
  deposit: getRawNumber(guidedState.deposit || "0"),
  incomeAnnual: getRawNumber(guidedState.incomeAnnual || "0"),
  debtMonthly: getRawNumber(guidedState.debtMonthly || "0"),

  rentMonthly: getRawNumber(guidedState.rentMonthly || "0"),
  councilTaxMonthly: 0,
  utilitiesMonthly: getRawNumber(guidedState.utilitiesMonthly || "0"),

  firstTimeBuyer: isFirstTimeBuyer
};

    // final validation
    if (inputs.deposit > inputs.propertyPrice) {
      guidedError.textContent = "Deposit cannot exceed property price.";
      return;
    }

    const metrics = calculateMetrics(inputs);

    const useNet = document.getElementById("mr-useNetPay")?.value === "net";

const annualBase = useNet
  ? estimateNetAnnualUK(inputs.incomeAnnual)
  : inputs.incomeAnnual;

const monthlyBase = annualBase / 12;

const monthlyCommitments =
  inputs.debtMonthly +
  inputs.rentMonthly +
  inputs.councilTaxMonthly +
  inputs.utilitiesMonthly;

const disposableMonthly = monthlyBase - monthlyCommitments;

const bufferRatio = monthlyBase > 0
  ? (disposableMonthly / monthlyBase)
  : 0;

    const scores = {
  ltv: scoreMetric(metrics.ltv, MR_CONFIG.thresholds.ltv),
  lti: scoreMetric(metrics.lti, MR_CONFIG.thresholds.lti),
  dti: scoreMetric(metrics.dti, MR_CONFIG.thresholds.dti),
  buffer: scoreBuffer(bufferRatio, MR_CONFIG.thresholds.buffer)
};


    const overall = getOverallBand(Object.values(scores));
    const suggestions = generateSuggestions(metrics, scores);

    renderResults(metrics, scores, overall, suggestions, disposableMonthly);

    progressFill.style.width = "100%";
    timeRemaining.textContent = "Done";
  });

  // mode buttons
  modeExpertBtn.addEventListener("click", () => {
  if (isFirstTimeBuyer === null) {
    errorEl.textContent = "Please select whether you are a first-time buyer first.";
    return;
  }

  errorEl.textContent = "";
  setMode("expert");
});

modeGuidedBtn.addEventListener("click", () => {
  if (isFirstTimeBuyer === null) {
    errorEl.textContent = "Please select whether you are a first-time buyer first.";
    return;
  }

  errorEl.textContent = "";
  setMode("guided");
  initGuided();
});

  // Format money inputs with commas (after DOM exists)
  ["mr-propertyPrice", "mr-deposit", "mr-incomeAnnual"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", () => {
      input.value = formatNumberInput(input.value.replace(/,/g, ""));
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.textContent = "";

  if (isFirstTimeBuyer === null) {
  errorEl.textContent = "Please select whether you are a first-time buyer.";
  return;
}

  const inputs = {
  propertyPrice: getRawNumber(document.getElementById("mr-propertyPrice").value),
  deposit: getRawNumber(document.getElementById("mr-deposit").value),
  incomeAnnual: getRawNumber(document.getElementById("mr-incomeAnnual").value),
  debtMonthly: Number(document.getElementById("mr-debtMonthly").value || 0),

  rentMonthly: Number(document.getElementById("mr-rentMonthly").value || 0),
  councilTaxMonthly: Number(document.getElementById("mr-councilTaxMonthly").value || 0),
  utilitiesMonthly: Number(document.getElementById("mr-utilitiesMonthly").value || 0),

  firstTimeBuyer: isFirstTimeBuyer
};

    

    // ---- Basic Validation ----
    if (
      inputs.propertyPrice <= 0 ||
      inputs.incomeAnnual <= 0 ||
      inputs.deposit < 0 ||
      inputs.deposit > inputs.propertyPrice
    ) {
      errorEl.textContent = "Please enter valid numbers. Deposit cannot exceed property price.";
      return;
    }

    const metrics = calculateMetrics(inputs);

  const useNet = document.getElementById("mr-useNetPay")?.value === "net";

const annualBase = useNet
  ? estimateNetAnnualUK(inputs.incomeAnnual)
  : inputs.incomeAnnual;

const monthlyBase = annualBase / 12;

const monthlyCommitments =
  inputs.debtMonthly +
  inputs.rentMonthly +
  inputs.councilTaxMonthly +
  inputs.utilitiesMonthly;

const disposableMonthly = monthlyBase - monthlyCommitments;

const bufferRatio = monthlyBase > 0
  ? (disposableMonthly / monthlyBase)
  : 0;

    const scores = {
  ltv: scoreMetric(metrics.ltv, MR_CONFIG.thresholds.ltv),
  lti: scoreMetric(metrics.lti, MR_CONFIG.thresholds.lti),
  dti: scoreMetric(metrics.dti, MR_CONFIG.thresholds.dti),
  buffer: scoreBuffer(bufferRatio, MR_CONFIG.thresholds.buffer)
};

    const overall = getOverallBand(Object.values(scores));
    const suggestions = generateSuggestions(metrics, scores);

    renderResults(metrics, scores, overall, suggestions, disposableMonthly);
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    clearResults();
    errorEl.textContent = "";
  });

// ===============================
// EMAIL CAPTURE (Formspree)
// ===============================
const emailBtn = document.getElementById("mr-emailBtn");
const emailInput = document.getElementById("mr-email");
const nameInput = document.getElementById("mr-name");

if (emailBtn && emailInput && nameInput) {
  emailBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const name = nameInput.value;

    if (!name) {
      alert("Enter your name");
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Enter a valid email");
      return;
    }

    try {
      await fetch("https://formspree.io/f/xnjglbwn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          email: email,
          band: document.getElementById("mr-bandBadge")?.textContent || "",
          source: "mortgage_calculator"
        })
      });

      alert(`Nice ${name} ... I’ll send you what to fix shortly.`);
      emailInput.value = "";
      nameInput.value = "";

    } catch (err) {
      alert("Something went wrong. Try again.");
    }
  });
}


  }); 


// ---- Render ----
function renderResults(metrics, scores, overall, suggestions, disposableMonthly) {

  document.getElementById("mr-loanAmount").textContent =
    formatCurrency(metrics.loanAmount);

  document.getElementById("mr-ltv").textContent =
    formatPercent(metrics.ltv);

  const depositPercent = ((1 - metrics.ltv) * 100).toFixed(1);

  const depositInsight = document.getElementById("mr-depositInsight");

if (depositInsight) {
  depositInsight.textContent =
    `Your deposit is ${depositPercent}% of the property price. Increasing your deposit can reduce interest rates and improve lender options.`;
}

  document.getElementById("mr-lti").textContent =
    formatRatio(metrics.lti);

  document.getElementById("mr-dti").textContent =
    formatPercent(metrics.dti);

  const disposableEl = document.getElementById("mr-disposableMonthly");
  const bufferNoteEl = document.getElementById("mr-bufferNote");

  if (disposableEl && disposableMonthly !== undefined) {
    disposableEl.textContent = formatCurrency(disposableMonthly);
  }

  if (bufferNoteEl && typeof scores.buffer !== "undefined") {
    bufferNoteEl.textContent =
      scores.buffer === "green" ? "Good buffer: 20%+ left after commitments." :
      scores.buffer === "amber" ? "Tight buffer: 10–20% left after commitments." :
      "Very tight buffer: under 10% left after commitments.";
  }

  updateNotes(metrics, scores);
  updateBand(overall);
  updateSuggestions(suggestions);
}

function updateNotes(metrics, scores) {
  document.getElementById("mr-ltvNote").textContent =
    scores.ltv === "green" ? "Strong deposit level." :
    scores.ltv === "amber" ? "High LTV – fewer lender options." :
    "Very high LTV – higher rates likely.";

  document.getElementById("mr-ltiNote").textContent =
    scores.lti === "green" ? "Comfortable income multiple." :
    scores.lti === "amber" ? "At upper mainstream lending range." :
    "Above typical lending multiples.";

  document.getElementById("mr-dtiNote").textContent =
    scores.dti === "green" ? "Low monthly debt burden." :
    scores.dti === "amber" ? "Moderate debt commitments." :
    "High debt load relative to income.";
}

function updateBand(band) {
  const badge = document.getElementById("mr-bandBadge");

  badge.className = "badge";

  if (band === "green") {
    badge.classList.add("badge-green");
    badge.textContent = "Green – Ready";
  } else if (band === "amber") {
    badge.classList.add("badge-amber");
    badge.textContent = "Amber – Improve Position";
  } else {
    badge.classList.add("badge-red");
    badge.textContent = "Red – High Risk";
  }
}

function updateSuggestions(suggestions) {
  const list = document.getElementById("mr-suggestions");
  list.innerHTML = "";

  suggestions.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

function clearResults() {
  document.getElementById("mr-loanAmount").textContent = "—";
  document.getElementById("mr-ltv").textContent = "—";
  document.getElementById("mr-lti").textContent = "—";
  document.getElementById("mr-dti").textContent = "—";
  document.getElementById("mr-bandBadge").textContent = "Not calculated";
  document.getElementById("mr-suggestions").innerHTML =
    "<li class='muted'>Enter your numbers and calculate to see tailored actions.</li>";
}

const car = {
  make: "Toyota",
  model: "Corolla",
  year: 2020,   
};


