/**
 * Formats a number as EUR currency using German locale.
 * @param {number | undefined | null} value
 * @returns {string}
 */
export const formatCurrency = (value = 0) => {
  if (value === undefined || value === null) return "0,00 €";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

/**
 * Returns the German month name for a 1-based month index.
 * @param {number} monthIndex  1 = Januar … 12 = Dezember
 * @returns {string}
 */
export const getMonthName = (monthIndex) => {
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return months[monthIndex - 1];
};

/**
 * Calculates the monthly annuity payment (PMT formula).
 * @param {number} principal       Remaining loan balance
 * @param {number} annualRate      Annual interest rate as a decimal (e.g. 0.009 for 0.9%)
 * @param {number} remainingMonths Months left until full repayment
 * @returns {number}
 */
export const calculateAnnuityRate = (principal, annualRate, remainingMonths) => {
  if (remainingMonths <= 0 || principal <= 0) return 0;
  if (annualRate === 0) return principal / remainingMonths;

  const r = annualRate / 12;
  const rateFactor = Math.pow(1 + r, remainingMonths);
  return (principal * (r * rateFactor)) / (rateFactor - 1);
};

/**
 * Builds the full amortization schedule.
 *
 * @param {{
 *   loanAmount: number,
 *   interestRate: number,
 *   calcMode: 'years' | 'rate',
 *   targetYears: number,
 *   monthlyRate: number,
 *   specialPaymentPercent: number,
 *   specialPaymentMonth: number,
 *   startYear: number,
 *   startMonth: number,
 * }} params
 * @returns {{ schedule: object[], monthsTotal: number, totalInterest: number, totalSpecialPayments: number, initialRate: number, finalRate: number } | { error: string }}
 */
export const buildAmortizationSchedule = (params) => {
  const {
    loanAmount,
    interestRate,
    calcMode,
    targetYears,
    monthlyRate,
    specialPaymentPercent,
    specialPaymentMonth,
    startYear,
    startMonth,
  } = params;

  let balance = loanAmount;
  const rate = interestRate / 100;
  const targetMonths = targetYears * 12;
  const specialPaymentAmt = (loanAmount * specialPaymentPercent) / 100;

  let currentMonth = startMonth;
  let currentYear = startYear;

  let result = [];
  let yearlySums = { zins: 0, tilgung: 0, sondertilgung: 0, gesamt: 0 };
  let monthCounter = 0;
  const MAX_MONTHS = 1200; // Guard against infinite loops (100 years)

  const initialCalculatedRate = calculateAnnuityRate(loanAmount, rate, targetMonths);

  while (balance > 0.001 && monthCounter < MAX_MONTHS) {
    monthCounter++;

    // Determine active monthly payment
    let activeRate = 0;
    if (calcMode === "years") {
      const remainingMonths = targetMonths - monthCounter + 1;
      activeRate = calculateAnnuityRate(balance, rate, remainingMonths);
    } else {
      activeRate = monthlyRate;
    }

    // Plausibility check: rate must at least cover current interest
    let interest = (balance * rate) / 12;
    if (activeRate <= interest && specialPaymentAmt === 0) {
      return {
        error:
          "Die monatliche Rate ist zu gering, um die Zinsen zu decken. Das Darlehen würde nie getilgt werden.",
      };
    }

    // Special payment applies after the first 12 months
    let isSpecialMonth = currentMonth === specialPaymentMonth && monthCounter > 12;
    let currentSpecialPayment = isSpecialMonth ? specialPaymentAmt : 0;

    let totalPlannedPayment = activeRate + currentSpecialPayment;
    let actualPayment = 0;
    let actualInterest = interest;
    let actualPrincipal = 0;
    let actualSpecialPayment = 0;

    if (balance + interest <= totalPlannedPayment) {
      // Final month: clear remaining balance
      actualPayment = balance + interest;
      actualInterest = interest;
      actualPrincipal = balance;
      actualSpecialPayment =
        balance + interest <= activeRate ? 0 : balance + interest - activeRate;
      balance = 0;
    } else {
      actualPayment = activeRate + currentSpecialPayment;
      actualPrincipal = activeRate - interest;
      actualSpecialPayment = currentSpecialPayment;
      balance = balance - actualPrincipal - actualSpecialPayment;
    }

    result.push({
      type: "month",
      month: currentMonth,
      year: currentYear,
      dateStr: `${String(currentMonth).padStart(2, "0")}.${currentYear}`,
      payment: actualPayment,
      interest: actualInterest,
      principal: actualPrincipal,
      specialPayment: actualSpecialPayment,
      balance: Math.max(0, balance),
      monthsElapsed: monthCounter,
      calculatedRate: activeRate,
    });

    yearlySums.zins += actualInterest;
    yearlySums.tilgung += actualPrincipal;
    yearlySums.sondertilgung += actualSpecialPayment;
    yearlySums.gesamt += actualPayment;

    // Append yearly summary at year-end or after full repayment
    if (currentMonth === 12 || balance <= 0) {
      result.push({
        type: "year-summary",
        year: currentYear,
        interest: yearlySums.zins,
        principal: yearlySums.tilgung,
        specialPayment: yearlySums.sondertilgung,
        total: yearlySums.gesamt,
      });
      yearlySums = { zins: 0, tilgung: 0, sondertilgung: 0, gesamt: 0 };
    }

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  if (monthCounter >= MAX_MONTHS) {
    return {
      error:
        "Berechnung abgebrochen. Laufzeit überschreitet 100 Jahre. Bitte Parameter anpassen.",
    };
  }

  const totals = result.reduce(
    (acc, row) => {
      if (row.type === "month") {
        acc.interest += row.interest;
        acc.special += row.specialPayment;
      }
      return acc;
    },
    { interest: 0, special: 0 },
  );

  return {
    schedule: result,
    monthsTotal: monthCounter,
    totalInterest: totals.interest,
    totalSpecialPayments: totals.special,
    initialRate: calcMode === "years" ? initialCalculatedRate : monthlyRate,
    finalRate: result[result.length - 2]?.calculatedRate || 0,
  };
};
