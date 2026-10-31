import React, { useState } from "react";
import { MessageCircle, ArrowRight, ArrowLeft, ShieldCheck, Smartphone, LockKeyhole, LoaderCircle } from "lucide-react";
import { requestOtp, verifyOtp } from "./api";

export default function AuthScreen({ onAuthenticated }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submitPhone(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!/^09\d{9}$/.test(phone)) {
      setError("شماره موبایل را با فرمت 09123456789 وارد کن.");
      return;
    }
    setBusy(true);
    try {
      const result = await requestOtp(phone);
      setNotice(result.detail || "کد تأیید ارسال شد.");
      setStep("code");
    } catch (err) {
      setError(err.message || "ارسال کد ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e) {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("کد تأیید باید ۶ رقم باشد.");
      return;
    }
    setBusy(true);
    try {
      const result = await verifyOtp(phone, code);
      onAuthenticated(result);
    } catch (err) {
      setError(err.message || "تأیید کد ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><MessageCircle size={21} strokeWidth={2.5}/></div>
          <span className="brand-name">vellora<span>.</span></span>
        </div>
        <div className="auth-art">
          <div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/>
          <div className="auth-chat-icon"><MessageCircle size={34}/></div>
          <span className="floating-dot dot-one"/><span className="floating-dot dot-two"/>
        </div>
        {step === "phone" ? (
          <>
            <div className="auth-heading"><span className="eyebrow">WELCOME TO VELLORA</span><h1>Conversations<br/>that bring us closer.</h1><p>Enter your mobile number. We’ll send you a one-time verification code.</p></div>
            <form onSubmit={submitPhone} className="auth-form">
              <label htmlFor="phone">Mobile number</label>
              <div className="auth-input"><Smartphone size={18}/><span className="country-code">+98</span><input id="phone" inputMode="numeric" autoComplete="tel-national" placeholder="09123456789" value={phone} onChange={e=>setPhone(e.target.value.replace(/[^\d]/g,"").slice(0,11))}/></div>
              {error && <div className="auth-error">{error}</div>}
              {notice && <div className="auth-notice">{notice}</div>}
              <button className="auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <>Send verification code <ArrowRight size={17}/></>}</button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-heading"><span className="eyebrow">ONE MORE STEP</span><h1>Check your<br/>messages.</h1><p>Enter the 6-digit code sent to <b>{phone}</b>.</p></div>
            <form onSubmit={submitCode} className="auth-form">
              <label htmlFor="otp">Verification code</label>
              <div className="auth-input"><LockKeyhole size={18}/><input id="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/[^\d]/g,"").slice(0,6))}/></div>
              {error && <div className="auth-error">{error}</div>}
              <button className="auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <>Verify and continue <ArrowRight size={17}/></>}</button>
              <button type="button" className="back-link" onClick={()=>{setStep("phone");setCode("");setError("");}}><ArrowLeft size={15}/> Change mobile number</button>
            </form>
          </>
        )}
        <div className="auth-security"><ShieldCheck size={15}/> Your account is protected with one-time verification.</div>
      </div>
      <div className="auth-side-copy"><span>PRIVATE BY DESIGN.</span><h2>Your people.<br/>Your conversations.</h2><p>A calmer space for meaningful group and private chats.</p></div>
    </main>
  );
}
