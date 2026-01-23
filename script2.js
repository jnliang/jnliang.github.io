function calculate() {
  const userAge = Number(document.getElementById("userAge").value);
  const spouseAgeInput = document.getElementById("spouseAge").value;
  const spouseAge = spouseAgeInput ? Number(spouseAgeInput) : null;
  const retirementState = document.getElementById("state").value;
  const monthlyExpense = Number(document.getElementById("monthlyExpense").value);
  const taxDeferredBalance = Number(document.getElementById("taxDeferred").value);
  const afterTaxBalance = Number(document.getElementById("afterTax").value);

  // Calculate retirement ages for each scenario
  const ageConservative = calculateRetirementAge(
    userAge,
    spouseAge,
    taxDeferredBalance,
    afterTaxBalance,
    retirementState,
    monthlyExpense,
    "conservative"
  );

  const ageNormal = calculateRetirementAge(
    userAge,
    spouseAge,
    taxDeferredBalance,
    afterTaxBalance,
    retirementState,
    monthlyExpense,
    "normal"
  );

  const ageOptimistic = calculateRetirementAge(
    userAge,
    spouseAge,
    taxDeferredBalance,
    afterTaxBalance,
    retirementState,
    monthlyExpense,
    "optimistic"
  );

  // Display results with appropriate messages
  const conservativeEl = document.getElementById("ageConservative");
  const normalEl = document.getElementById("ageNormal");
  const optimisticEl = document.getElementById("ageOptimistic");
  const warningEl = document.getElementById("warningMessage");

  conservativeEl.textContent = ageConservative !== null ? ageConservative : "N/A";
  normalEl.textContent = ageNormal !== null ? ageNormal : "N/A";
  optimisticEl.textContent = ageOptimistic !== null ? ageOptimistic : "N/A";

  // Show warning if any scenario returns null
  if (ageConservative === null || ageNormal === null || ageOptimistic === null) {
    warningEl.style.display = "block";
    
    // Determine which message to show
    if (ageOptimistic === null) {
      warningEl.innerHTML = `
        <strong>⚠️ Retirement Not Feasible</strong><br>
        Based on your current savings and expenses, retirement before age 75 may not be financially sustainable. 
        Consider:
        <ul style="margin: 10px 0; padding-left: 20px; text-align: left;">
          <li>Increasing your savings rate</li>
          <li>Reducing planned retirement expenses</li>
          <li>Working additional years to build savings</li>
          <li>Consulting with a financial advisor</li>
        </ul>
      `;
    } else if (ageNormal === null) {
      warningEl.innerHTML = `
        <strong>⚠️ Limited Retirement Options</strong><br>
        Under conservative and baseline scenarios, retirement before 75 may be challenging. 
        The optimistic scenario shows retirement at age ${ageOptimistic}, but this requires favorable market conditions.
      `;
    } else if (ageConservative === null) {
      warningEl.innerHTML = `
        <strong>ℹ️ Consider Building More Safety Margin</strong><br>
        While retirement appears feasible under normal conditions, the conservative scenario 
        suggests limited margin for market downturns. Consider increasing savings for greater security.
      `;
    }
  } else {
    warningEl.style.display = "none";
  }
}


/**
 * Estimate current total yearly household income based on
 * age, asset balances, saving behavior, and household structure.
 */
function estimateCurrentYearlyIncome(
  userAge,
  spouseAge,
  taxDeferredBalance,
  afterTaxBalance
) {
  userAge = Number(userAge);
  spouseAge = spouseAge ? Number(spouseAge) : null;
  taxDeferredBalance = Number(taxDeferredBalance);
  afterTaxBalance = Number(afterTaxBalance);

  const householdAssets = taxDeferredBalance + afterTaxBalance;

  /* ----------------------------------------
     1. Determine working years
  ----------------------------------------- */
  const CAREER_START_AGE = 22;
  const userWorkingYears = Math.max(userAge - CAREER_START_AGE, 1);
  const spouseWorkingYears = spouseAge
    ? Math.max(spouseAge - CAREER_START_AGE, 1)
    : 0;

  /* ----------------------------------------
     2. Base saving rate by asset size
     (higher asset households save more)
  ----------------------------------------- */
  let baseSavingRate;

  if (householdAssets < 100_000) {
    baseSavingRate = 0.06;
  } else if (householdAssets < 300_000) {
    baseSavingRate = 0.09;
  } else if (householdAssets < 750_000) {
    baseSavingRate = 0.13;
  } else if (householdAssets < 1_500_000) {
    baseSavingRate = 0.17;
  } else {
    baseSavingRate = 0.20;
  }

  /* ----------------------------------------
     3. Age-based adjustment
     (peak saving in mid-career)
  ----------------------------------------- */
  function ageAdjustment(age) {
    if (age < 30) return 0.85;
    if (age < 40) return 1.0;
    if (age < 50) return 1.1;
    if (age < 60) return 1.05;
    return 0.9;
  }

  const userSavingRate =
    baseSavingRate * ageAdjustment(userAge);

  const spouseSavingRate = spouseAge
    ? baseSavingRate * ageAdjustment(spouseAge)
    : 0;

  /* ----------------------------------------
     4. Market return assumptions
  ----------------------------------------- */
  const TAX_DEFERRED_RETURN = 0.055;
  const AFTER_TAX_RETURN = 0.04;

  /* ----------------------------------------
     5. Reverse-calculate income from balances
     Simplified annuity-style approximation
  ----------------------------------------- */
  function estimateIncomeFromBalance(
    balance,
    savingRate,
    workingYears,
    marketReturn
  ) {
    if (balance <= 0) return 0;

    const growthFactor =
      (Math.pow(1 + marketReturn, workingYears) - 1) /
      marketReturn;

    return balance / (savingRate * growthFactor);
  }

  const userIncomeFromTaxDeferred =
    estimateIncomeFromBalance(
      taxDeferredBalance,
      userSavingRate,
      userWorkingYears,
      TAX_DEFERRED_RETURN
    );

  const userIncomeFromAfterTax =
    estimateIncomeFromBalance(
      afterTaxBalance,
      userSavingRate,
      userWorkingYears,
      AFTER_TAX_RETURN
    );

  let totalUserIncome =
    userIncomeFromTaxDeferred + userIncomeFromAfterTax;

  /* ----------------------------------------
     6. Spouse income estimation (if applicable)
     Assume spouse assets proportional to
     working years if balances are combined
  ----------------------------------------- */
  let spouseIncome = 0;

  if (spouseAge) {
    const spouseWeight =
      spouseWorkingYears /
      (userWorkingYears + spouseWorkingYears);

    spouseIncome = totalUserIncome * spouseWeight;
    totalUserIncome *= (1 - spouseWeight);
  }

  /* ----------------------------------------
     7. Total household income
  ----------------------------------------- */
  const totalHouseholdIncome =
    totalUserIncome + spouseIncome;

  return Math.round(totalHouseholdIncome);
}

/**
 * Estimate household Social Security income for a specific future year (Year N)
 * If spouseAge is not provided, household is treated as a single person.
 */
function estimateFutureSocialSecurityIncomeAtYearN(
  userAge,
  spouseAge,
  taxDeferredBalance,
  afterTaxBalance,
  yearsRemainingToWork
) {
  userAge = Number(userAge);
  spouseAge = spouseAge ? Number(spouseAge) : null;
  taxDeferredBalance = Number(taxDeferredBalance);
  afterTaxBalance = Number(afterTaxBalance);

  /* =========================
     SSA Assumptions
  ========================== */
  const CAREER_START_AGE = 22;
  const CLAIM_AGE = 62;
  const TOP_YEARS = 35;

  const WAGE_GROWTH = 0.032;
  const BENEFIT_GROWTH = 0.025;
  const MAX_TAXABLE_GROWTH = 0.03;

  const BASE_MAX_TAXABLE = 168600;
  const EARLY_CLAIM_FACTOR = 0.70;
  const SPOUSAL_MIN_FACTOR = 0.50;

  /* =========================
     1. Estimate household income
  ========================== */
  const householdIncome =
    estimateCurrentYearlyIncome(
      userAge,
      spouseAge,
      taxDeferredBalance,
      afterTaxBalance
    );

  const isDualEarner = spouseAge !== null;

  const userIncome = isDualEarner ? householdIncome * 0.55 : householdIncome;
  const spouseIncome = isDualEarner ? householdIncome * 0.45 : 0;

  /* =========================
     2. Build indexed earnings history
  ========================== */
  function buildIndexedEarnings(age, income, yearsToWork) {
    if (!age || income <= 0) return [];

    const earnings = [];
    let maxTaxable = BASE_MAX_TAXABLE;

    const pastYears = Math.max(age - CAREER_START_AGE, 0);

    // Past earnings
    for (let i = 0; i < pastYears; i++) {
      const indexedIncome =
        Math.min(income, maxTaxable) *
        Math.pow(1 + WAGE_GROWTH, pastYears - i);

      earnings.push(indexedIncome);
      maxTaxable *= (1 + MAX_TAXABLE_GROWTH);
    }

    // Future earnings
    for (let i = 1; i <= yearsToWork; i++) {
      const futureIncome =
        income * Math.pow(1 + WAGE_GROWTH, i);

      earnings.push(Math.min(futureIncome, maxTaxable));
      maxTaxable *= (1 + MAX_TAXABLE_GROWTH);
    }

    // Top 35 indexed years only
    return earnings
      .sort((a, b) => b - a)
      .slice(0, TOP_YEARS);
  }

  const userEarnings =
    buildIndexedEarnings(userAge, userIncome, yearsRemainingToWork);

  const spouseEarnings = isDualEarner
    ? buildIndexedEarnings(spouseAge, spouseIncome, yearsRemainingToWork)
    : [];

  /* =========================
     3. AIME calculation
  ========================== */
  function calculateAIME(earnings) {
    if (earnings.length === 0) return 0;
    const total = earnings.reduce((sum, e) => sum + e, 0);
    return total / (TOP_YEARS * 12);
  }

  const userAIME = calculateAIME(userEarnings);
  const spouseAIME = calculateAIME(spouseEarnings);

  /* =========================
     4. PIA (bend points)
  ========================== */
  function calculatePIA(aime) {
    const BP1 = 1174;
    const BP2 = 7078;

    if (aime <= BP1) return 0.9 * aime;
    if (aime <= BP2)
      return 0.9 * BP1 + 0.32 * (aime - BP1);

    return (
      0.9 * BP1 +
      0.32 * (BP2 - BP1) +
      0.15 * (aime - BP2)
    );
  }

  let userPIA = calculatePIA(userAIME);
  let spousePIA = isDualEarner ? calculatePIA(spouseAIME) : 0;

  /* =========================
     5. Spousal minimum benefit
     (only if spouse exists)
  ========================== */
  if (isDualEarner) {
    const higherPIA = Math.max(userPIA, spousePIA);
    const spousalMinimum = higherPIA * SPOUSAL_MIN_FACTOR;

    if (spousePIA < spousalMinimum) {
      spousePIA = spousalMinimum;
    }
  }

  /* =========================
     6. Early claim reduction
  ========================== */
  userPIA *= EARLY_CLAIM_FACTOR;
  spousePIA *= EARLY_CLAIM_FACTOR;

  /* =========================
     7. Benefit growth to Year N
  ========================== */
  const yearsUntilClaim =
    Math.max(CLAIM_AGE - userAge, 0);

  const growthFactor =
    Math.pow(1 + BENEFIT_GROWTH, yearsUntilClaim);

  const userMonthly = userPIA * growthFactor;
  const spouseMonthly = spousePIA * growthFactor;

  /* =========================
     8. Yearly household benefit
  ========================== */
  const yearlyBenefit =
    (userMonthly + spouseMonthly) * 12;

  return Math.round(yearlyBenefit);
}

/**
 * Estimate after-tax income at year N
 */
function estimateIncomeAtYearN(
  userAge,
  spouseAge, // optional
  currentAnnualIncome,
  taxState, // "CA", "TX", etc.
  yearN,
  socialSecurityIncomeAtYearN
) {
  const INCOME_GROWTH_RATE = 0.03;
  const TAX_INFLATION_RATE = 0.025;

  const isMarried = typeof spouseAge === "number";

  /* -------------------------------
     1. Project gross income at Year N
  -------------------------------- */
  const projectedIncome =
    currentAnnualIncome * Math.pow(1 + INCOME_GROWTH_RATE, yearN);

  const grossIncome = projectedIncome + (socialSecurityIncomeAtYearN || 0);

  /* -------------------------------
     2. Federal tax config (2024 base)
  -------------------------------- */
  const federalBrackets = isMarried
    ? [
        { upTo: 22000, rate: 0.10 },
        { upTo: 89450, rate: 0.12 },
        { upTo: 190750, rate: 0.22 },
        { upTo: 364200, rate: 0.24 },
        { upTo: 462500, rate: 0.32 },
        { upTo: 693750, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
      ]
    : [
        { upTo: 11000, rate: 0.10 },
        { upTo: 44725, rate: 0.12 },
        { upTo: 95375, rate: 0.22 },
        { upTo: 182100, rate: 0.24 },
        { upTo: 231250, rate: 0.32 },
        { upTo: 578125, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 }
      ];

  const federalStandardDeduction = isMarried ? 27700 : 13850;

  /* Inflate brackets */
  function inflate(value) {
    return value * Math.pow(1 + TAX_INFLATION_RATE, yearN);
  }

  /* -------------------------------
     3. Taxable Social Security
  -------------------------------- */
  function taxableSocialSecurity(ssIncome, otherIncome) {
    const base = isMarried ? 32000 : 25000;
    const adjustedBase = inflate(base);

    if (otherIncome < adjustedBase) return 0;
    if (otherIncome < adjustedBase * 1.5) return ssIncome * 0.5;
    return ssIncome * 0.85;
  }

  const taxableSS = taxableSocialSecurity(
    socialSecurityIncomeAtYearN || 0,
    projectedIncome
  );

  /* -------------------------------
     4. Federal taxable income
  -------------------------------- */
  const federalTaxableIncome = Math.max(
    0,
    projectedIncome +
      taxableSS -
      inflate(federalStandardDeduction)
  );

  function calculateProgressiveTax(income, brackets) {
    let tax = 0;
    let prevCap = 0;

    for (const bracket of brackets) {
      const cap = inflate(bracket.upTo);
      if (income <= prevCap) break;
      const taxable = Math.min(income, cap) - prevCap;
      tax += taxable * bracket.rate;
      prevCap = cap;
    }
    return tax;
  }

  const federalTax = calculateProgressiveTax(
    federalTaxableIncome,
    federalBrackets
  );

  /* -------------------------------
     5. State tax system (ALL STATES)
  -------------------------------- */
  const stateTaxSystems = {
    CA: {
      brackets: [
        { upTo: 10099, rate: 0.01 },
        { upTo: 23942, rate: 0.02 },
        { upTo: 37788, rate: 0.04 },
        { upTo: 52455, rate: 0.06 },
        { upTo: 66295, rate: 0.08 },
        { upTo: 338639, rate: 0.093 },
        { upTo: Infinity, rate: 0.123 }
      ],
      standardDeduction: isMarried ? 10652 : 5326
    },

    NY: {
      brackets: [
        { upTo: 8500, rate: 0.04 },
        { upTo: 11700, rate: 0.045 },
        { upTo: 13900, rate: 0.0525 },
        { upTo: 21400, rate: 0.059 },
        { upTo: 80650, rate: 0.0621 },
        { upTo: Infinity, rate: 0.0685 }
      ],
      standardDeduction: isMarried ? 16050 : 8000
    },

    TX: { flatRate: 0, standardDeduction: 0 },
    FL: { flatRate: 0, standardDeduction: 0 },
    WA: { flatRate: 0, standardDeduction: 0 },
    NV: { flatRate: 0, standardDeduction: 0 },

    /* Default fallback for remaining states */
    DEFAULT: {
      flatRate: 0.05,
      standardDeduction: isMarried ? 8000 : 4000
    }
  };

  const stateConfig = stateTaxSystems[taxState] || stateTaxSystems.DEFAULT;

  let stateTax = 0;

  if (stateConfig.flatRate !== undefined) {
    const taxable =
      Math.max(
        0,
        projectedIncome - inflate(stateConfig.standardDeduction)
      );
    stateTax = taxable * stateConfig.flatRate;
  } else {
    const taxable =
      Math.max(
        0,
        projectedIncome - inflate(stateConfig.standardDeduction)
      );
    stateTax = calculateProgressiveTax(taxable, stateConfig.brackets);
  }

  /* -------------------------------
     6. Final after-tax income
  -------------------------------- */
  const totalTax = federalTax + stateTax;
  const afterTaxIncome = grossIncome - totalTax;

  return Math.round(afterTaxIncome);
}

/**
 * Calculate earliest safe retirement age for main user
 */
function calculateRetirementAge(
  userAge,
  spouseAge, // optional
  taxDeferredBalance,
  afterTaxBalance,
  retirementState,
  monthlyExpenseToday,
  scenario // "conservative" | "normal" | "optimistic"
) {
  const isMarried = typeof spouseAge === "number";

  /* -----------------------------
     Scenario parameters
  ------------------------------ */
  const scenarioConfig = {
    conservative: {
      assetGrowth: 0.03,
      inflation: 0.028,
      savingsRate: 0.08
    },
    normal: {
      assetGrowth: 0.05,
      inflation: 0.025,
      savingsRate: 0.12
    },
    optimistic: {
      assetGrowth: 0.07,
      inflation: 0.023,
      savingsRate: 0.18
    }
  };

  const config = scenarioConfig[scenario];

  /* -----------------------------
     Base assumptions
  ------------------------------ */
  const END_AGE = 90;
  const RMD_START_AGE = 73;
  const RMD_RATE = 0.04; // simplified blended RMD

  const annualExpenseToday = monthlyExpenseToday * 12;

  /* -----------------------------
     Step 1: estimate current income
  ------------------------------ */
  const currentIncome = estimateCurrentYearlyIncome(
    userAge,
    spouseAge,
    taxDeferredBalance,
    afterTaxBalance
  );

  /* -----------------------------
     Step 2: iterate retirement age
  ------------------------------ */
  for (let retirementAge = userAge; retirementAge <= 75; retirementAge++) {
    let tdBalance = taxDeferredBalance;
    let atBalance = afterTaxBalance;

    let stillSolvent = true;

    /* -----------------------------
       Phase A: Working years
    ------------------------------ */
    for (let age = userAge; age < retirementAge; age++) {
      const yearIndex = age - userAge;

      const incomeAtYear = estimateIncomeAtYearN(
        age,
        spouseAge,
        currentIncome,
        retirementState,
        yearIndex,
        0
      );

      const savings =
        incomeAtYear * config.savingsRate;

      tdBalance =
        tdBalance * (1 + config.assetGrowth) +
        savings * 0.7;

      atBalance =
        atBalance * (1 + config.assetGrowth) +
        savings * 0.3;
    }

    /* -----------------------------
       Phase B: Retirement years
    ------------------------------ */
    const spouseEndAge = isMarried ? END_AGE : retirementAge;
    const finalEndAge = Math.max(END_AGE, spouseEndAge);

    for (let age = retirementAge; age <= finalEndAge; age++) {
      const yearIndex = age - userAge;

      /* Inflate expenses */
      const expenseThisYear =
        annualExpenseToday *
        Math.pow(1 + config.inflation, yearIndex);

      /* Social Security */
      const ssIncome = estimateFutureSocialSecurityIncomeAtYearN(
        userAge,
        spouseAge,
        tdBalance,
        atBalance,
        retirementAge - userAge
      );

      /* RMD */
      let rmd = 0;
      if (age >= RMD_START_AGE) {
        rmd = tdBalance * RMD_RATE;
        tdBalance -= rmd;
      }

      /* Total income */
      const incomeThisYear =
        ssIncome + rmd;

      /* Withdraw if needed */
      let shortfall = expenseThisYear - incomeThisYear;

      if (shortfall > 0) {
        if (atBalance >= shortfall) {
          atBalance -= shortfall;
        } else {
          shortfall -= atBalance;
          atBalance = 0;
          tdBalance -= shortfall;
        }
      }

      /* Asset growth */
      tdBalance *= 1 + config.assetGrowth;
      atBalance *= 1 + config.assetGrowth;

      /* Insolvency check */
      if (tdBalance + atBalance <= 0) {
        stillSolvent = false;
        break;
      }
    }

    /* -----------------------------
       If survives to 90, success
    ------------------------------ */
    if (stillSolvent) {
      return retirementAge;
    }
  }

  /* -----------------------------
     If never feasible
  ------------------------------ */
  return null;
}

