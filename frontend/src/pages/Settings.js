import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { secondaryAuth } from "../FirebaseAuth";
import emailjs from "@emailjs/browser";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../FirebaseAuth";
import "./Settings.css";

const db = getFirestore(app);

function Settings({ user, userProfile }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    email: "", password: "", role: "Viewer",
  });

  const canCreateAccounts = userProfile?.role?.toLowerCase() === "admin";

  // ── Fetch all members with same companyId, exclude self ──
  const fetchMembers = async () => {
    if (!userProfile?.companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Query users collection by companyId
      const usersQ = query(
        collection(db, "users"),
        where("companyId", "==", userProfile.companyId)
      );
      const usersSnap = await getDocs(usersQ);
      const fromUsers = usersSnap.docs.map((d) => ({
        id: d.id,
        source: "users",
        uid: d.id,
        ...d.data(),
      }));

      // Query subAccounts collection by companyId
      const subQ = query(
        collection(db, "subAccounts"),
        where("companyId", "==", userProfile.companyId)
      );
      const subSnap = await getDocs(subQ);
      const fromSub = subSnap.docs.map((d) => ({
        id: d.id,
        source: "subAccounts",
        ...d.data(),
      }));

      // Merge, deduplicate by email, exclude self
      const seen = new Set();
      const merged = [];
      [...fromUsers, ...fromSub].forEach((m) => {
        if (!seen.has(m.email) && m.email !== user.email) {
          seen.add(m.email);
          merged.push(m);
        }
      });

      setMembers(merged);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMembers(); }, [user, userProfile]);

  // ── Create sub-account ──────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setCreating(true);

    try {
      // 1. Create Firebase Auth using secondary app (keeps your session)
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth, form.email, form.password
      );
      const newUid = credential.user.uid;

      // 2. Write to subAccounts only
      await addDoc(collection(db, "subAccounts"), {
        uid: newUid,
        email: form.email,
        role: form.role,
        companyId: userProfile.companyId,
        companyName: userProfile.companyName || "",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Account for ${form.email} created successfully.`);
      setForm({ email: "", password: "", role: "Viewer" });
      setShowForm(false);
      fetchMembers();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err.message);
      }
    }
    setCreating(false);
  };

  // ── Remove member ───────────────────────────────────────
  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.email} from your team?`)) return;

    try {
      // Delete from whichever collection they came from
      await deleteDoc(doc(db, member.source, member.id));
      setMembers((prev) => prev.filter((m) => m.id !== member.id));

      // Email you to delete from Firebase Auth
      await emailjs.send(
        "service_2k0wr1a",
        "template_bclvbj9",  // ← replace with your delete template ID
        {
          removed_email: member.email,
          removed_uid: member.uid || "—",
          removed_by: user.email,
          company_name: userProfile.companyName || userProfile.companyId,
        },
        "pfs7aT8XcshtI9L5O"
      );

      setSuccess(`${member.email} removed.`);
    } catch (err) {
      setError(`Failed to remove: ${err.message}`);
    }
  };

  const roleColors = {
    Admin: { bg: "#ede9fe", color: "#5b21f4" },
    admin: { bg: "#ede9fe", color: "#5b21f4" },
    Editor: { bg: "#fef3c7", color: "#d97706" },
    Viewer: { bg: "#dcfce7", color: "#16a34a" },
  };

  const getRoleStyle = (role) => ({
    background: roleColors[role]?.bg || "#f3f4f6",
    color: roleColors[role]?.color || "#374151",
  });

  // ── No company linked ───────────────────────────────────
  if (!userProfile?.companyId) {
    return (
      <div className="settings-root">
        <div className="settings-empty" style={{ marginTop: 60 }}>
          <span className="settings-empty__icon">🏢</span>
          <h3>No company linked</h3>
          <p>Your account hasn't been linked to a company yet. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-root">
      <div className="settings-container">
        {/* ── HEADER ── */}
        <div className="settings-header">
          <div>
            <h1 className="settings-header__title">Settings</h1>
            <p className="settings-header__sub">
              Manage team members for {userProfile.companyName || "your company"}
            </p>
            <p className="settings-company-id">
              🏢 Company ID: <strong>{userProfile.companyId}</strong>
            </p>
          </div>
          {canCreateAccounts && (
            <button
              className="settings-btn settings-btn--primary"
              onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
            >
              {showForm ? "✕ Cancel" : "+ Add Member"}
            </button>
          )}
        </div>

        {/* ── ALERTS ── */}
        {success && <div className="settings-alert settings-alert--success">✅ {success}</div>}
        {error && <div className="settings-alert settings-alert--error">⚠️ {error}</div>}

        {/* ── CREATE FORM — Admin only ── */}
        {showForm && canCreateAccounts && (
          <div className="settings-form-card">
            <h2 className="settings-form-card__title">Add Team Member</h2>
            <p className="settings-form-card__sub">
              A new account will be created and linked to{" "}
              <strong>{userProfile.companyName || userProfile.companyId}</strong>.
            </p>
            <form onSubmit={handleCreate} className="settings-form">
              <div className="settings-form__row">
                <div className="settings-form__field">
                  <label>Email Address</label>
                  <input
                    className="settings-input"
                    type="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="settings-form__field">
                  <label>Temporary Password</label>
                  <input
                    className="settings-input"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="settings-form__field" style={{ maxWidth: 300 }}>
                <label>Role</label>
                <select
                  className="settings-input settings-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="Viewer">Viewer — can view only</option>
                  <option value="Editor">Editor — can edit data</option>
                  <option value="Admin">Admin — full access</option>
                </select>
              </div>
              <div className="settings-form__actions">
                <button
                  type="submit"
                  className="settings-btn settings-btn--primary"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Account →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── MEMBERS TABLE ── */}
        <div className="settings-section">
          <div className="settings-section__header">
            <h2 className="settings-section__title">Team Members</h2>
            <span className="settings-section__count">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="settings-empty">
              <div className="settings-spinner" />
              <p>Loading team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="settings-empty">
              <span className="settings-empty__icon">👥</span>
              <h3>No team members yet</h3>
              <p>
                {canCreateAccounts
                  ? `Click "+ Add Team Member" to get started.`
                  : "No team members have been added yet."}
              </p>
            </div>
          ) : (
            <div className="settings-table-wrap">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th style={{ marginLeft: '10px' }}>Role</th>
                    <th>Created</th>
                    {canCreateAccounts && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="settings-table__user">
                          <div className="settings-table__avatar">
                            {member.email[0].toUpperCase()}
                          </div>
                          <span className="settings-table__email">{member.email}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="settings-role-badge"
                          style={getRoleStyle(member.role)}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="settings-table__date">
                        {member.createdAt?.toDate
                          ? member.createdAt.toDate().toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                          : "—"}
                      </td>
                      {canCreateAccounts && (
                        <td>
                          <button
                            className="settings-btn settings-btn--danger"
                            onClick={() => handleRemove(member)}
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── YOUR ACCOUNT ── */}
        <div className="settings-section">
          <div className="settings-section__header">
            <h2 className="settings-section__title">Your Account</h2>
          </div>
          <div className="settings-admin-card">
            <div className="settings-admin-card__avatar">
              {user.email[0].toUpperCase()}
            </div>
            <div className="settings-admin-card__info">
              <p className="settings-admin-card__email">{user.email}</p>
              <p className="settings-admin-card__role">
                {userProfile.companyName || "—"} · {userProfile.role}
              </p>
            </div>
            <span
              className="settings-role-badge"
              style={getRoleStyle(userProfile.role)}
            >
              {userProfile.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;