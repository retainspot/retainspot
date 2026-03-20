import { useState } from "react";
import emailjs from "@emailjs/browser";
import PublicNav from "../components/Publicnav";
import "./Home.css";

function Home({ setPublicPage }) {
  const [formData, setFormData] = useState({ company: "", email: "", usage: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSendError("");
    setSending(true);
    try {
      await emailjs.send(
        "service_99l8atl",      // ← replace with your EmailJS Service ID
        "template_t0qh6vg",     // ← replace with your EmailJS Template ID
        {
          company:    formData.company,
          from_email: formData.email,
          usage:      formData.usage,
        },
        "lvA5yQ5B-kdchDmWY"       // ← replace with your EmailJS Public Key
      );
      setSubmitted(true);
    } catch (err) {
      console.error("Email failed:", err);
      setSendError("Something went wrong. Please try again.");
    }
    setSending(false);
  };

  const features = [
    { icon: "📊", title: "Churn Prediction",      desc: "AI-powered models identify at-risk customers before they leave, giving your team time to act." },
    { icon: "👥", title: "Customer Segmentation", desc: "Automatically segment your base by tenure, contract type, demographics, and behavior." },
    { icon: "📈", title: "Revenue Analytics",     desc: "Track MRR, churn rates, and lifetime value across all customer cohorts in real time." },
    { icon: "🔔", title: "Smart Alerts",          desc: "Get notified instantly when key metrics shift so nothing slips through the cracks." },
    { icon: "📋", title: "Sales Reports",         desc: "Beautiful, exportable reports your stakeholders will actually want to read." },
    { icon: "🛡️", title: "Secure & Reliable",    desc: "Enterprise-grade security with Firebase Authentication and real-time data sync." },
  ];

  const stats = [
    { value: "7,044",  label: "Customers Tracked" },
    { value: "26.5%",  label: "Avg Churn Reduced" },
    { value: "5,175",  label: "Active Users" },
    { value: "99.9%",  label: "Uptime" },
  ];

  return (
    <div className="home-root">
      <PublicNav activePage="Home" setActivePage={setPublicPage} />

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero__bg">
          <div className="home-hero__blob home-hero__blob--1" />
          <div className="home-hero__blob home-hero__blob--2" />
          <div className="home-hero__grid" />
        </div>

        <div className="home-hero__content">
          <div className="home-hero__badge">🚀 Customer Retention Platform</div>
          <h1 className="home-hero__title">
            Stop Losing Customers.<br />
            <span className="home-hero__title--accent">Start Retaining Them.</span>
          </h1>
          <p className="home-hero__subtitle">
            RetainSpot gives your team real-time insights into customer behavior,
            churn risk, and revenue health — all in one beautiful dashboard.
          </p>
          <div className="home-hero__cta">
            <button
              className="home-btn home-btn--primary home-btn--lg"
              onClick={() => document.getElementById("request-access").scrollIntoView({ behavior: "smooth" })}
            >
              Request Access
            </button>
            <button className="home-btn home-btn--outline home-btn--lg" onClick={() => setPublicPage("Support")}>
              Learn More
            </button>
          </div>
          <div className="home-hero__trust">
            <span>✅ Access granted within 24hrs</span>
            <span>✅ Setup in 5 minutes</span>
            <span>✅ Full dashboard access</span>
          </div>
        </div>

        {/* Dashboard Preview SVG */}
        <div className="home-hero__visual">
          <div className="home-hero__visual-card">
            <svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" className="home-dashboard-svg">
              <rect width="520" height="320" rx="18" fill="#ffffff" />
              <rect width="110" height="320" rx="0" fill="#f8f9ff" />
              <rect x="16" y="20" width="78" height="28" rx="8" fill="#6c47ff" opacity="0.12"/>
              <circle cx="26" cy="34" r="8" fill="#6c47ff" opacity="0.7"/>
              <rect x="40" y="29" width="44" height="10" rx="5" fill="#6c47ff" opacity="0.7"/>
              {["Dashboard","Customers","Products","Reports","Settings"].map((label, i) => (
                <g key={label}>
                  <rect x="14" y={72 + i * 38} width="82" height="28" rx="7" fill={i === 1 ? "#6c47ff" : "transparent"} />
                  <rect x="24" y={80 + i * 38} width="14" height="12" rx="3" fill={i === 1 ? "#fff" : "#c0c8e0"} opacity="0.8"/>
                  <rect x="44" y={83 + i * 38} width="42" height="6" rx="3" fill={i === 1 ? "#fff" : "#c0c8e0"} opacity="0.7"/>
                </g>
              ))}
              <rect x="122" y="18" width="100" height="52" rx="10" fill="#f0fdf4"/>
              <rect x="132" y="28" width="40" height="8" rx="4" fill="#22c55e" opacity="0.5"/>
              <rect x="132" y="42" width="60" height="14" rx="4" fill="#15803d" opacity="0.7"/>
              <rect x="132" y="58" width="50" height="7" rx="3" fill="#86efac" opacity="0.6"/>
              <rect x="236" y="18" width="100" height="52" rx="10" fill="#fff0f0"/>
              <rect x="246" y="28" width="40" height="8" rx="4" fill="#ef4444" opacity="0.5"/>
              <rect x="246" y="42" width="60" height="14" rx="4" fill="#dc2626" opacity="0.7"/>
              <rect x="246" y="58" width="50" height="7" rx="3" fill="#fca5a5" opacity="0.6"/>
              <rect x="350" y="18" width="100" height="52" rx="10" fill="#f5f0ff"/>
              <rect x="360" y="28" width="40" height="8" rx="4" fill="#6c47ff" opacity="0.5"/>
              <rect x="360" y="42" width="60" height="14" rx="4" fill="#6c47ff" opacity="0.7"/>
              <rect x="360" y="58" width="50" height="7" rx="3" fill="#c4b5fd" opacity="0.6"/>
              <rect x="122" y="84" width="210" height="120" rx="10" fill="#f8f9ff"/>
              <rect x="134" y="94" width="80" height="8" rx="4" fill="#6c47ff" opacity="0.3"/>
              {[0,1,2,3,4,5,6].map(i => {
                const heights = [40,65,30,80,55,70,45];
                return <rect key={i} x={140 + i*26} y={184 - heights[i]} width="16" height={heights[i]} rx="4" fill="#6c47ff" opacity={0.3 + i * 0.07}/>;
              })}
              <rect x="346" y="84" width="122" height="120" rx="10" fill="#f8f9ff"/>
              <circle cx="407" cy="144" r="38" fill="none" stroke="#e2e8f0" strokeWidth="18"/>
              <circle cx="407" cy="144" r="38" fill="none" stroke="#6c47ff" strokeWidth="18" strokeDasharray="72 167" strokeDashoffset="0" strokeLinecap="round"/>
              <circle cx="407" cy="144" r="38" fill="none" stroke="#22c55e" strokeWidth="18" strokeDasharray="50 189" strokeDashoffset="-72" strokeLinecap="round"/>
              <circle cx="407" cy="144" r="38" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray="45 194" strokeDashoffset="-122" strokeLinecap="round"/>
              <rect x="122" y="218" width="346" height="80" rx="10" fill="#f8f9ff"/>
              {[0,1,2].map(i => (
                <g key={i}>
                  <rect x="134" y={232 + i * 22} width="20" height="8" rx="4" fill="#6c47ff" opacity="0.3"/>
                  <rect x="162" y={232 + i * 22} width="50" height="8" rx="4" fill="#94a3b8" opacity="0.5"/>
                  <rect x="222" y={232 + i * 22} width="40" height="8" rx="4" fill="#94a3b8" opacity="0.4"/>
                  <rect x="272" y={232 + i * 22} width="60" height="8" rx="4" fill="#94a3b8" opacity="0.4"/>
                  <rect x="420" y={228 + i * 22} width="36" height="14" rx="7" fill={i === 1 ? "#fee2e2" : "#dcfce7"}/>
                </g>
              ))}
            </svg>
          </div>
          <div className="home-hero__visual-glow" />
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats">
        <div className="home-stats__inner">
          {stats.map((s) => (
            <div className="home-stats__item" key={s.label}>
              <span className="home-stats__value">{s.value}</span>
              <span className="home-stats__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="home-features">
        <div className="home-features__inner">
          <div className="home-section-header">
            <p className="home-section-eyebrow">✦ Why RetainSpot</p>
            <h2 className="home-section-title">Everything you need to retain more customers</h2>
            <p className="home-section-sub">One platform. Full visibility. Zero guesswork.</p>
          </div>
          <div className="home-features__grid">
            {features.map((f) => (
              <div className="home-feature-card" key={f.title}>
                <div className="home-feature-card__icon">{f.icon}</div>
                <h3 className="home-feature-card__title">{f.title}</h3>
                <p className="home-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REQUEST ACCESS FORM */}
      <section className="home-request" id="request-access">
        <div className="home-request__inner">
          <div className="home-request__left">
            <p className="home-section-eyebrow">✦ Get Access</p>
            <h2 className="home-request__title">Ready to get started?</h2>
            <p className="home-request__sub">
              RetainSpot is invite-only. Send us your email and tell us a bit about
              how you'd use it — we'll set up your account and reach out within 24 hours.
            </p>
            <div className="home-request__steps">
              <div className="home-request__step">
                <span className="home-request__step-num">1</span>
                <span>Fill in your company, email and use case below</span>
              </div>
              <div className="home-request__step">
                <span className="home-request__step-num">2</span>
                <span>We review your request within 24 hours</span>
              </div>
              <div className="home-request__step">
                <span className="home-request__step-num">3</span>
                <span>We create your account and email you the credentials</span>
              </div>
              <div className="home-request__step">
                <span className="home-request__step-num">4</span>
                <span>Log in and start reducing churn</span>
              </div>
            </div>
          </div>

          <div className="home-request__right">
            {submitted ? (
              <div className="home-request__success">
                <span>🎉</span>
                <h3>Request Received!</h3>
                <p>We’ll review your request and reply to you within 24 hours.</p>
                <button
                  className="home-btn home-btn--primary"
                  onClick={() => { setSubmitted(false); setFormData({ company: "", email: "", usage: "" }); }}
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form className="home-request__form" onSubmit={handleSubmit}>
                <h3 className="home-request__form-title">Request Access</h3>

                {sendError && (
                  <div className="home-request__error">⚠️ {sendError}</div>
                )}

                <div className="home-request__field">
                  <label>Company Name</label>
                  <input
                    className="home-request__input"
                    type="text"
                    name="company"
                    placeholder="e.g. Acme Telecom"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="home-request__field">
                  <label>Your Email Address</label>
                  <input
                    className="home-request__input"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="home-request__field">
                  <label>How will you use RetainSpot?</label>
                  <textarea
                    className="home-request__input home-request__textarea"
                    name="usage"
                    placeholder="e.g. We run a telecom company with 5,000 customers and want to track churn and improve retention..."
                    value={formData.usage}
                    onChange={handleChange}
                    required
                    rows={5}
                  />
                </div>

                <button
                  type="submit"
                  className="home-btn home-btn--primary home-btn--lg home-btn--full"
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send Request →"}
                </button>

                <p className="home-request__note">
                  Already have an account?{" "}
                  <span onClick={() => setPublicPage("Login")}>Log in here</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="home-footer__logo"><span>🌀</span><span>RetainSpot</span></div>
          <div className="home-footer__links">
            <span onClick={() => setPublicPage("Home")}>Home</span>
            <span onClick={() => setPublicPage("Support")}>Support</span>
            <span onClick={() => setPublicPage("Login")}>Login</span>
          </div>
          <p className="home-footer__copy">© 2026 RetainSpot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;