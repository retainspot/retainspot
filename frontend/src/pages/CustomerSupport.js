import { useState } from "react";
import PublicNav from "../components/Publicnav";
import "./CustomerSupport.css";

function CustomerSupport({ setPublicPage }) {
  const [activeTab, setActiveTab] = useState("faq");
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    { q: "How do I get started with RetainSpot?",                  a: "Simply sign up for a free account, connect your customer data source (CSV upload supported), and your dashboard will populate automatically within minutes." },
    { q: "What data does RetainSpot use for churn prediction?",    a: "RetainSpot analyses customer tenure, contract type, payment method, service usage patterns, demographic data, and engagement history to build accurate churn risk scores." },
    { q: "Can I export reports?",                                  a: "Yes! All reports, charts, and customer lists can be exported as CSV or PDF. Head to the Sales Report section and click the Export button." },
    { q: "How is my data protected?",                             a: "We use Firebase Authentication with enterprise-grade encryption. Your data is stored securely and never shared with third parties." },
    { q: "Can I add team members to my account?",                 a: "Yes. Admin accounts can invite team members from the Settings page. Each member gets their own login with role-based access." },
    { q: "What is the difference between Active and Churned customers?", a: "Active customers are those still subscribed or using your service. Churned customers have cancelled — these are the ones RetainSpot helps you win back." },
  ];

  const categories = [
    { icon: "🚀", title: "Getting Started",      desc: "Account setup, onboarding, and first steps." },
    { icon: "📊", title: "Dashboard & Reports",  desc: "Understanding metrics, charts, and exports." },
    { icon: "👥", title: "Customer Data",        desc: "Importing, filtering, and managing customers." },
    { icon: "🔒", title: "Account & Security",   desc: "Password, 2FA, billing, and permissions." },
    { icon: "🔗", title: "Integrations",         desc: "Connecting third-party tools and APIs." },
    { icon: "🐛", title: "Bug Reports",          desc: "Something not working? Let us know." },
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="cs-root">
      <PublicNav activePage="Support" setActivePage={setPublicPage} />

      {/* HERO */}
      <section className="cs-hero">
        <div className="cs-hero__blob cs-hero__blob--1" />
        <div className="cs-hero__blob cs-hero__blob--2" />
        <div className="cs-hero__content">
          <div className="cs-hero__badge">🎧 Support Center</div>
          <h1 className="cs-hero__title">How can we help you?</h1>
          <p className="cs-hero__sub">Browse our FAQ, explore help topics, or send us a message.</p>
          <div className="cs-hero__search">
            <span className="cs-hero__search-icon">🔍</span>
            <input className="cs-hero__search-input" type="text" placeholder="Search for answers..." />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="cs-categories">
        <div className="cs-inner">
          <div className="cs-categories__grid">
            {categories.map((c) => (
              <div className="cs-category-card" key={c.title} onClick={() => setActiveTab("faq")}>
                <span className="cs-category-card__icon">{c.icon}</span>
                <h3 className="cs-category-card__title">{c.title}</h3>
                <p className="cs-category-card__desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TABS */}
      <section className="cs-main">
        <div className="cs-inner">
          <div className="cs-tabs">
            <button className={`cs-tab ${activeTab === "faq" ? "cs-tab--active" : ""}`} onClick={() => setActiveTab("faq")}>
              📋 Frequently Asked Questions
            </button>
            <button className={`cs-tab ${activeTab === "contact" ? "cs-tab--active" : ""}`} onClick={() => setActiveTab("contact")}>
              ✉️ Contact Us
            </button>
          </div>

          {/* FAQ */}
          {activeTab === "faq" && (
            <div className="cs-faq">
              {faqs.map((faq, i) => (
                <div key={i} className={`cs-faq__item ${openFaq === i ? "cs-faq__item--open" : ""}`}>
                  <button className="cs-faq__question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <span className="cs-faq__chevron">{openFaq === i ? "▲" : "▼"}</span>
                  </button>
                  {openFaq === i && <div className="cs-faq__answer">{faq.a}</div>}
                </div>
              ))}
            </div>
          )}

          {/* CONTACT */}
          {activeTab === "contact" && (
            <div className="cs-contact">
              {submitted ? (
                <div className="cs-contact__success">
                  <span className="cs-contact__success-icon">✅</span>
                  <h3>Message Sent!</h3>
                  <p>Thanks for reaching out. Our support team will get back to you within 24 hours.</p>
                  <button className="cs-btn cs-btn--primary" onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }); }}>
                    Send Another
                  </button>
                </div>
              ) : (
                <div className="cs-contact__layout">
                  <div className="cs-contact__info">
                    <h3 className="cs-contact__info-title">Get in touch</h3>
                    <p className="cs-contact__info-sub">We usually respond within 24 hours on business days.</p>
                    <div className="cs-contact__channels">
                      <div className="cs-contact__channel"><span>📧</span><div><strong>Email</strong><span>support@retainspot.com</span></div></div>
                      <div className="cs-contact__channel"><span>💬</span><div><strong>Live Chat</strong><span>Available 9am – 5pm EST</span></div></div>
                      <div className="cs-contact__channel"><span>🐦</span><div><strong>Twitter / X</strong><span>@RetainSpot</span></div></div>
                    </div>
                  </div>
                  <form className="cs-contact__form" onSubmit={handleSubmit}>
                    <div className="cs-contact__row">
                      <div className="cs-contact__field">
                        <label>Your Name</label>
                        <input className="cs-input" type="text" name="name" placeholder="Jane Smith" value={formData.name} onChange={handleChange} required />
                      </div>
                      <div className="cs-contact__field">
                        <label>Email Address</label>
                        <input className="cs-input" type="email" name="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="cs-contact__field">
                      <label>Subject</label>
                      <input className="cs-input" type="text" name="subject" placeholder="What's this about?" value={formData.subject} onChange={handleChange} required />
                    </div>
                    <div className="cs-contact__field">
                      <label>Message</label>
                      <textarea className="cs-input cs-textarea" name="message" placeholder="Describe your issue or question..." value={formData.message} onChange={handleChange} required rows={5} />
                    </div>
                    <button type="submit" className="cs-btn cs-btn--primary cs-btn--lg cs-btn--full">Send Message →</button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="cs-footer">
        <div className="cs-footer__inner">
          <div className="cs-footer__logo"><span>🌀</span><span>RetainSpot</span></div>
          <div className="cs-footer__links">
            <span onClick={() => setPublicPage("Home")}>Home</span>
            <span onClick={() => setPublicPage("Support")}>Support</span>
            <span onClick={() => setPublicPage("Login")}>Login</span> 
          </div> 
          <br />
          <p className="cs-footer__copy">© 2026 RetainSpot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default CustomerSupport;