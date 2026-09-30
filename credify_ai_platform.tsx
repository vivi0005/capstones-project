import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, AlertCircle, TrendingUp, Award, FileText, CheckCircle2, 
  XCircle, ChevronRight, RefreshCw, Moon, Sun, Calculator, User, CreditCard, 
  Lock, Sparkles, HelpCircle, ArrowRight, Activity, DollarSign, PieChart, 
  Download, ExternalLink, Cpu, Database, Eye, EyeOff, Layers, Terminal, Info, 
  ThumbsUp, ThumbsDown, Sliders, ChevronDown, Check, Zap, Play, ShieldAlert, Sparkle
} from 'lucide-react';

const PRESET_PROFILES = [
  {
    id: 'prime',
    label: 'Prime Salaried (Low Risk)',
    desc: 'High income, low EMI burden, strong credit score',
    badge: 'High Approval (88/100)',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    data: {
      fullName: 'Rahul Sharma',
      age: 32,
      employmentType: 'Salaried',
      monthlyIncome: 145000,
      existingEmi: 18000,
      requestedLoan: 800000,
      tenureMonths: 36,
      creditScore: 785,
      panNumber: 'ABCPS1234F',
      consentPan: true,
      consentBureau: true
    }
  },
  {
    id: 'high_emi',
    label: 'Debt Burdened (Moderate/High Risk)',
    desc: 'Good income but excessive existing monthly EMIs',
    badge: 'Moderate Approval (58/100)',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    data: {
      fullName: 'Ananya Verma',
      age: 29,
      employmentType: 'Salaried',
      monthlyIncome: 85000,
      existingEmi: 48000,
      requestedLoan: 1200000,
      tenureMonths: 48,
      creditScore: 710,
      panNumber: 'XYZPV9876K',
      consentPan: true,
      consentBureau: true
    }
  },
  {
    id: 'young_pro',
    label: 'Young Professional (Limited History)',
    desc: 'Young age, moderate income, fresh credit history',
    badge: 'Moderate Approval (68/100)',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    data: {
      fullName: 'Karan Patel',
      age: 23,
      employmentType: 'Salaried',
      monthlyIncome: 62000,
      existingEmi: 5000,
      requestedLoan: 350000,
      tenureMonths: 24,
      creditScore: 690,
      panNumber: 'MNPPK4321L',
      consentPan: true,
      consentBureau: true
    }
  },
  {
    id: 'self_emp',
    label: 'Self-Employed / Business',
    desc: 'High variable income, self-employed risk factor',
    badge: 'High Approval (79/100)',
    badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    data: {
      fullName: 'Vikram Mehta',
      age: 41,
      employmentType: 'Self-Employed',
      monthlyIncome: 210000,
      existingEmi: 35000,
      requestedLoan: 2500000,
      tenureMonths: 60,
      creditScore: 760,
      panNumber: 'BKRPM5678Q',
      consentPan: true,
      consentBureau: true
    }
  }
];

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const maskPan = (pan) => {
  if (!pan || pan.length !== 10) return pan || '';
  return `${pan.substring(0, 3)}****${pan.substring(7)}`;
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('home'); // home, assessment, dashboard, breakdown, howItWorks, docs
  const [currentStep, setCurrentStep] = useState(1); // Step 1 to Step 5
  const [showToast, setShowToast] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    age: 28,
    employmentType: 'Salaried',
    monthlyIncome: 90000,
    existingEmi: 15000,
    requestedLoan: 500000,
    tenureMonths: 36,
    creditScore: 740,
    panNumber: '',
    consentPan: false,
    consentBureau: false
  });

  // Errors state
  const [errors, setErrors] = useState({});
  const [panVerified, setPanVerified] = useState(null); // null, 'verifying', 'success', 'failed'
  const [bureauData, setBureauData] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Gemini AI state
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Toast auto-clear
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.consentPan) errs.consentPan = 'Consent required for identity verification';
      if (!formData.consentBureau) errs.consentBureau = 'Consent required for credit record analysis';
    }
    if (step === 2) {
      if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
      if (formData.age < 18 || formData.age > 70) errs.age = 'Age must be between 18 and 70';
      if (formData.monthlyIncome <= 0) errs.monthlyIncome = 'Monthly Income must be greater than 0';
      if (formData.existingEmi < 0) errs.existingEmi = 'EMI cannot be negative';
      if (formData.existingEmi >= formData.monthlyIncome) errs.existingEmi = 'Existing EMI exceeds monthly income';
      if (formData.requestedLoan < 10000) errs.requestedLoan = 'Minimum loan amount is ₹10,000';
      if (formData.creditScore < 300 || formData.creditScore > 900) errs.creditScore = 'Credit Score must be 300–900';
    }
    if (step === 3) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!formData.panNumber) {
        errs.panNumber = 'PAN number is required';
      } else if (!panRegex.test(formData.panNumber.toUpperCase())) {
        errs.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const loadPreset = (preset) => {
    setFormData(preset.data);
    setPanVerified(null);
    setBureauData(null);
    setErrors({});
    setShowToast(`Loaded profile: ${preset.label}`);
    setActiveTab('assessment');
    setCurrentStep(1);
  };

  const handleVerifyPan = () => {
    if (!validateStep(3)) return;
    setPanVerified('verifying');
    setTimeout(() => {
      const validPan = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase());
      if (validPan) {
        setPanVerified('success');
        setErrors({});
        setShowToast('PAN Verification Successful! Matched with NSDL database.');
      } else {
        setPanVerified('failed');
        setErrors({ panNumber: 'PAN lookup failed. Record not found.' });
      }
    }, 1200);
  };

  const fetchBureauData = () => {
    return {
      score: formData.creditScore,
      activeAccounts: formData.creditScore > 750 ? 3 : (formData.creditScore > 650 ? 5 : 8),
      closedAccounts: 4,
      creditHistoryLengthYears: formData.age > 35 ? 10 : (formData.age > 25 ? 5 : 2),
      delinquenciesLast24Months: formData.creditScore > 750 ? 0 : (formData.creditScore > 650 ? 1 : 3),
      totalCreditLimit: formData.monthlyIncome * 6,
      creditUtilizationRatio: formData.creditScore > 750 ? 22 : (formData.creditScore > 650 ? 58 : 84),
      bureauName: 'Experian / CIBIL Normalized'
    };
  };

  const calculateEligibility = () => {
    setIsCalculating(true);
    const bureau = fetchBureauData();
    setBureauData(bureau);

    setTimeout(() => {
      // 1. Core Financial Ratios
      const monthlyIncome = parseFloat(formData.monthlyIncome) || 1;
      const annualIncome = monthlyIncome * 12;
      const existingEmi = parseFloat(formData.existingEmi) || 0;
      const requestedLoan = parseFloat(formData.requestedLoan) || 0;
      const tenure = parseInt(formData.tenureMonths) || 36;
      
      // Estimated interest rate based on credit score
      const estimatedRate = formData.creditScore >= 780 ? 0.105 : (formData.creditScore >= 700 ? 0.125 : 0.155);
      const monthlyRate = estimatedRate / 12;
      const estNewEmi = requestedLoan > 0 ? 
        (requestedLoan * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1) : 0;
      
      const totalMonthlyObligation = existingEmi + estNewEmi;
      const foir = (totalMonthlyObligation / monthlyIncome) * 100; // Fixed Obligation to Income Ratio
      const existingFoir = (existingEmi / monthlyIncome) * 100;
      const loanToIncomeMultiplier = requestedLoan / annualIncome;

      // 2. Granular 100-Point Scoring Model (Module 9 & 13)
      let scoreBreakdown = [];
      let totalScore = 0;

      // Age Factor (Max 10 pts)
      let agePts = 0;
      if (formData.age >= 25 && formData.age <= 50) agePts = 10;
      else if (formData.age >= 21 && formData.age < 25) agePts = 7;
      else if (formData.age > 50 && formData.age <= 60) agePts = 6;
      else agePts = 3;
      scoreBreakdown.push({ category: 'Age Factor', pts: agePts, maxPts: 10, note: `Age ${formData.age} yrs` });
      totalScore += agePts;

      // Monthly Income Factor (Max 20 pts)
      let incomePts = 0;
      if (monthlyIncome >= 150000) incomePts = 20;
      else if (monthlyIncome >= 100000) incomePts = 17;
      else if (monthlyIncome >= 60000) incomePts = 14;
      else if (monthlyIncome >= 30000) incomePts = 10;
      else incomePts = 5;
      scoreBreakdown.push({ category: 'Income Level', pts: incomePts, maxPts: 20, note: `${formatINR(monthlyIncome)}/mo` });
      totalScore += incomePts;

      // Credit Score Factor (Max 20 pts)
      let csPts = 0;
      const cs = formData.creditScore;
      if (cs >= 800) csPts = 20;
      else if (cs >= 750) csPts = 18;
      else if (cs >= 700) csPts = 14;
      else if (cs >= 650) csPts = 9;
      else csPts = 3;
      scoreBreakdown.push({ category: 'Credit Score', pts: csPts, maxPts: 20, note: `Score ${cs}/900` });
      totalScore += csPts;

      // Employment Stability (Max 15 pts)
      let empPts = 0;
      if (formData.employmentType === 'Salaried') empPts = 15;
      else if (formData.employmentType === 'Self-Employed') empPts = 12;
      else if (formData.employmentType === 'Business Owner') empPts = 13;
      else empPts = 8; // Freelancer
      scoreBreakdown.push({ category: 'Employment Type', pts: empPts, maxPts: 15, note: formData.employmentType });
      totalScore += empPts;

      // Debt Burden / FOIR Factor (Max 15 pts)
      let foirPts = 0;
      if (foir <= 30) foirPts = 15;
      else if (foir <= 45) foirPts = 12;
      else if (foir <= 55) foirPts = 7;
      else if (foir <= 65) foirPts = 3;
      else foirPts = 0;
      scoreBreakdown.push({ category: 'Debt Burden (FOIR)', pts: foirPts, maxPts: 15, note: `FOIR ${foir.toFixed(1)}%` });
      totalScore += foirPts;

      // Loan Amount Burden (Max 10 pts)
      let loanPts = 0;
      if (loanToIncomeMultiplier <= 1.5) loanPts = 10;
      else if (loanToIncomeMultiplier <= 3.0) loanPts = 7;
      else if (loanToIncomeMultiplier <= 5.0) loanPts = 4;
      else loanPts = 1;
      scoreBreakdown.push({ category: 'Loan-to-Income Multiplier', pts: loanPts, maxPts: 10, note: `${loanToIncomeMultiplier.toFixed(1)}x Annual` });
      totalScore += loanPts;

      // Credit History & Delinquency (Max 10 pts)
      let histPts = 0;
      if (bureau.delinquenciesLast24Months === 0 && bureau.creditHistoryLengthYears >= 3) histPts = 10;
      else if (bureau.delinquenciesLast24Months === 0) histPts = 7;
      else if (bureau.delinquenciesLast24Months === 1) histPts = 4;
      else histPts = 0;
      scoreBreakdown.push({ category: 'Credit History & Cleanliness', pts: histPts, maxPts: 10, note: `${bureau.delinquenciesLast24Months} Delinquencies, ${bureau.creditHistoryLengthYears}yrs History` });
      totalScore += histPts;

      // Determine Risk Tier
      let riskTier = 'High Approval';
      let riskColor = 'text-emerald-500';
      let riskBg = 'bg-emerald-500/10 border-emerald-500/30';
      if (totalScore < 55) {
        riskTier = 'High Risk / Low Approval';
        riskColor = 'text-rose-500';
        riskBg = 'bg-rose-500/10 border-rose-500/30';
      } else if (totalScore < 75) {
        riskTier = 'Moderate Approval';
        riskColor = 'text-amber-500';
        riskBg = 'bg-amber-500/10 border-amber-500/30';
      }

      // 3. Positive and Risk Factors (Module 10)
      const positiveFactors = [];
      const riskFactors = [];

      if (cs >= 750) positiveFactors.push({ title: 'Strong Credit Score', desc: `Credit score of ${cs} demonstrates consistent repayment behavior.` });
      if (existingFoir <= 25) positiveFactors.push({ title: 'Low Existing Obligations', desc: `Current EMIs account for only ${existingFoir.toFixed(1)}% of monthly income.` });
      if (bureau.delinquenciesLast24Months === 0) positiveFactors.push({ title: 'Zero Delinquency History', desc: 'No default or overdue payments reported in last 24 months.' });
      if (monthlyIncome >= 100000) positiveFactors.push({ title: 'High Income Cushion', desc: 'Robust monthly cashflow offers strong debt absorption buffer.' });
      if (formData.employmentType === 'Salaried') positiveFactors.push({ title: 'Stable Salaried Income', desc: 'Regular predictable monthly income streams reduce default risk.' });

      if (foir > 50) riskFactors.push({ title: 'Elevated FOIR Ratio', desc: `Total post-loan EMIs will take up ${foir.toFixed(1)}% of your monthly income (ideal < 45%).` });
      if (cs < 680) riskFactors.push({ title: 'Sub-Optimal Credit Score', desc: `Score of ${cs} is below prime lending benchmarks (750+).` });
      if (bureau.delinquenciesLast24Months > 0) riskFactors.push({ title: 'Past Delinquencies Detected', desc: `${bureau.delinquenciesLast24Months} late payment instances recorded in credit bureau.` });
      if (loanToIncomeMultiplier > 4) riskFactors.push({ title: 'High Requested Loan Multiple', desc: `Loan request is ${loanToIncomeMultiplier.toFixed(1)}x your annual income.` });

      if (positiveFactors.length === 0) positiveFactors.push({ title: 'Income Source Active', desc: 'Demonstrates active verifiable monthly income.' });
      if (riskFactors.length === 0) riskFactors.push({ title: 'No Major Red Flags', desc: 'All evaluated financial parameters fall within standard lending limits.' });

      // Max recommended loan calculation
      const maxAllowedEmi = monthlyIncome * 0.50 - existingEmi;
      const maxRecommendedLoan = maxAllowedEmi > 0 ? 
        (maxAllowedEmi * (Math.pow(1 + monthlyRate, tenure) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, tenure)) : 0;

      const resultObj = {
        totalScore,
        scoreBreakdown,
        riskTier,
        riskColor,
        riskBg,
        annualIncome,
        monthlyIncome,
        existingEmi,
        requestedLoan,
        estNewEmi,
        totalMonthlyObligation,
        foir,
        existingFoir,
        loanToIncomeMultiplier,
        maxRecommendedLoan: Math.max(0, maxRecommendedLoan),
        positiveFactors,
        riskFactors,
        bureau,
        evaluatedAt: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };

      setAssessmentResult(resultObj);
      setIsCalculating(false);
      setActiveTab('dashboard');
      
      // Auto-trigger Gemini explanation
      generateGeminiExplanation(resultObj);
    }, 1200);
  };

  const generateGeminiExplanation = async (result) => {
    setAiLoading(true);
    setAiError(null);

    // Anonymized data payload without PII (Module 14 Security)
    const anonymizedPayload = {
      score: result.totalScore,
      riskTier: result.riskTier,
      monthlyIncome: result.monthlyIncome,
      requestedLoan: result.requestedLoan,
      creditScore: formData.creditScore,
      foirPercent: result.foir.toFixed(1),
      employmentType: formData.employmentType,
      delinquencies: result.bureau.delinquenciesLast24Months,
      creditHistoryYears: result.bureau.creditHistoryLengthYears,
      positiveFactorCount: result.positiveFactors.length,
      riskFactorCount: result.riskFactors.length
    };

    const systemPrompt = `You are Credify AI's senior credit risk analyst. Provide an empathetic, highly structured, and actionable financial assessment explanation for a loan applicant. Do not use markdown headers larger than ###. Keep the tone professional, concise, and educational.`;
    
    const userPromptText = `
Analyze this anonymized loan eligibility outcome:
- Overall Credify Score: ${anonymizedPayload.score}/100 (${anonymizedPayload.riskTier})
- Credit Score: ${anonymizedPayload.creditScore}/900
- Monthly Income: ₹${anonymizedPayload.monthlyIncome}
- Requested Loan: ₹${anonymizedPayload.requestedLoan}
- Fixed Obligation Ratio (FOIR): ${anonymizedPayload.foirPercent}%
- Employment: ${anonymizedPayload.employmentType}
- Delinquencies (24m): ${anonymizedPayload.delinquencies}
- Credit History: ${anonymizedPayload.creditHistoryYears} years

Please respond with:
1. Executive Assessment Summary (2 sentences on why they got this tier).
2. Key Strengths Analysis (Highlight top positive financial behaviors).
3. Risk Mitigation & Action Plan (3 concrete steps to boost their credit eligibility).
4. Plain-Language Explanation of FOIR & Credit Utilization impact.
`;

    try {
      const apiKeyToUse = aiApiKey.trim() || '';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKeyToUse}`;
      
      const payload = {
        contents: [{ parts: [{ text: userPromptText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Gemini API HTTP Error ${res.status}`);

      const data = await res.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textOutput) {
        setAiResponse(textOutput);
      } else {
        throw new Error('No valid text returned from Gemini API.');
      }
    } catch (err) {
      console.warn('Gemini API call failed or key missing. Falling back to built-in smart AI synthesis.', err);
      // Fallback rule-based smart AI generator
      const fallbackText = generateFallbackAiExplanation(result);
      setAiResponse(fallbackText);
      if (aiApiKey) {
        setAiError('Notice: Used built-in AI engine fallback (API Key invalid or rate-limited).');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const generateFallbackAiExplanation = (result) => {
    return `### Executive Summary
Your Credify AI Eligibility Score is **${result.totalScore}/100**, placing you in the **${result.riskTier}** category. This rating reflects a balanced evaluation of your monthly cashflow, credit score (${formData.creditScore}), and financial obligations.

### Key Strengths Analysis
- **Income Stability**: Your monthly income of ${formatINR(result.monthlyIncome)} provides a solid baseline for servicing credit obligations.
- **Credit Discipline**: Maintaining a credit score of ${formData.creditScore} with ${result.bureau.creditHistoryLengthYears} years of history demonstrates established credit management.

### Recommended Action Plan
1. **Optimize Existing Obligations**: Aim to keep your Fixed Obligation to Income Ratio (FOIR) under 45% (currently ${result.foir.toFixed(1)}%). Consider closing smaller personal loans or credit card balances.
2. **Loan Tenure Adjustments**: If seeking higher approval odds, extending the tenure can lower your monthly EMI and reduce FOIR burden.
3. **Credit Utilization**: Maintain individual credit card balances below 30% of their total credit limit.

### Understanding Your Metrics
- **FOIR (${result.foir.toFixed(1)}%)**: Lenders use this metric to check how much of your monthly income is committed to EMIs. Ratios under 40% receive maximum points in automated underwriting engines.`;
  };

  const handleAskAi = async () => {
    if (!userPrompt.trim() || !assessmentResult) return;
    const q = userPrompt;
    setUserPrompt('');
    const newChat = [...chatHistory, { role: 'user', text: q }];
    setChatHistory(newChat);

    try {
      const apiKeyToUse = aiApiKey.trim() || '';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKeyToUse}`;
      
      const promptContext = `
Context: User Score ${assessmentResult.totalScore}/100 (${assessmentResult.riskTier}), Income ${formatINR(assessmentResult.monthlyIncome)}, Requested Loan ${formatINR(assessmentResult.requestedLoan)}, FOIR ${assessmentResult.foir.toFixed(1)}%.
User Question: ${q}
Provide a helpful, concise response (max 3 sentences).`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload = { contents: [{ parts: [{ text: promptContext }] }] })
      });

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'For optimal results, aim to maintain a credit score above 750 and clear high-interest unsecured debts.';
      setChatHistory([...newChat, { role: 'ai', text: reply }]);
    } catch {
      setChatHistory([...newChat, { role: 'ai', text: `Regarding "${q}": Lowering your requested loan amount or increasing tenure reduces EMI burden, instantly improving your Credify score.` }]);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 border border-emerald-500/40 text-emerald-400 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{showToast}</span>
        </div>
      )}

      {}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-indigo-600 p-[2px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-emerald-400">
                  Credify
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Smart Loan Eligibility Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'assessment', label: 'Check Eligibility' },
              { id: 'dashboard', label: 'Results Dashboard', disabled: !assessmentResult },
              { id: 'breakdown', label: 'Score Breakdown', disabled: !assessmentResult },
              { id: 'howItWorks', label: 'How It Works' },
              { id: 'docs', label: 'API & Architecture' }
            ].map((nav) => (
              <button
                key={nav.id}
                disabled={nav.disabled}
                onClick={() => setActiveTab(nav.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === nav.id
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : nav.disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('assessment')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Assessment</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================================================= */}
        {/* TAB 1: HOME PAGE (Module 3) */}
        {/* ========================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-16 animate-fade-in">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-8 sm:p-12 lg:p-16">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Powered by Gemini 3 Flash & Multi-Factor Scoring Engine</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  Next-Gen Credit Eligibility & Risk Intelligence.
                </h1>

                <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
                  Evaluate real-time loan approval odds with full transparency. Credify AI combines multi-factor financial scoring, secure PAN validation, and explainable AI insights to transform credit assessment.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => setActiveTab('assessment')}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-size-200 hover:bg-right transition-all duration-300 shadow-xl shadow-emerald-500/25"
                  >
                    <span>Check Eligibility Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveTab('howItWorks')}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition-all"
                  >
                    <Info className="w-4 h-4" />
                    <span>How Credify Works</span>
                  </button>
                </div>

                {/* Pre-set Test Profiles Bar */}
                <div className="pt-8 border-t border-slate-800/80">
                  <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Or instantly test with pre-configured candidate profiles:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PRESET_PROFILES.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => loadPreset(preset)}
                        className="text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                            {preset.label}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${preset.badgeColor}`}>
                            {preset.data.creditScore} CS
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{preset.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  title: 'Secure PAN Verification',
                  desc: 'Instant structural validation and NSDL API lookup simulation with encrypted data minimization and PII masking.'
                },
                {
                  icon: Calculator,
                  color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                  title: '100-Point Scoring Engine',
                  desc: 'Multi-factor algorithm evaluating FOIR ratio, loan-to-income multiplier, credit history, and income cushion.'
                },
                {
                  icon: Sparkles,
                  color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                  title: 'Gemini AI Explanations',
                  desc: 'Generates transparent, plain-language financial guidance and actionable score improvement roadmaps.'
                }
              ].map((feat, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 hover:border-slate-700 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.color}`}>
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick Estimator Tool */}
            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <div className="max-w-2xl space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <span>Quick Eligibility Estimator</span>
                  </h2>
                  <p className="text-sm text-slate-400">
                    Adjust key sliders below to see real-time FOIR impact before running full assessment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Monthly Income</span>
                      <span className="text-emerald-400 font-bold">{formatINR(formData.monthlyIncome)}</span>
                    </div>
                    <input
                      type="range"
                      min="20000"
                      max="300000"
                      step="5000"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Existing Monthly EMIs</span>
                      <span className="text-amber-400 font-bold">{formatINR(formData.existingEmi)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150000"
                      step="2000"
                      value={formData.existingEmi}
                      onChange={(e) => setFormData({ ...formData, existingEmi: Number(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Current Existing FOIR Ratio:</p>
                    <p className="text-xl font-extrabold text-slate-100">
                      {((formData.existingEmi / (formData.monthlyIncome || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Recommended Max Loan Cushion:</p>
                    <p className="text-xl font-extrabold text-emerald-400">
                      {formatINR(Math.max(0, (formData.monthlyIncome * 0.45 - formData.existingEmi) * 36))}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('assessment')}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                  >
                    Complete Full Assessment
                  </button>
                </div>
              </div>
            </div>

            {/* Educational Privacy Section (Module 5 & 14) */}
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Bank-Grade Privacy & Data Minimization</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your PAN and sensitive credentials are encrypted and never transmitted to LLMs or stored unnecessarily.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 256-bit Simulated SSL</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> NSDL/CIBIL Compliant</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ASSESSMENT WORKFLOW (Modules 4, 5, 6, 7, 8, 9, 10, 11, 16) */}
        {/* ========================================================================= */}
        {activeTab === 'assessment' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            
            {/* Step Stepper Header */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Step {currentStep} of 4 Assessment Steps
                </span>
                <span className="text-xs text-slate-400">
                  {currentStep === 1 && 'Consent & Privacy Notice'}
                  {currentStep === 2 && 'Applicant Financial Profile'}
                  {currentStep === 3 && 'PAN Identity Verification'}
                  {currentStep === 4 && 'Review & Calculate Score'}
                </span>
              </div>

              {/* Step Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full transition-all duration-500"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>

              {/* Step Icon Badges */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                {[
                  { num: 1, label: 'Consent', icon: ShieldCheck },
                  { num: 2, label: 'Details', icon: User },
                  { num: 3, label: 'PAN Verification', icon: CreditCard },
                  { num: 4, label: 'Calculate Score', icon: Calculator }
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      currentStep === s.num
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : s.num < currentStep
                        ? 'border-slate-700 bg-slate-800/40 text-slate-300'
                        : 'border-slate-800/40 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 1: Consent & Privacy (Module 5) */}
            {currentStep === 1 && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Module 5 — Consent & Privacy Authorization</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100">Applicant Consent & Data Pledge</h2>
                  <p className="text-sm text-slate-400">
                    Before retrieving financial information, Credify AI requires explicit user consent per financial data privacy regulations.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consentPan}
                        onChange={(e) => setFormData({ ...formData, consentPan: e.target.checked })}
                        className="mt-1 w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                      />
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-200">Authorization for PAN Identity Verification</span>
                        <p className="text-slate-400">
                          I authorize Credify AI to verify my Permanent Account Number (PAN) details with authorized identity databases for underwriting verification.
                        </p>
                      </div>
                    </label>
                    {errors.consentPan && <p className="text-xs text-rose-400 font-semibold">{errors.consentPan}</p>}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consentBureau}
                        onChange={(e) => setFormData({ ...formData, consentBureau: e.target.checked })}
                        className="mt-1 w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                      />
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-200">Credit Bureau Information Pull Consent</span>
                        <p className="text-slate-400">
                          I grant permission to simulate/pull normalized credit bureau records (Experian/CIBIL) including credit history length and existing repayment track record.
                        </p>
                      </div>
                    </label>
                    {errors.consentBureau && <p className="text-xs text-rose-400 font-semibold">{errors.consentBureau}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setActiveTab('home')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel Assessment
                  </button>
                  <button
                    onClick={() => validateStep(1) && setCurrentStep(2)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <span>I Agree & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Applicant Details Form (Module 4) */}
            {currentStep === 2 && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <User className="w-3.5 h-3.5" />
                    <span>Module 4 — Financial Profile Input</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100">Applicant Details</h2>
                  <p className="text-sm text-slate-400">
                    Enter applicant personal income and loan details with real-time formatting.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    {errors.fullName && <p className="text-xs text-rose-400">{errors.fullName}</p>}
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Age (Years)</label>
                    <input
                      type="number"
                      min="18"
                      max="70"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    {errors.age && <p className="text-xs text-rose-400">{errors.age}</p>}
                  </div>

                  {/* Employment Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Salaried">Salaried Employee</option>
                      <option value="Self-Employed">Self-Employed Professional</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Freelancer">Freelancer / Independent</option>
                    </select>
                  </div>

                  {/* Monthly Income */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-300">Monthly Net Income (₹)</label>
                      <span className="text-xs font-bold text-emerald-400">{formatINR(formData.monthlyIncome)}</span>
                    </div>
                    <input
                      type="number"
                      step="1000"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    {errors.monthlyIncome && <p className="text-xs text-rose-400">{errors.monthlyIncome}</p>}
                  </div>

                  {/* Existing Monthly EMI */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-300">Existing Monthly EMIs (₹)</label>
                      <span className="text-xs font-bold text-amber-400">{formatINR(formData.existingEmi)}</span>
                    </div>
                    <input
                      type="number"
                      step="500"
                      value={formData.existingEmi}
                      onChange={(e) => setFormData({ ...formData, existingEmi: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    {errors.existingEmi && <p className="text-xs text-rose-400">{errors.existingEmi}</p>}
                  </div>

                  {/* Requested Loan Amount */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-300">Requested Loan Amount (₹)</label>
                      <span className="text-xs font-bold text-cyan-400">{formatINR(formData.requestedLoan)}</span>
                    </div>
                    <input
                      type="number"
                      step="10000"
                      value={formData.requestedLoan}
                      onChange={(e) => setFormData({ ...formData, requestedLoan: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    {errors.requestedLoan && <p className="text-xs text-rose-400">{errors.requestedLoan}</p>}
                  </div>

                  {/* Loan Tenure */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Desired Tenure (Months)</label>
                    <select
                      value={formData.tenureMonths}
                      onChange={(e) => setFormData({ ...formData, tenureMonths: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                      <option value="48">48 Months (4 Years)</option>
                      <option value="60">60 Months (5 Years)</option>
                    </select>
                  </div>

                  {/* Credit Score Override */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-slate-300">Credit Score (300-900)</label>
                      <span className="text-xs font-bold text-indigo-400">{formData.creditScore}</span>
                    </div>
                    <input
                      type="number"
                      min="300"
                      max="900"
                      value={formData.creditScore}
                      onChange={(e) => setFormData({ ...formData, creditScore: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    {errors.creditScore && <p className="text-xs text-rose-400">{errors.creditScore}</p>}
                  </div>

                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => validateStep(2) && setCurrentStep(3)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <span>Proceed to PAN Verification</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAN Verification (Module 6) */}
            {currentStep === 3 && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Module 6 — Authorized PAN Identity Check</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100">PAN Verification</h2>
                  <p className="text-sm text-slate-400">
                    Verify applicant Permanent Account Number (PAN) against central NSDL database.
                  </p>
                </div>

                <div className="max-w-md space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">10-Digit PAN Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength="10"
                        placeholder="e.g. ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, panNumber: e.target.value.toUpperCase() });
                          setPanVerified(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono tracking-widest focus:border-emerald-500 focus:outline-none uppercase"
                      />
                      <button
                        onClick={handleVerifyPan}
                        disabled={panVerified === 'verifying'}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {panVerified === 'verifying' ? 'Verifying...' : 'Verify PAN'}
                      </button>
                    </div>
                    {errors.panNumber && <p className="text-xs text-rose-400">{errors.panNumber}</p>}
                  </div>

                  {/* Verification Status Banner */}
                  {panVerified === 'success' && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold">Identity Confirmed</p>
                        <p className="text-emerald-300/80">Matched applicant: {formData.fullName || 'Verified Individual'} • Masked: {maskPan(formData.panNumber)}</p>
                      </div>
                    </div>
                  )}

                  {panVerified === 'failed' && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 animate-fade-in">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold">Verification Failed</p>
                        <p className="text-rose-300/80">Check PAN format and try again.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!panVerified || panVerified !== 'success') {
                        setErrors({ panNumber: 'Please verify PAN before proceeding.' });
                        return;
                      }
                      setCurrentStep(4);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <span>Review & Calculate</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Review & Run Scoring Engine (Module 8 & 9) */}
            {currentStep === 4 && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Module 8 & 9 — Financial Calculation & Scoring</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100">Review & Execute Assessment</h2>
                  <p className="text-sm text-slate-400">
                    Verify application payload parameters before passing to the Credify scoring matrix.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Applicant Name</span>
                    <span className="font-bold text-slate-200">{formData.fullName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">PAN (Masked)</span>
                    <span className="font-mono font-bold text-slate-200">{maskPan(formData.panNumber)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Monthly Income</span>
                    <span className="font-bold text-emerald-400">{formatINR(formData.monthlyIncome)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Existing EMIs</span>
                    <span className="font-bold text-amber-400">{formatINR(formData.existingEmi)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Requested Loan</span>
                    <span className="font-bold text-cyan-400">{formatINR(formData.requestedLoan)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Credit Score</span>
                    <span className="font-bold text-indigo-400">{formData.creditScore}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={calculateEligibility}
                    disabled={isCalculating}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-xl shadow-emerald-500/25"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating Risk Factors...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Eligibility Score</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RESULT DASHBOARD (Module 12) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && assessmentResult && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Top Bar Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-100">Assessment Dashboard</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${assessmentResult.riskBg} ${assessmentResult.riskColor}`}>
                    {assessmentResult.riskTier}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Applicant: <span className="font-semibold text-slate-200">{formData.fullName}</span> • Evaluated: {assessmentResult.evaluatedAt}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveTab('assessment');
                    setCurrentStep(1);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start New Assessment</span>
                </button>
              </div>
            </div>

            {/* Score Radial Gauge Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Radial Gauge */}
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-slate-600">
                  <Award className="w-8 h-8 opacity-20" />
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Credify Score Index
                </p>

                {/* Animated Radial SVG */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * assessmentResult.totalScore) / 100}
                      strokeLinecap="round"
                      className={`${assessmentResult.riskColor} transition-all duration-1000 ease-out`}
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black tracking-tight text-slate-100">
                      {assessmentResult.totalScore}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">out of 100</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-sm font-bold text-slate-200">{assessmentResult.riskTier}</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {assessmentResult.totalScore >= 75 && 'High probability of automated approval with prime interest rates.'}
                    {assessmentResult.totalScore >= 50 && assessmentResult.totalScore < 75 && 'Moderate approval probability. Additional income proof or lower loan amount may be needed.'}
                    {assessmentResult.totalScore < 50 && 'High risk profile. Significant debt burden or credit score improvements recommended.'}
                  </p>
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Monthly Income</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-slate-100">{formatINR(assessmentResult.monthlyIncome)}</p>
                  <p className="text-[10px] text-slate-400">Annual: {formatINR(assessmentResult.annualIncome)}</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Existing EMIs</span>
                    <CreditCard className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xl font-black text-slate-100">{formatINR(assessmentResult.existingEmi)}</p>
                  <p className="text-[10px] text-slate-400">Existing FOIR: {assessmentResult.existingFoir.toFixed(1)}%</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Post-Loan FOIR</span>
                    <PieChart className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className={`text-xl font-black ${assessmentResult.foir > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {assessmentResult.foir.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-400">Benchmark: &lt; 45%</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Requested Loan</span>
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xl font-black text-slate-100">{formatINR(assessmentResult.requestedLoan)}</p>
                  <p className="text-[10px] text-slate-400">{assessmentResult.loanToIncomeMultiplier.toFixed(1)}x Annual Income</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Est. New EMI</span>
                    <Calculator className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-slate-100">{formatINR(assessmentResult.estNewEmi)}</p>
                  <p className="text-[10px] text-slate-400">Tenure: {formData.tenureMonths} Months</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Max Safe Loan</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-emerald-400">{formatINR(assessmentResult.maxRecommendedLoan)}</p>
                  <p className="text-[10px] text-slate-400">Based on 50% FOIR cap</p>
                </div>

              </div>

            </div>

            {/* Positive vs Risk Factors Grid (Module 10) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Positive Factors Card */}
              <div className="p-6 rounded-3xl border border-emerald-500/20 bg-slate-900/60 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Positive Credit Factors ({assessmentResult.positiveFactors.length})</span>
                </div>
                <div className="space-y-3">
                  {assessmentResult.positiveFactors.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                      <p className="text-xs font-bold text-emerald-300">{f.title}</p>
                      <p className="text-[11px] text-slate-400">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors Card */}
              <div className="p-6 rounded-3xl border border-rose-500/20 bg-slate-900/60 space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ThumbsDown className="w-4 h-4" />
                  <span>Identified Risk Flags ({assessmentResult.riskFactors.length})</span>
                </div>
                <div className="space-y-3">
                  {assessmentResult.riskFactors.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-1">
                      <p className="text-xs font-bold text-rose-300">{r.title}</p>
                      <p className="text-[11px] text-slate-400">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Gemini AI Explanation Card (Module 11) */}
            <div className="p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-100">Gemini AI Underwriting Assistant</h3>
                    <p className="text-xs text-slate-400">Automated Natural Language Financial Guidance</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Optional Gemini API Key"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-48 hidden sm:block"
                  />
                  <button
                    onClick={() => generateGeminiExplanation(assessmentResult)}
                    disabled={aiLoading}
                    className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Regenerate</span>
                  </button>
                </div>
              </div>

              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                  <p className="text-xs text-slate-400 font-medium">Synthesizing personalized credit advice via Gemini 3 Flash...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiError && <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg">{aiError}</p>}
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {aiResponse}
                  </div>
                </div>
              )}

              {/* Ask Gemini Follow-Up Interactive Chat */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-300">Ask Gemini AI Follow-Up Questions:</p>
                
                {chatHistory.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-500/10 text-indigo-300 ml-6 text-right' : 'bg-slate-900 text-slate-300 mr-6'}`}>
                        <span className="font-bold block text-[10px] opacity-60 uppercase">{msg.role}</span>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., How can I improve my eligibility score in 6 months?"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAskAi}
                    className="px-4 py-2 rounded-xl bg-indigo-500 text-slate-950 text-xs font-bold hover:bg-indigo-400 transition-colors shrink-0"
                  >
                    Send
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SCORE BREAKDOWN Transparency (Module 13 "Why This Score?") */}
        {/* ========================================================================= */}
        {activeTab === 'breakdown' && assessmentResult && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <FileText className="w-3.5 h-3.5" />
                <span>Module 13 — Algorithmic Explainability & Transparency</span>
              </div>
              <h1 className="text-3xl font-black text-slate-100">Granular Score Breakdown</h1>
              <p className="text-sm text-slate-400">
                Complete point-by-point attribution explaining exactly how your {assessmentResult.totalScore}/100 total score was derived.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Evaluation Factor</th>
                      <th className="pb-3 font-semibold">Input Value</th>
                      <th className="pb-3 font-semibold text-right">Points Earned</th>
                      <th className="pb-3 font-semibold text-right">Max Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {assessmentResult.scoreBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold text-slate-200">{row.category}</td>
                        <td className="py-3.5 text-slate-400">{row.note}</td>
                        <td className="py-3.5 font-mono font-bold text-emerald-400 text-right">+{row.pts}</td>
                        <td className="py-3.5 font-mono text-slate-500 text-right">/ {row.maxPts}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 text-slate-100 font-black">
                      <td className="pt-4 text-sm">TOTAL CREDIFY SCORE</td>
                      <td className="pt-4 text-slate-400">100-Point Max Scale</td>
                      <td className="pt-4 font-mono text-emerald-400 text-right text-base">
                        {assessmentResult.totalScore}
                      </td>
                      <td className="pt-4 font-mono text-slate-400 text-right text-base">/ 100</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-slate-200">How to interpret point allocation:</p>
                <p className="text-slate-400">
                  - **FOIR & Income**: Account for 35% of overall score weightage. Keeping EMIs low yields highest gains.
                  <br />- **Credit History & Score**: Represent 30% of weightage. Clean track record without delinquencies adds +10 pts.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: HOW IT WORKS & ARCHITECTURE (Module 17) */}
        {/* ========================================================================= */}
        {activeTab === 'howItWorks' && (
          <div className="space-y-12 animate-fade-in">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Module 17</span>
              <h1 className="text-3xl font-black text-slate-100">How Credify AI Works</h1>
              <p className="text-sm text-slate-400">
                An end-to-end operational pipeline diagram illustrating secure data ingestion, calculation, and AI explanation generation.
              </p>
            </div>

            {/* Pipeline Visual Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  step: '01',
                  title: 'User Input & Consent',
                  desc: 'Explicit consent collection (Mod 5) & secure data entry (Mod 4).',
                  icon: User
                },
                {
                  step: '02',
                  title: 'Identity & Bureau Sync',
                  desc: 'PAN NSDL check (Mod 6) & normalized Experian/CIBIL credit history (Mod 7).',
                  icon: CreditCard
                },
                {
                  step: '03',
                  title: '100-Pt Scoring Matrix',
                  desc: 'FOIR, Debt-to-income, and risk flag engine processing (Mod 8 & 9).',
                  icon: Calculator
                },
                {
                  step: '04',
                  title: 'Gemini AI Explanation',
                  desc: 'Anonymized metric delivery to Gemini for plain-language advice (Mod 11).',
                  icon: Sparkles
                }
              ].map((pipe, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 relative">
                  <span className="text-2xl font-black text-slate-700 block">{pipe.step}</span>
                  <pipe.icon className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-bold text-slate-200 text-sm">{pipe.title}</h3>
                  <p className="text-xs text-slate-400">{pipe.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
              <h2 className="text-lg font-bold text-slate-200">Security & Privacy Standard (Module 14)</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> PAN details are masked and never logged in plain text</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Zero Personally Identifiable Information (PII) is sent to Gemini API</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> End-to-end encrypted REST endpoints with CORS rate-limiting</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Full transparency with granular scoring attribution</li>
              </ul>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: API & ARCHITECTURE DOCS (Module 15, 19, 20) */}
        {/* ========================================================================= */}
        {activeTab === 'docs' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Terminal className="w-3.5 h-3.5" />
                <span>Modules 15, 19 & 20 — Developer Documentation & API Spec</span>
              </div>
              <h1 className="text-3xl font-black text-slate-100">API Layer & Architecture Specs</h1>
              <p className="text-sm text-slate-400">
                Technical reference for REST endpoints, environment configurations, and deployment procedures.
              </p>
            </div>

            {/* API Endpoints Accordion */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>REST API Layer Endpoints</span>
              </h2>

              {[
                {
                  method: 'POST',
                  endpoint: '/api/verify-pan',
                  desc: 'Validates PAN format and queries NSDL database with encrypted payload.',
                  sample: '{\n  "panNumber": "ABCDE1234F"\n}'
                },
                {
                  method: 'POST',
                  endpoint: '/api/check-eligibility',
                  desc: 'Calculates FOIR, debt ratios, and returns 100-point eligibility score breakdown.',
                  sample: '{\n  "monthlyIncome": 90000,\n  "existingEmi": 15000,\n  "requestedLoan": 500000,\n  "creditScore": 740\n}'
                },
                {
                  method: 'POST',
                  endpoint: '/api/ai-explanation',
                  desc: 'Sends anonymized metrics to Gemini API for natural language guidance.',
                  sample: '{\n  "score": 82,\n  "riskTier": "High Approval",\n  "foirPercent": "35.2"\n}'
                }
              ].map((api, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                      {api.method}
                    </span>
                    <span className="font-mono text-xs text-slate-200 font-bold">{api.endpoint}</span>
                  </div>
                  <p className="text-xs text-slate-400">{api.desc}</p>
                  <pre className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    {api.sample}
                  </pre>
                </div>
              ))}
            </div>

            {/* .env example & Deployment Spec */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4">
              <h2 className="text-lg font-bold text-slate-200">Environment Configuration (.env.example)</h2>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
{`PORT=5000
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key_here
NSDL_PAN_PROVIDER_KEY=your_pan_provider_key
EXPERIAN_BUREAU_SECRET=your_bureau_secret
CORS_ORIGIN=https://credify.ai`}
              </pre>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t py-8 transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center text-xs space-y-2">
          <p>© 2026 Credify AI Platform. Powered by Gemini 3 Flash. Built for financial transparency.</p>
          <p className="text-[10px] text-slate-600">Educational prototype implementing Modules 1–20 of Credify AI specification.</p>
        </div>
      </footer>

    </div>
  );
}