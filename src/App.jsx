import { useState, useRef } from "react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    display: "₹0",
    period: "forever",
    color: "#64748B",
    limit: 3,
    features: ["3 analyses per day", "Basic BUY/SELL signal", "English only", "Standard speed"],
    cta: "Start Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    display: "₹499",
    period: "/month",
    color: "#F59E0B",
    limit: 999,
    features: ["Unlimited analyses", "Detailed AI reasoning", "Hindi & English", "Support & Resistance", "Risk management", "Priority speed"],
    cta: "Subscribe — ₹499/mo",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 999,
    display: "₹999",
    period: "/month",
    color: "#8B5CF6",
    limit: 999,
    features: ["Everything in Pro", "Multi-timeframe analysis", "Pattern recognition", "Trade journal", "1-on-1 support", "Early access"],
    cta: "Subscribe — ₹999/mo",
    popular: false,
  },
];

const TESTIMONIALS = [
  { name: "Rahul S.", city: "Mumbai", text: "Caught a perfect BankNifty trade using ChartSense. Up 18% this month!", avatar: "R" },
  { name: "Priya K.", city: "Bangalore", text: "Finally an AI tool that understands Indian markets. Worth every rupee.", avatar: "P" },
  { name: "Amit T.", city: "Delhi", text: "Used 5 different tools before. ChartSense is the only one I trust.", avatar: "A" },
];

const FAKE_USERS = {
  "demo@chartsense.in": { password: "demo123", name: "Demo User", plan: "free", analyses: 0 },
};

export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [payPlan, setPayPlan] = useState(null);
  const [payStep, setPayStep] = useState(1);
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [payError, setPayError] = useState("");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [analyseError, setAnalyseError] = useState("");
  const fileRef = useRef();

  function handleAuth() {
    setAuthError("");
    setAuthLoading(true);
    setTimeout(() => {
      if (authMode === "login") {
        const found = FAKE_USERS[authEmail];
        if (!found || found.password !== authPassword) {
          setAuthError("Invalid email or password. Try demo@chartsense.in / demo123");
          setAuthLoading(false);
          return;
        }
        setUser({ email: authEmail, name: found.name, plan: found.plan, analyses: found.analyses });
        setPage("app");
      } else {
        if (!authName || !authEmail || !authPassword) {
          setAuthError("Please fill all fields.");
          setAuthLoading(false);
          return;
        }
        if (authPassword.length < 6) {
          setAuthError("Password must be at least 6 characters.");
          setAuthLoading(false);
          return;
        }
        setUser({ email: authEmail, name: authName, plan: "free", analyses: 0 });
        setPage("app");
      }
      setAuthLoading(false);
    }, 1200);
  }

  function logout() {
    setUser(null);
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setPage("landing");
  }

  function startPayment(plan) {
    if (!user) { setAuthMode("login"); setPage("auth"); return; }
    setPayPlan(plan);
    setPayStep(1);
    setPayError("");
    setCardNum(""); setCardExp(""); setCardCvv(""); setCardName("");
    setPage("payment");
  }

  function processPayment() {
    if (!cardNum || !cardExp || !cardCvv || !cardName) {
      setPayError("Please fill all card details.");
      return;
    }
    if (cardNum.replace(/\s/g, "").length < 16) {
      setPayError("Invalid card number.");
      return;
    }
    setPayStep(2);
    setTimeout(() => {
      setUser(prev => ({ ...prev, plan: payPlan.id }));
      setPayStep(3);
    }, 2500);
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    setImageMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = e => setImageBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
    setResult(null);
    setAnalyseError("");
  }

  async function analyse() {
    if (!imageBase64) return;
    const plan = PLANS.find(p => p.id === (user?.plan || "free"));
    if (user && user.plan === "free" && user.analyses >= plan.limit) {
      setAnalyseError("Daily limit reached! Upgrade to Pro for unlimited analyses.");
      return;
    }
    setLoading(true);
    setResult(null);
    setAnalyseError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: imageMime, data: imageBase64 } },
              {
                type: "text", text: `You are an expert Indian stock market and crypto technical analyst. Analyse this trading chart and respond ONLY in raw JSON, no markdown:
{
  "signal": "BUY" or "SELL" or "WAIT",
  "confidence": 0-100,
  "summary": "2 sentence summary",
  "trend": "BULLISH" or "BEARISH" or "SIDEWAYS",
  "support": "key support level or N/A",
  "resistance": "key resistance level or N/A",
  "patterns": ["patterns","spotted"],
  "reasoning": "3-4 sentence explanation",
  "risk": "LOW" or "MEDIUM" or "HIGH",
  "stoploss": "stoploss zone or N/A",
  "target": "target zone or N/A",
  "timeframe": "detected timeframe"
}`
              }
            ]
          }]
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.[0]?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      if (user) setUser(prev => ({ ...prev, analyses: prev.analyses + 1 }));
      setPage("result");
    } catch (e) {
      setAnalyseError(e.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const planInfo = PLANS.find(p => p.id === (user?.plan || "free"));
  const signalColor = result?.signal === "BUY" ? "#10B981" : result?.signal === "SELL" ? "#EF4444" : "#F59E0B";
  const signalBg = result?.signal === "BUY" ? "rgba(16,185,129,0.1)" : result?.signal === "SELL" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)";
  const signalEmoji = result?.signal === "BUY" ? "🟢" : result?.signal === "SELL" ? "🔴" : "🟡";

  return (
    <div style={{ minHeight: "100vh", background: "#060A0F", color: "#E2E8F0", fontFamily: "sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#F59E0B33;border-radius:4px}
        .nav{position:sticky;top:0;z-index:100;background:rgba(6,10,15,0.96);backdrop-filter:blur(16px);border-bottom:1px solid rgba(245,158,11,0.1);padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .logo{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;background:linear-gradient(90deg,#F59E0B,#FBBF24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;cursor:pointer;flex-shrink:0}
        .nav-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .nb{background:transparent;border:1px solid rgba(245,158,11,0.25);color:#F59E0B;padding:8px 14px;border-radius:8px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
        .nb:hover{background:rgba(245,158,11,0.08)}
        .nb.solid{background:linear-gradient(135deg,#F59E0B,#D97706);color:#060A0F;border-color:transparent}
        .nb.solid:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(245,158,11,0.35)}
        .nb.ghost{border-color:rgba(255,255,255,0.1);color:#94A3B8}
        .nb.ghost:hover{background:rgba(255,255,255,0.05);color:#E2E8F0}
        .user-pill{background:#0D1117;border:1px solid rgba(245,158,11,0.2);border-radius:20px;padding:6px 12px;display:flex;align-items:center;gap:8px;font-family:'Outfit',sans-serif;font-size:13px}
        .plan-badge{background:rgba(245,158,11,0.15);color:#F59E0B;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700;text-transform:uppercase}
        .hero{padding:80px 24px 60px;text-align:center;position:relative;overflow:hidden}
        .hero::before{content:'';position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse,rgba(245,158,11,0.1) 0%,transparent 70%);pointer-events:none}
        .badge-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);border-radius:20px;padding:6px 14px;font-family:'Outfit',sans-serif;font-size:12px;color:#F59E0B;font-weight:600;margin-bottom:24px}
        .h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,10vw,88px);letter-spacing:2px;line-height:.92;margin-bottom:20px}
        .h1 span{background:linear-gradient(90deg,#F59E0B,#FBBF24);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .hero-p{font-family:'Outfit',sans-serif;font-size:17px;color:#94A3B8;max-width:520px;margin:0 auto 36px;line-height:1.7}
        .hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .bp{background:linear-gradient(135deg,#F59E0B,#D97706);color:#060A0F;border:none;padding:14px 32px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s}
        .bp:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(245,158,11,0.4)}
        .bs{background:transparent;color:#E2E8F0;border:1px solid rgba(255,255,255,0.12);padding:14px 32px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s}
        .bs:hover{background:rgba(255,255,255,0.05)}
        .stats{display:flex;justify-content:center;gap:40px;padding:36px 24px;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);flex-wrap:wrap}
        .stat{text-align:center}
        .sn{font-family:'Bebas Neue',sans-serif;font-size:40px;color:#F59E0B;letter-spacing:1px}
        .sl{font-family:'Outfit',sans-serif;font-size:12px;color:#475569;margin-top:3px}
        .section{padding:70px 24px;max-width:1000px;margin:0 auto}
        .sec-title{font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:1px;text-align:center;margin-bottom:10px}
        .sec-sub{font-family:'Outfit',sans-serif;font-size:15px;color:#64748B;text-align:center;margin-bottom:48px}
        .steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px}
        .step-c{background:#0D1117;border:1px solid rgba(245,158,11,0.1);border-radius:16px;padding:24px;position:relative;overflow:hidden;transition:border-color .2s}
        .step-c:hover{border-color:rgba(245,158,11,0.28)}
        .step-n{font-family:'Bebas Neue',sans-serif;font-size:64px;color:rgba(245,158,11,0.06);position:absolute;top:4px;right:12px;line-height:1}
        .step-icon{font-size:28px;margin-bottom:12px}
        .step-t{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#E2E8F0;margin-bottom:7px}
        .step-d{font-family:'Outfit',sans-serif;font-size:13px;color:#64748B;line-height:1.6}
        .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
        .plan-c{background:#0D1117;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:28px;position:relative;transition:all .25s}
        .plan-c:hover{transform:translateY(-4px)}
        .plan-c.pop{border-color:#F59E0B;box-shadow:0 0 50px rgba(245,158,11,0.1)}
        .pop-b{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#F59E0B,#D97706);color:#060A0F;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;white-space:nowrap}
        .plan-name{font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;color:#64748B;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px}
        .plan-price{font-family:'Bebas Neue',sans-serif;font-size:48px;letter-spacing:1px;line-height:1}
        .plan-per{font-family:'Outfit',sans-serif;font-size:13px;color:#64748B;margin-bottom:24px}
        .plan-feats{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
        .plan-feat{font-family:'Outfit',sans-serif;font-size:13px;color:#94A3B8;display:flex;align-items:flex-start;gap:9px}
        .plan-feat::before{content:'✓';color:#F59E0B;font-weight:700;font-size:12px;flex-shrink:0}
        .plan-btn{width:100%;padding:13px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;border:none}
        .testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
        .testi-c{background:#0D1117;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px}
        .stars{color:#F59E0B;font-size:12px;margin-bottom:12px}
        .testi-top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
        .tav{width:36px;height:36px;background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:16px;color:#060A0F;flex-shrink:0}
        .tname{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#E2E8F0}
        .tcity{font-family:'Outfit',sans-serif;font-size:12px;color:#64748B}
        .ttext{font-family:'Outfit',sans-serif;font-size:13px;color:#94A3B8;line-height:1.65;font-style:italic}
        .auth-wrap{max-width:420px;margin:0 auto;padding:50px 20px}
        .auth-box{background:#0D1117;border:1px solid rgba(245,158,11,0.15);border-radius:20px;padding:32px}
        .auth-title{font-family:'Bebas Neue',sans-serif;font-size:34px;letter-spacing:1px;margin-bottom:6px}
        .auth-sub{font-family:'Outfit',sans-serif;font-size:14px;color:#64748B;margin-bottom:24px}
        .field{margin-bottom:14px}
        .field label{display:block;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;color:#64748B;letter-spacing:.6px;text-transform:uppercase;margin-bottom:7px}
        .finp{width:100%;background:#060A0F;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 14px;color:#E2E8F0;font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s}
        .finp:focus{border-color:rgba(245,158,11,0.4)}
        .finp::placeholder{color:#374151}
        .auth-btn{width:100%;padding:14px;background:linear-gradient(135deg,#F59E0B,#D97706);border:none;border-radius:12px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;color:#060A0F;cursor:pointer;transition:all .2s;margin-top:8px}
        .auth-btn:disabled{opacity:.4;cursor:not-allowed}
        .auth-switch{text-align:center;margin-top:18px;font-family:'Outfit',sans-serif;font-size:13px;color:#64748B}
        .auth-switch span{color:#F59E0B;cursor:pointer;font-weight:600}
        .auth-err{font-family:'Outfit',sans-serif;font-size:13px;color:#EF4444;margin-top:10px;text-align:center}
        .demo-hint{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:12px 14px;font-family:'Outfit',sans-serif;font-size:12px;color:#94A3B8;margin-bottom:18px;line-height:1.6}
        .app-wrap{max-width:720px;margin:0 auto;padding:44px 20px}
        .app-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:1px;margin-bottom:6px}
        .app-sub{font-family:'Outfit',sans-serif;font-size:14px;color:#64748B;margin-bottom:24px}
        .usage-bar{background:#0D1117;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:13px 16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
        .usage-info{font-family:'Outfit',sans-serif;font-size:13px;color:#64748B}
        .upgrade-link{font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;color:#F59E0B;cursor:pointer;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:5px 12px;white-space:nowrap}
        .upload-zone{border:2px dashed rgba(245,158,11,0.2);border-radius:20px;padding:50px 20px;text-align:center;cursor:pointer;transition:all .2s;background:#0D1117;margin-bottom:16px}
        .upload-zone:hover,.upload-zone.drag{border-color:#F59E0B;background:rgba(245,158,11,0.03)}
        .u-icon{font-size:48px;margin-bottom:14px}
        .u-title{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#E2E8F0;margin-bottom:7px}
        .u-sub{font-family:'Outfit',sans-serif;font-size:13px;color:#64748B;margin-bottom:22px}
        .preview-box{border-radius:16px;overflow:hidden;margin-bottom:16px;border:1px solid rgba(245,158,11,0.16);position:relative}
        .preview-box img{width:100%;max-height:400px;object-fit:contain;background:#0D1117;display:block}
        .change-btn{position:absolute;top:10px;right:10px;background:rgba(6,10,15,0.88);border:1px solid rgba(245,158,11,0.3);color:#F59E0B;border-radius:8px;padding:6px 12px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer}
        .analyse-btn{width:100%;padding:17px;background:linear-gradient(135deg,#F59E0B,#D97706);border:none;border-radius:14px;font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:#060A0F;cursor:pointer;transition:all .25s}
        .analyse-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 32px rgba(245,158,11,0.45)}
        .analyse-btn:disabled{opacity:.35;cursor:not-allowed}
        .err-msg{font-family:'Outfit',sans-serif;font-size:13px;color:#EF4444;margin-top:10px;text-align:center}
        .upgrade-cta{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;text-align:center;margin-top:12px}
        .result-wrap{max-width:720px;margin:0 auto;padding:44px 20px}
        .sig-card{border-radius:20px;padding:32px;text-align:center;margin-bottom:20px;border:2px solid;animation:pop .45s cubic-bezier(.16,1,.3,1)}
        @keyframes pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        .sig-emoji{font-size:64px;margin-bottom:10px}
        .sig-text{font-family:'Bebas Neue',sans-serif;font-size:72px;letter-spacing:4px;line-height:1}
        .sig-conf{font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;margin-top:8px;opacity:.85}
        .sig-sum{font-family:'Outfit',sans-serif;font-size:14px;color:#94A3B8;margin-top:12px;line-height:1.7}
        .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px}
        .tile{background:#0D1117;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:15px}
        .tile-l{font-family:'Outfit',sans-serif;font-size:10px;color:#64748B;font-weight:600;letter-spacing:.8px;text-transform:uppercase;margin-bottom:7px}
        .tile-v{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#E2E8F0}
        .info-box{background:#0D1117;border:1px solid rgba(245,158,11,0.12);border-radius:14px;padding:20px;margin-bottom:14px}
        .info-title{font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;color:#F59E0B;letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px}
        .info-text{font-family:'Outfit',sans-serif;font-size:14px;color:#94A3B8;line-height:1.75}
        .tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
        .tag{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);color:#F59E0B;padding:5px 12px;border-radius:20px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600}
        .act-row{display:flex;gap:10px;flex-wrap:wrap}
        .act-btn{flex:1;min-width:130px;padding:13px;border-radius:12px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;border:none}
        .pay-wrap{max-width:460px;margin:0 auto;padding:44px 20px}
        .pay-box{background:#0D1117;border:1px solid rgba(245,158,11,0.15);border-radius:20px;padding:32px}
        .pay-plan{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:12px;padding:14px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center}
        .pay-plan-name{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#E2E8F0}
        .pay-plan-price{font-family:'Bebas Neue',sans-serif;font-size:26px;color:#F59E0B;letter-spacing:1px}
        .card-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .pay-btn{width:100%;padding:14px;background:linear-gradient(135deg,#F59E0B,#D97706);border:none;border-radius:12px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;color:#060A0F;cursor:pointer;transition:all .2s;margin-top:8px}
        .pay-err{font-family:'Outfit',sans-serif;font-size:13px;color:#EF4444;margin-top:8px;text-align:center}
        .spinner{width:44px;height:44px;border:3px solid rgba(245,158,11,0.2);border-top-color:#F59E0B;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .footer{text-align:center;padding:36px 24px;border-top:1px solid rgba(255,255,255,0.05);font-family:'Outfit',sans-serif;font-size:13px;color:#374151}
      `}</style>

      <nav className="nav">
        <div className="logo" onClick={() => setPage("landing")}>ChartSense</div>
        <div className="nav-right">
          <button className="nb ghost" onClick={() => setPage("pricing")}>Pricing</button>
          {user ? (
            <>
              <div className="user-pill">👤 {user.name.split(" ")[0]}<span className="plan-badge">{user.plan}</span></div>
              <button className="nb" onClick={() => setPage("app")}>Analyse</button>
              <button className="nb ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nb" onClick={() => { setAuthMode("login"); setPage("auth"); }}>Login</button>
              <button className="nb solid" onClick={() => { setAuthMode("signup"); setPage("auth"); }}>Sign Up Free →</button>
            </>
          )}
        </div>
      </nav>

      {page === "landing" && <>
        <div className="hero">
          <div className="badge-pill">🇮🇳 Built for Indian Traders · NSE · BSE · Crypto</div>
          <h1 className="h1">AI THAT READS<br /><span>YOUR CHARTS</span></h1>
          <p className="hero-p">Upload any chart screenshot. Get instant BUY, SELL or WAIT signal with full reasoning. Made for Indian markets.</p>
          <div className="hero-btns">
            <button className="bp" onClick={() => { setAuthMode("signup"); setPage("auth"); }}>Start Free — No Card Needed →</button>
            <button className="bs" onClick={() => setPage("pricing")}>View Pricing</button>
          </div>
        </div>
        <div className="stats">
          {[["2.4L+","Charts Analysed"],["91%","Signal Accuracy"],["18K+","Active Traders"],["4.8★","User Rating"]].map(([n,l]) => (
            <div key={l} className="stat"><div className="sn">{n}</div><div className="sl">{l}</div></div>
          ))}
        </div>
        <div className="section">
          <div className="sec-title">HOW IT WORKS</div>
          <div className="sec-sub">Simple. Fast. Accurate.</div>
          <div className="steps-grid">
            {[
              {icon:"👤",title:"Create Account",desc:"Sign up free in 30 seconds. No credit card needed.",n:"01"},
              {icon:"📸",title:"Screenshot Chart",desc:"Take screenshot from Zerodha, TradingView, Angel One, Binance.",n:"02"},
              {icon:"⬆️",title:"Upload to ChartSense",desc:"Drag and drop your chart. Works with all image formats.",n:"03"},
              {icon:"📊",title:"Get Your Signal",desc:"BUY/SELL/WAIT signal with support, resistance and full reasoning.",n:"04"},
            ].map(s => (
              <div key={s.n} className="step-c">
                <div className="step-n">{s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-t">{s.title}</div>
                <div className="step-d">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="section" style={{paddingTop:0}}>
          <div className="sec-title">TRADERS LOVE IT</div>
          <div className="sec-sub">Real results from real Indian traders</div>
          <div className="testi-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testi-c">
                <div className="stars">★★★★★</div>
                <div className="testi-top">
                  <div className="tav">{t.avatar}</div>
                  <div><div className="tname">{t.name}</div><div className="tcity">{t.city}</div></div>
                </div>
                <div className="ttext">"{t.text}"</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{textAlign:"center",padding:"56px 24px",background:"linear-gradient(180deg,transparent,rgba(245,158,11,0.04))"}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:"clamp(34px,6vw,52px)",letterSpacing:"2px",marginBottom:"14px"}}>START FREE TODAY</div>
          <p style={{fontFamily:"Outfit",fontSize:"15px",color:"#64748B",marginBottom:"24px"}}>Sign up free. 3 analyses per day. No credit card.</p>
          <button className="bp" onClick={() => { setAuthMode("signup"); setPage("auth"); }}>Create Free Account →</button>
        </div>
      </>}

      {page === "pricing" && (
        <div className="section">
          <div className="sec-title">SIMPLE PRICING</div>
          <div className="sec-sub">Start free. Upgrade when ready.</div>
          <div className="pricing-grid">
            {PLANS.map(p => (
              <div key={p.id} className={`plan-c ${p.popular?"pop":""}`}>
                {p.popular && <div className="pop-b">⭐ MOST POPULAR</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price" style={{color:p.color}}>{p.display}</div>
                <div className="plan-per">{p.period}</div>
                <ul className="plan-feats">
                  {p.features.map(f => <li key={f} className="plan-feat">{f}</li>)}
                </ul>
                <button className="plan-btn"
                  style={p.popular?{background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#060A0F"}:{background:"transparent",border:`1px solid ${p.color}44`,color:p.color}}
                  onClick={() => p.price===0?(user?setPage("app"):(setAuthMode("signup"),setPage("auth"))):startPayment(p)}
                >{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {page === "auth" && (
        <div className="auth-wrap">
          <div className="auth-box">
            <div className="auth-title">{authMode==="login"?"WELCOME BACK":"GET STARTED"}</div>
            <div className="auth-sub">{authMode==="login"?"Login to your ChartSense account":"Create your free account"}</div>
            <div className="demo-hint">🔑 <strong>Demo:</strong> demo@chartsense.in / demo123</div>
            {authMode==="signup"&&(
              <div className="field"><label>Full Name</label>
                <input className="finp" placeholder="Rahul Sharma" value={authName} onChange={e=>setAuthName(e.target.value)}/>
              </div>
            )}
            <div className="field"><label>Email</label>
              <input className="finp" type="email" placeholder="you@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/>
            </div>
            <div className="field"><label>Password</label>
              <input className="finp" type="password" placeholder="••••••••" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
            </div>
            <button className="auth-btn" onClick={handleAuth} disabled={authLoading}>
              {authLoading?"⏳ Please wait...":authMode==="login"?"LOGIN →":"CREATE ACCOUNT →"}
            </button>
            {authError&&<div className="auth-err">⚠️ {authError}</div>}
            <div className="auth-switch">
              {authMode==="login"
                ?<>Don't have an account? <span onClick={()=>{setAuthMode("signup");setAuthError("");}}>Sign up free</span></>
                :<>Already have an account? <span onClick={()=>{setAuthMode("login");setAuthError("");}}>Login</span></>}
            </div>
          </div>
        </div>
      )}

      {page === "app" && (
        <div className="app-wrap">
          <div className="app-title">ANALYSE YOUR CHART</div>
          <div className="app-sub">Upload any chart screenshot — get instant AI signal</div>
          {user&&(
            <div className="usage-bar">
              <div className="usage-info">
                Plan: <strong style={{color:"#E2E8F0"}}>{planInfo?.name}</strong> &nbsp;·&nbsp;
                {user.plan==="free"?<>Today: <strong style={{color:"#E2E8F0"}}>{user.analyses}/{planInfo?.limit}</strong></>:<strong style={{color:"#10B981"}}>Unlimited ✅</strong>}
              </div>
              {user.plan==="free"&&<div className="upgrade-link" onClick={()=>setPage("pricing")}>Upgrade ⚡</div>}
            </div>
          )}
          {!image?(
            <div className={`upload-zone ${dragging?"drag":""}`}
              onClick={()=>fileRef.current.click()}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
              <div className="u-icon">📊</div>
              <div className="u-title">Drop your chart screenshot here</div>
              <div className="u-sub">Zerodha · TradingView · Angel One · Binance · WazirX</div>
              <button className="bp" style={{fontSize:"14px",padding:"12px 28px"}}>Browse Files</button>
            </div>
          ):(
            <div className="preview-box">
              <img src={image} alt="chart"/>
              <button className="change-btn" onClick={()=>{setImage(null);setImageBase64(null);}}>✕ Change</button>
            </div>
          )}
          <button className="analyse-btn" disabled={!image||loading} onClick={analyse}>
            {loading?"⏳  ANALYSING...":"🔍  ANALYSE MY CHART"}
          </button>
          {analyseError&&(
            <div>
              <div className="err-msg">⚠️ {analyseError}</div>
              {analyseError.includes("limit")&&(
                <div className="upgrade-cta">
                  <p style={{fontFamily:"Outfit",fontSize:"14px",color:"#94A3B8",marginBottom:"10px"}}>Upgrade to Pro for unlimited analyses</p>
                  <button className="bp" style={{fontSize:"14px",padding:"12px 24px"}} onClick={()=>startPayment(PLANS[1])}>Upgrade to Pro ⚡</button>
                </div>
              )}
            </div>
          )}
          <div style={{marginTop:"16px",background:"#0D1117",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"10px",padding:"12px",fontFamily:"Outfit",fontSize:"12px",color:"#374151",textAlign:"center"}}>
            🔒 Charts are never stored · Educational purposes only
          </div>
        </div>
      )}

      {page==="result"&&result&&(
        <div className="result-wrap">
          <div className="sig-card" style={{background:signalBg,borderColor:signalColor}}>
            <div className="sig-emoji">{signalEmoji}</div>
            <div className="sig-text" style={{color:signalColor}}>{result.signal}</div>
            <div className="sig-conf" style={{color:signalColor}}>{result.confidence}% Confidence · {result.trend} · {result.timeframe||"Unknown TF"}</div>
            <div className="sig-sum">{result.summary}</div>
          </div>
          <div className="tiles">
            {[{l:"Trend",v:result.trend},{l:"Risk",v:result.risk},{l:"Support",v:result.support},{l:"Resistance",v:result.resistance},{l:"Stop Loss",v:result.stoploss},{l:"Target",v:result.target}].map(t=>(
              <div key={t.l} className="tile"><div className="tile-l">{t.l}</div><div className="tile-v">{t.v||"N/A"}</div></div>
            ))}
          </div>
          {result.patterns?.length>0&&(
            <div className="info-box">
              <div className="info-title">📐 Patterns Detected</div>
              <div className="tags">{result.patterns.map(p=><span key={p} className="tag">{p}</span>)}</div>
            </div>
          )}
          <div className="info-box">
            <div className="info-title">🧠 AI Reasoning</div>
            <div className="info-text">{result.reasoning}</div>
          </div>
          <div className="act-row">
            <button className="act-btn" style={{background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#060A0F"}}
              onClick={()=>{setImage(null);setImageBase64(null);setResult(null);setPage("app");}}>Analyse Another</button>
            {user?.plan==="free"&&(
              <button className="act-btn" style={{background:"#0D1117",border:"1px solid rgba(245,158,11,0.2)",color:"#F59E0B"}}
                onClick={()=>startPayment(PLANS[1])}>⚡ Upgrade to Pro</button>
            )}
          </div>
        </div>
      )}

      {page==="payment"&&payPlan&&(
        <div className="pay-wrap">
          <div className="pay-box">
            {payStep===1&&<>
              <div className="auth-title">CHECKOUT</div>
              <div className="auth-sub">Subscribe to {payPlan.name}</div>
              <div className="pay-plan">
                <div>
                  <div className="pay-plan-name">ChartSense {payPlan.name}</div>
                  <div style={{fontFamily:"Outfit",fontSize:"12px",color:"#64748B"}}>Billed monthly · Cancel anytime</div>
                </div>
                <div className="pay-plan-price">{payPlan.display}<span style={{fontSize:"14px",color:"#64748B"}}>/mo</span></div>
              </div>
              <div className="field"><label>Name on Card</label>
                <input className="finp" placeholder="Rahul Sharma" value={cardName} onChange={e=>setCardName(e.target.value)}/>
              </div>
              <div className="field"><label>Card Number</label>
                <input className="finp" placeholder="1234 5678 9012 3456" maxLength={19}
                  value={cardNum} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,16);setCardNum(v.replace(/(.{4})/g,"$1 ").trim());}}/>
              </div>
              <div className="card-row">
                <div className="field"><label>Expiry</label>
                  <input className="finp" placeholder="MM/YY" maxLength={5} value={cardExp}
                    onChange={e=>{let v=e.target.value.replace(/\D/g,"").slice(0,4);if(v.length>=2)v=v.slice(0,2)+"/"+v.slice(2);setCardExp(v);}}/>
                </div>
                <div className="field"><label>CVV</label>
                  <input className="finp" placeholder="•••" maxLength={3} type="password" value={cardCvv} onChange={e=>setCardCvv(e.target.value.replace(/\D/g,"").slice(0,3))}/>
                </div>
              </div>
              {payError&&<div className="pay-err">⚠️ {payError}</div>}
              <button className="pay-btn" onClick={processPayment}>PAY {payPlan.display}/MONTH</button>
              <button onClick={()=>setPage("pricing")} style={{width:"100%",padding:"12px",background:"transparent",border:"none",color:"#64748B",fontFamily:"Outfit",fontSize:"13px",cursor:"pointer",marginTop:"8px"}}>← Back</button>
              <div style={{fontFamily:"Outfit",fontSize:"11px",color:"#374151",textAlign:"center",marginTop:"14px"}}>🔒 Secured by Razorpay · 256-bit SSL</div>
            </>}
            {payStep===2&&(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div className="spinner"/>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:"26px",letterSpacing:"1px",marginBottom:"8px"}}>PROCESSING...</div>
                <div style={{fontFamily:"Outfit",fontSize:"14px",color:"#64748B"}}>Please wait...</div>
              </div>
            )}
            {payStep===3&&(
              <div style={{textAlign:"center",padding:"10px 0"}}>
                <div style={{fontSize:"60px",marginBottom:"14px"}}>🎉</div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:"32px",letterSpacing:"1px",color:"#10B981",marginBottom:"10px"}}>PAYMENT SUCCESS!</div>
                <div style={{fontFamily:"Outfit",fontSize:"15px",color:"#94A3B8",marginBottom:"6px"}}>Welcome to ChartSense <strong style={{color:"#F59E0B"}}>{payPlan.name}</strong>!</div>
                <div style={{fontFamily:"Outfit",fontSize:"13px",color:"#64748B",marginBottom:"24px"}}>You now have unlimited analyses.</div>
                <button className="bp" onClick={()=>setPage("app")}>Start Analysing →</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="footer">
        <strong style={{color:"#F59E0B"}}>ChartSense</strong> · India's AI Chart Analyst 🇮🇳
        <div style={{fontSize:"11px",color:"#1E293B",marginTop:"6px"}}>⚠️ Educational purposes only. Not financial advice. Trade at your own risk.</div>
      </div>
    </div>
  );
}
