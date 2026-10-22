'use client';

import { useMemo, useState } from 'react';
import { compute, minDownPayment } from '@/lib/calc';
import { digits } from '@/lib/format';

const toLatin = (s) => String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const parse = (s) => Number(toLatin(s).replace(/[^\d.]/g, '')) || 0;

export default function Calculator({ lang, t }) {
  const fa = lang === 'fa';
  const fmt = (n) => digits(Math.round(n).toLocaleString('en-US'), lang);
  const cur = (n) => (fa ? `${fmt(n)} دلار` : `$${fmt(n)}`);
  const pct = (n, d = 1) => digits(Number(n).toFixed(d).replace(/\.0+$/, ''), lang) + (fa ? '٪' : '%');

  const [price, setPrice] = useState('900,000');
  const [mode, setMode] = useState('down');
  const [downPct, setDownPct] = useState(10);
  const [loan, setLoan] = useState('810,000');
  const [rate, setRate] = useState('4.5');
  const [years, setYears] = useState(25);
  const [ftb, setFtb] = useState(true);
  const [toronto, setToronto] = useState(true);
  const [other, setOther] = useState('3,000');

  const p = parse(price);
  const loanNum = parse(loan);
  const loanTooBig = mode === 'loan' && loanNum > p;
  const down = mode === 'loan' ? Math.max(0, p - Math.min(loanNum, p)) : (p * downPct) / 100;
  const r = useMemo(
    () => compute({ price: p, down, rate: parse(rate), years, ftb, toronto, other: parse(other) }),
    [p, down, rate, years, ftb, toronto, other]
  );
  const actualPct = p ? (down / p) * 100 : 0;
  const minPct = p ? Math.ceil((minDownPayment(p) / p) * 1000) / 10 : 5;

  const money = (setter) => (e) => {
    const n = parse(e.target.value);
    setter(n ? n.toLocaleString('en-US') : '');
  };

  const Row = ({ label, value, note, minus, strong }) => (
    <div className={`c-row${strong ? ' strong' : ''}`}>
      <span>{label}{note && <small>{note}</small>}</span>
      <b dir="ltr">{minus ? '−' : ''}{value}</b>
    </div>
  );

  return (
    <div className="calc">
      <div className="card-form c-inputs">
        <div className="field">
          <label htmlFor="cPrice">{t.cPrice}</label>
          <div className="money-in" dir="ltr"><span>$</span><input id="cPrice" inputMode="numeric" value={price} onChange={money(setPrice)} /></div>
        </div>
        <div className="field">
          <span className="flabel">{t.cMode}</span>
          <div className="seg" role="group" aria-label={t.cMode}>
            <button type="button" aria-pressed={mode === 'down'} onClick={() => setMode('down')}>{t.cModeDown}</button>
            <button
              type="button"
              aria-pressed={mode === 'loan'}
              onClick={() => {
                setLoan(Math.round(p - down).toLocaleString('en-US'));
                setMode('loan');
              }}
            >
              {t.cModeLoan}
            </button>
          </div>
        </div>
        {mode === 'down' ? (
          <div className="field">
            <label htmlFor="cDown">{t.cDown}: <b>{pct(downPct)}</b> · <b>{cur(down)}</b></label>
            <input id="cDown" type="range" min="5" max="50" step="0.5" value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} dir="ltr" />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="cLoan">{t.cLoan}</label>
            <div className="money-in" dir="ltr"><span>$</span><input id="cLoan" inputMode="numeric" value={loan} onChange={money(setLoan)} /></div>
            <p className="hint" style={{ margin: 0 }}>{t.cLoanHint.replace('{d}', cur(down)).replace('{p}', pct(actualPct))}</p>
            {loanTooBig && <p className="warn">{t.cLoanTooBig}</p>}
          </div>
        )}
        {r.belowMin && <p className="warn" style={{ marginTop: -6 }}>{t.cMinDown.replace('{m}', `${cur(r.minDown)} (${pct(minPct)})`)}</p>}
        {!r.insurable && actualPct < 20 && <p className="warn" style={{ marginTop: -6 }}>{t.cNoInsure}</p>}
        <div className="grid2">
          <div className="field">
            <label htmlFor="cRate">{t.cRate}</label>
            <div className="money-in" dir="ltr"><input id="cRate" inputMode="decimal" value={rate} onChange={(e) => setRate(toLatin(e.target.value).replace(/[^\d.]/g, ''))} /><span>%</span></div>
          </div>
          <div className="field">
            <label htmlFor="cYears">{t.cAmort}</label>
            <select id="cYears" value={years} onChange={(e) => setYears(Number(e.target.value))}>
              {[25, 30].map((y) => <option key={y} value={y}>{t.cYears.replace('{n}', digits(y, lang))}</option>)}
            </select>
          </div>
        </div>
        {years === 30 && <p className="hint">{t.c30}</p>}
        <label className="check"><input type="checkbox" checked={ftb} onChange={(e) => setFtb(e.target.checked)} /><span>{t.cFtb}</span></label>
        <label className="check"><input type="checkbox" checked={toronto} onChange={(e) => setToronto(e.target.checked)} /><span>{t.cToronto}</span></label>
        <div className="field">
          <label htmlFor="cOther">{t.cOther} <small>({t.cOtherHint})</small></label>
          <div className="money-in" dir="ltr"><span>$</span><input id="cOther" inputMode="numeric" value={other} onChange={money(setOther)} /></div>
        </div>
      </div>

      <div className="c-out">
        <div className="c-big">
          <span>{t.cMonthly}</span>
          <strong dir="ltr">{cur(r.monthly)}</strong>
          <small>{t.cStress.replace('{r}', digits(r.stressRate.toFixed(2), lang)).replace('{p}', cur(r.stressMonthly))}</small>
        </div>
        <div className="c-list">
          <Row label={t.cMortgage} value={cur(r.mortgage)} strong />
          {r.premium > 0 && <Row label={`${t.cInsurance} · ${pct(r.insRate * 100, 2)}`} note={t.cInsuranceNote} value={cur(r.premium)} />}
        </div>
        <div className="c-list">
          <h3>{t.cBreakdown}</h3>
          <Row label={t.cDownOut} value={cur(r.down)} />
          <Row label={t.cLttOn} value={cur(r.lttOn)} />
          {r.rebateOn > 0 && <Row label={t.cRebateOn} value={cur(r.rebateOn)} minus />}
          {toronto && <Row label={t.cLttTo} value={cur(r.lttTo)} />}
          {r.rebateTo > 0 && <Row label={t.cRebateTo} value={cur(r.rebateTo)} minus />}
          {r.pst > 0 && <Row label={t.cPst} value={cur(r.pst)} />}
          <Row label={t.cOtherOut} value={cur(r.otherCosts)} />
          <Row label={t.cCash} value={cur(r.cash)} strong />
        </div>
        <p className="g-disc">{t.cDisclaimer}</p>
      </div>
    </div>
  );
}
