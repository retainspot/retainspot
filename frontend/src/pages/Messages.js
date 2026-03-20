import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { app } from "../FirebaseAuth";
import "./Messages.css";
 
const db = getFirestore(app);
 
function Messages({ user, userProfile }) {
  const [members, setMembers]       = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatId, setChatId]         = useState(null);
  const [messages, setMessages]     = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [search, setSearch]         = useState("");
  const messagesEndRef              = useRef(null);
  const inputRef                    = useRef(null);
 
  // ── Load all members with same companyId, exclude self ──
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        if (!userProfile?.companyId) {
          setLoading(false);
          return;
        }
 
        // Query users collection by companyId
        const usersQ = query(
          collection(db, "users"),
          where("companyId", "==", userProfile.companyId)
        );
        const usersSnap = await getDocs(usersQ);
        const fromUsers = usersSnap.docs.map((d) => ({
          id:     d.id,
          uid:    d.id,
          source: "users",
          ...d.data(),
        }));
 
        // Query subAccounts by companyId
        const subQ = query(
          collection(db, "subAccounts"),
          where("companyId", "==", userProfile.companyId)
        );
        const subSnap = await getDocs(subQ);
        const fromSub = subSnap.docs.map((d) => ({
          id:     d.id,
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
        console.error("Error loading members:", err);
      }
      setLoading(false);
    };
 
    fetchMembers();
  }, [user, userProfile]);
 
  // ── Get or create chat ─────────────────────────────────
  const openChat = async (member) => {
    setSelectedUser(member);
    setMessages([]);
 
    // member.uid is the Firebase Auth UID of the other person
    const otherUid = member.uid;
    if (!otherUid) {
      console.error("Member has no uid:", member);
      return;
    }
 
    try {
      const chatsRef = collection(db, "chats");
 
      // Find existing chat where both UIDs are participants
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );
      const snapshot = await getDocs(q);
      const existing = snapshot.docs.find((d) =>
        d.data().participants.includes(otherUid)
      );
 
      let id;
      if (existing) {
        id = existing.id;
      } else {
        const chatRef = await addDoc(chatsRef, {
          participants:      [user.uid, otherUid],
          participantEmails: [user.email, member.email],
          createdAt:         serverTimestamp(),
          lastMessage:       "",
          lastMessageTime:   serverTimestamp(),
        });
        id = chatRef.id;
      }
      setChatId(id);
    } catch (err) {
      console.error("Error opening chat:", err);
    }
  };
 
  // ── Listen to messages in real-time ───────────────────
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);
 
  // ── Auto-scroll ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
 
  // ── Send message ───────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sending) return;
 
    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);
 
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text,
        senderId:    user.uid,
        senderEmail: user.email,
        createdAt:   serverTimestamp(),
      });
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage:     text,
        lastMessageTime: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
    setSending(false);
    inputRef.current?.focus();
  };
 
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };
 
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";
    return timestamp.toDate().toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit",
    });
  };
 
  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
 
  const groupedMessages = messages.reduce((groups, msg) => {
    const key = msg.createdAt?.toDate
      ? msg.createdAt.toDate().toDateString()
      : "Unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
    return groups;
  }, {});
 
  const filtered = members.filter((m) =>
    m.email.toLowerCase().includes(search.toLowerCase())
  );
 
  const getInitial = (m) => (m.email || "?")[0].toUpperCase();
 
  const getRoleStyle = (role) => ({
    background: role === "Admin" ? "#ede9fe" : role === "Editor" ? "#fef3c7" : "#dcfce7",
    color:      role === "Admin" ? "#5b21f4" : role === "Editor" ? "#d97706" : "#16a34a",
  });
 
  return (
    <div className="msg-root">
 
      {/* ── SIDEBAR ── */}
      <div className="msg-sidebar">
        <div className="msg-sidebar__header">
          <h2 className="msg-sidebar__title">Messages</h2>
          <span className="msg-sidebar__count">{members.length}</span>
        </div>
        <div className="msg-sidebar__search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="msg-sidebar__list">
          {loading ? (
            <div className="msg-sidebar__empty">
              <div className="msg-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="msg-sidebar__empty">
              <span>👥</span>
              <p>
                {members.length === 0
                  ? "No team members yet.\nAdd them in Settings."
                  : "No results found."}
              </p>
            </div>
          ) : (
            filtered.map((member) => (
              <div
                key={member.id}
                className={`msg-member ${selectedUser?.id === member.id ? "msg-member--active" : ""}`}
                onClick={() => openChat(member)}
              >
                <div className="msg-member__avatar">{getInitial(member)}</div>
                <div className="msg-member__info">
                  <span className="msg-member__name">{member.email.split("@")[0]}</span>
                  <span className="msg-member__email">{member.email}</span>
                </div>
                <span className="msg-member__role" style={getRoleStyle(member.role)}>
                  {member.role}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
 
      {/* ── CHAT PANEL ── */}
      <div className="msg-chat">
        {!selectedUser ? (
          <div className="msg-chat__empty">
            <div className="msg-chat__empty-icon">💬</div>
            <h3>Select a team member</h3>
            <p>Choose someone from the left to start a conversation.</p>
          </div>
        ) : (
          <>
            <div className="msg-chat__header">
              <div className="msg-chat__header-avatar">{getInitial(selectedUser)}</div>
              <div className="msg-chat__header-info">
                <span className="msg-chat__header-name">{selectedUser.email.split("@")[0]}</span>
                <span className="msg-chat__header-email">{selectedUser.email}</span>
              </div>
              <span className="msg-member__role" style={getRoleStyle(selectedUser.role)}>
                {selectedUser.role}
              </span>
            </div>
 
            <div className="msg-chat__messages">
              {Object.entries(groupedMessages).map(([dateKey, dayMsgs]) => (
                <div key={dateKey}>
                  <div className="msg-date-divider">
                    <span>{formatDate(dayMsgs[0].createdAt)}</span>
                  </div>
                  {dayMsgs.map((msg, i) => {
                    const isMe = msg.senderId === user.uid;
                    const prevMsg = dayMsgs[i - 1];
                    const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                    return (
                      <div
                        key={msg.id}
                        className={`msg-bubble-wrap ${isMe ? "msg-bubble-wrap--me" : "msg-bubble-wrap--them"}`}
                      >
                        {!isMe && (
                          <div className={`msg-bubble__avatar ${showAvatar ? "" : "msg-bubble__avatar--hidden"}`}>
                            {getInitial(selectedUser)}
                          </div>
                        )}
                        <div className="msg-bubble-col">
                          <div className={`msg-bubble ${isMe ? "msg-bubble--me" : "msg-bubble--them"}`}>
                            {msg.text}
                          </div>
                          <span className={`msg-bubble__time ${isMe ? "msg-bubble__time--me" : ""}`}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="msg-chat__no-messages">
                  <span>👋</span>
                  <p>Start the conversation with {selectedUser.email.split("@")[0]}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
 
            <form className="msg-chat__input-bar" onSubmit={handleSend}>
              <input
                ref={inputRef}
                className="msg-chat__input"
                type="text"
                placeholder={`Message ${selectedUser.email.split("@")[0]}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button
                type="submit"
                className="msg-chat__send"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? "..." : "➤"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
 
export default Messages;