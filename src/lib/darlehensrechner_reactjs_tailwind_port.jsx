import React, { useState, useMemo } from 'react';
import { Calculator, Calendar, DollarSign, Percent, AlertCircle, Clock, CheckCircle2, Info, TrendingDown } from 'lucide-react';

const Kreditrechner = () => {
  // --- STATE FÜR BERECHNUNGSMODUS ---
  const [calcMode, setCalcMode] = useState('years'); // 'years' = Wunschlaufzeit (Dynamische Rate), 'rate' = Feste Monatsrate

  // --- STATE FÜR EINGABEN ---
  const [loanAmount, setLoanAmount] = useState(188000);
  const [interestRate, setInterestRate] = useState(0.9);
  const [targetYears, setTargetYears] = useState(10); // Jahre bis zur Volltilgung (wie im Beleg standardmäßig 10)
  const [monthlyRate, setMonthlyRate] = useState(1640.30); // Manuelle Rate (falls Modus 'rate')
  const [specialPaymentPercent, setSpecialPaymentPercent] = useState(5.0); // 5% Sondertilgung
  const [specialPaymentMonth, setSpecialPaymentMonth] = useState(6); // 6 = Juni
  const [startYear, setStartYear] = useState(2026);
  const [startMonth, setStartMonth] = useState(1); // Januar 2026 als passender Start

  // --- HILFSFUNKTIONEN ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getMonthName = (monthIndex) => {
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return months[monthIndex - 1];
  };

  // --- FORMEL FÜR DIE ANNUITÄTENRATE (PMT) ---
  const calculateAnnuityRate = (principal, annualRate, remainingMonths) => {
    if (remainingMonths <= 0 || principal <= 0) return 0;
    if (annualRate === 0) return principal / remainingMonths;
    
    const r = annualRate / 12;
    const rateFactor = Math.pow(1 + r, remainingMonths);
    return principal * (r * rateFactor) / (rateFactor - 1);
  };

  // --- GENERIERUNG DES TILGUNGSPLANS ---
  const schedule = useMemo(() => {
    let balance = parseFloat(loanAmount);
    const rate = parseFloat(interestRate) / 100;
    const targetMonths = parseInt(targetYears) * 12;
    const specialPaymentAmt = (parseFloat(loanAmount) * parseFloat(specialPaymentPercent)) / 100;
    
    let currentMonth = parseInt(startMonth);
    let currentYear = parseInt(startYear);
    
    let result = [];
    let yearlySums = { zins: 0, tilgung: 0, sondertilgung: 0, gesamt: 0 };
    let monthCounter = 0;
    const MAX_MONTHS = 1200; // Schutz vor Endlosschleife

    // Merken der initial berechneten Rate für die Anzeige in der Statistik
    const initialCalculatedRate = calculateAnnuityRate(parseFloat(loanAmount), rate, targetMonths);

    while (balance > 0.001 && monthCounter < MAX_MONTHS) {
      monthCounter++;
      
      // 1. Monatliche Rate für diesen Monat bestimmen
      let activeRate = 0;
      if (calcMode === 'years') {
        // Restlaufzeit in Monaten für diesen Berechnungsschritt
        const remainingMonths = targetMonths - monthCounter + 1;
        // Dynamische Neuberechnung der Rate basierend auf der aktuellen Restschuld!
        activeRate = calculateAnnuityRate(balance, rate, remainingMonths);
      } else {
        activeRate = parseFloat(monthlyRate);
      }

      // Plausibilitätsprüfung
      let interest = balance * rate / 12;
      if (activeRate <= interest && specialPaymentAmt === 0) {
        return { error: "Die monatliche Rate ist zu gering, um die Zinsen zu decken. Das Darlehen würde nie getilgt werden." };
      }

      // 2. Sondertilgung prüfen (erst nach Ablauf des ersten Jahres = nach 12 Monaten)
      let isSpecialMonth = currentMonth === parseInt(specialPaymentMonth) && monthCounter > 12;
      let currentSpecialPayment = isSpecialMonth ? specialPaymentAmt : 0;

      // Rate anpassen, falls die Restschuld inkl. Zinsen kleiner als die geplante Zahlung ist
      let totalPlannedPayment = activeRate + currentSpecialPayment;
      let actualPayment = 0;
      let actualInterest = interest;
      let actualPrincipal = 0;
      let actualSpecialPayment = 0;

      if (balance + interest <= totalPlannedPayment) {
        // Letzter Monat: Vollständige Tilgung der Restschuld
        actualPayment = balance + interest;
        actualInterest = interest;
        actualPrincipal = balance;
        
        if (balance + interest <= activeRate) {
          actualSpecialPayment = 0;
        } else {
          actualSpecialPayment = (balance + interest) - activeRate;
        }
        balance = 0;
      } else {
        // Regulärer Monat
        actualPayment = activeRate + currentSpecialPayment;
        actualPrincipal = activeRate - interest;
        actualSpecialPayment = currentSpecialPayment;
        balance = balance - actualPrincipal - actualSpecialPayment;
      }

      // Monat abspeichern
      result.push({
        type: 'month',
        month: currentMonth,
        year: currentYear,
        dateStr: `${String(currentMonth).padStart(2, '0')}.${currentYear}`,
        payment: actualPayment,
        interest: actualInterest,
        principal: actualPrincipal,
        specialPayment: actualSpecialPayment,
        balance: Math.max(0, balance),
        monthsElapsed: monthCounter,
        calculatedRate: activeRate // Speichern für die tabellarische Verfolgung der Ratenreduktion
      });

      // Summen für das laufende Jahr addieren
      yearlySums.zins += actualInterest;
      yearlySums.tilgung += actualPrincipal;
      yearlySums.sondertilgung += actualSpecialPayment;
      yearlySums.gesamt += actualPayment;

      // Jahreswechsel oder Volltilgung -> Zwischensumme einfügen
      if (currentMonth === 12 || balance <= 0) {
        result.push({
          type: 'year-summary',
          year: currentYear,
          interest: yearlySums.zins,
          principal: yearlySums.tilgung,
          specialPayment: yearlySums.sondertilgung,
          total: yearlySums.gesamt
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
       return { error: "Berechnung abgebrochen. Laufzeit überschreitet 100 Jahre. Bitte Parameter anpassen." };
    }

    // Statistiken berechnen
    const totals = result.reduce((acc, row) => {
      if (row.type === 'month') {
        acc.interest += row.interest;
        acc.special += row.specialPayment;
      }
      return acc;
    }, { interest: 0, special: 0 });

    return { 
      schedule: result, 
      monthsTotal: monthCounter,
      totalInterest: totals.interest,
      totalSpecialPayments: totals.special,
      initialRate: calcMode === 'years' ? initialCalculatedRate : parseFloat(monthlyRate),
      finalRate: result[result.length - 2]?.calculatedRate || 0 // Letzter regulärer Monat vor der Schlussrate
    };
  }, [calcMode, loanAmount, interestRate, targetYears, monthlyRate, specialPaymentPercent, specialPaymentMonth, startYear, startMonth]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
            <Calculator className="h-8 w-8 text-blue-600" />
            Kreditrechner mit dynamischer Ratenreduktion
          </h1>
          <p className="mt-2 text-gray-600">Simuliere Ratenreduzierungen nach Sondertilgungen bei gleichbleibender Laufzeit.</p>
        </div>

        {/* INFOBOX FÜR DYNAMISCHES MODELL */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-sm text-blue-900 block">Dynamische Ratenreduktion aktiv (Standard):</span>
            <span className="text-xs text-blue-800">
              Nach jeder Sondertilgung sinkt deine Restschuld. Die Applikation berechnet die monatliche Rate am Folgemonat automatisch neu auf Basis der Restlaufzeit. 
              <strong> Ergebnis: Deine monatliche Belastung sinkt nach jeder Sondertilgung spürbar!</strong>
            </span>
          </div>
        </div>

        {/* MODUS-SCHALTER */}
        <div className="flex justify-center">
          <div className="bg-gray-200 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setCalcMode('years')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                calcMode === 'years' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dynamische Rate (Wunschlaufzeit)
            </button>
            <button
              onClick={() => setCalcMode('rate')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                calcMode === 'rate' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Konstante Rate (Laufzeitverkürzung)
            </button>
          </div>
        </div>

        {/* STATISTIK-INFOKARTEN */}
        {!schedule.error && schedule.schedule && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-sm text-gray-500 font-medium">Anfängliche Monatsrate</span>
              <span className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(schedule.initialRate)}</span>
              <span className="text-xs text-gray-400 mt-1">Regulärer Startwert</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-sm text-gray-500 font-medium">Letzte Monatsrate (ca.)</span>
              <span className="text-2xl font-bold text-indigo-600 mt-2">
                {calcMode === 'years' ? formatCurrency(schedule.finalRate) : formatCurrency(schedule.initialRate)}
              </span>
              <span className="text-xs text-gray-400 mt-1">Dank Ratenreduktion gesunken</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-sm text-gray-500 font-medium">Gezahlte Zinsen gesamt</span>
              <span className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(schedule.totalInterest)}</span>
              <span className="text-xs text-gray-400 mt-1">Zinskosten über die Gesamtlaufzeit</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-sm text-gray-500 font-medium">Summe Sondertilgungen</span>
              <span className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(schedule.totalSpecialPayments)}</span>
              <span className="text-xs text-gray-400 mt-1">Eingezahlte Sonderzahlungen</span>
            </div>
          </div>
        )}

        {/* INPUTS PANEL */}
        <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kreditbetrag (€)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} 
                className="pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sollzinssatz p.a. (%)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Percent className="h-5 w-5 text-gray-400" />
              </div>
              <input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
                className="pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          {/* DYNAMISCHER INPUT JE NACH MODUS */}
          {calcMode === 'years' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wunschlaufzeit (Jahre)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="number" min="1" max="60" value={targetYears} onChange={(e) => setTargetYears(e.target.value)}
                  className="pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monatliche Rate (€)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)}
                  className="pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sondertilgung (% vom Kredit)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Percent className="h-5 w-5 text-gray-400" />
              </div>
              <input type="number" step="0.1" value={specialPaymentPercent} onChange={(e) => setSpecialPaymentPercent(e.target.value)}
                className="pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Entspricht {formatCurrency((loanAmount * specialPaymentPercent) / 100)} jährlich.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monat der Sondertilgung</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select value={specialPaymentMonth} onChange={(e) => setSpecialPaymentMonth(e.target.value)}
                className="pl-10 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500">
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startmonat</label>
                <input type="number" min="1" max="12" value={startMonth} onChange={(e) => setStartMonth(e.target.value)}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startjahr</label>
                <input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)}
                  className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border focus:ring-blue-500 focus:border-blue-500" />
             </div>
          </div>

        </div>

        {/* FEHLERMELDUNG */}
        {schedule.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">{schedule.error}</p>
          </div>
        )}

        {/* TILGUNGSPLAN TABELLE */}
        {!schedule.error && schedule.schedule && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center">
              <h2 className="text-lg font-semibold">Detaillierter Tilgungsplan</h2>
              <span className="text-sm bg-gray-700 px-3 py-1 rounded-full">
                Laufzeit: {Math.floor(schedule.monthsTotal / 12)} Jahre, {schedule.monthsTotal % 12} Monate
              </span>
            </div>
            
            <div className="overflow-x-auto h-150 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Monatliche Rate (Basis)</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Zinsen</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Tilgung</th>
                    <th className="px-6 py-3 text-right font-medium text-blue-600 uppercase tracking-wider">Sondertilgung</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Zahlung Gesamt</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Restkapital</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule.schedule.map((row, index) => {
                    
                    if (row.type === 'year-summary') {
                      return (
                        <tr key={`sum-${index}`} className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                          <td className="px-6 py-3 text-left text-blue-800">Summe {row.year}</td>
                          <td className="px-6 py-3"></td>
                          <td className="px-6 py-3 text-right text-blue-800">{formatCurrency(row.interest)}</td>
                          <td className="px-6 py-3 text-right text-blue-800">{formatCurrency(row.principal)}</td>
                          <td className="px-6 py-3 text-right text-blue-800">{formatCurrency(row.specialPayment)}</td>
                          <td className="px-6 py-3 text-right text-blue-800">{formatCurrency(row.total)}</td>
                          <td className="px-6 py-3"></td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={`month-${index}`} className={row.specialPayment > 0 ? "bg-green-50" : "hover:bg-gray-50"}>
                        <td className="px-6 py-2 whitespace-nowrap text-gray-900 font-medium">
                          {row.dateStr}
                          {row.monthsElapsed <= 12 && row.month === parseInt(specialPaymentMonth) && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-medium bg-amber-100 text-amber-800" title="Gesperrt im 1. Jahr">
                              Sperre
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right text-gray-600">
                          {formatCurrency(row.calculatedRate)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right text-red-600">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right text-green-600">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right text-blue-600 font-medium">
                          {row.specialPayment > 0 ? formatCurrency(row.specialPayment) : '-'}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right text-gray-900 font-semibold">
                          {formatCurrency(row.payment)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right font-bold text-gray-900">
                          {formatCurrency(row.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Kreditrechner;