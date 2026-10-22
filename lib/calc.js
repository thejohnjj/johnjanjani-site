// Ontario home-buying math, rules as of October 2026.

function brackets(price, table) {
  let tax = 0;
  let prev = 0;
  for (const [limit, rate] of table) {
    if (price > prev) tax += (Math.min(price, limit) - prev) * rate;
    prev = limit;
  }
  return Math.round(tax * 100) / 100;
}

const ONTARIO = [
  [55000, 0.005],
  [250000, 0.01],
  [400000, 0.015],
  [2000000, 0.02],
  [Infinity, 0.025],
];

// City of Toronto, residential with one or two single-family residences, from April 1, 2026.
const TORONTO = [
  [55000, 0.005],
  [250000, 0.01],
  [400000, 0.015],
  [2000000, 0.02],
  [3000000, 0.025],
  [4000000, 0.044],
  [5000000, 0.0545],
  [10000000, 0.065],
  [20000000, 0.0755],
  [Infinity, 0.086],
];

export const ontarioLTT = (price) => brackets(price, ONTARIO);
export const torontoLTT = (price) => brackets(price, TORONTO);
export const ONTARIO_FTB_MAX = 4000;
export const TORONTO_FTB_MAX = 4475;

export function minDownPayment(price) {
  if (price >= 1500000) return price * 0.2;
  if (price <= 500000) return price * 0.05;
  return 25000 + (price - 500000) * 0.1;
}

// CMHC premium rate by loan-to-value; +0.20% for a 30-year amortization.
export function insuranceRate(ltv, years) {
  let r = 0;
  if (ltv > 0.9) r = 0.04;
  else if (ltv > 0.85) r = 0.031;
  else if (ltv > 0.8) r = 0.028;
  if (r && years > 25) r += 0.002;
  return r;
}

// Canadian fixed mortgages compound semi-annually.
export function monthlyPayment(principal, annualRatePct, years) {
  const n = years * 12;
  if (principal <= 0) return 0;
  const j = Math.pow(1 + annualRatePct / 100 / 2, 1 / 6) - 1;
  if (j === 0) return principal / n;
  return (principal * j) / (1 - Math.pow(1 + j, -n));
}

export function compute({ price, down, rate, years, ftb, toronto, other }) {
  price = Math.max(0, Number(price) || 0);
  down = Math.min(price, Math.max(0, Number(down) || 0));
  const minDown = minDownPayment(price);
  const base = price - down;
  const ltv = price ? base / price : 0;
  const insurable = price < 1500000;
  const needsInsurance = ltv > 0.8;
  const insRate = needsInsurance && insurable ? insuranceRate(ltv, years) : 0;
  const premium = Math.round(base * insRate);
  const pst = Math.round(premium * 0.08);
  const mortgage = base + premium;
  const monthly = monthlyPayment(mortgage, rate, years);
  const stressRate = Math.max(Number(rate) + 2, 5.25);
  const stressMonthly = monthlyPayment(mortgage, stressRate, years);
  const lttOn = ontarioLTT(price);
  const lttTo = toronto ? torontoLTT(price) : 0;
  const rebateOn = ftb ? Math.min(lttOn, ONTARIO_FTB_MAX) : 0;
  const rebateTo = ftb && toronto ? Math.min(lttTo, TORONTO_FTB_MAX) : 0;
  const otherCosts = Math.max(0, Number(other) || 0);
  const cash = down + lttOn + lttTo - rebateOn - rebateTo + pst + otherCosts;
  return {
    price, down, minDown, belowMin: down + 0.5 < minDown, insurable, needsInsurance,
    insRate, premium, pst, mortgage, monthly, stressRate, stressMonthly,
    lttOn, lttTo, rebateOn, rebateTo, otherCosts, cash,
  };
}
