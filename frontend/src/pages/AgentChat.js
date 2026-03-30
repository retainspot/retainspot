import React, { useState, useEffect } from 'react';
import './AgentChat.css';

const agents = [
    { id: 1, name: "Update Agent", role: "Database Modifier", status: "Active", icon: "🔧", color: "#4da3ff" },
    { id: 2, name: "Delete Agent", role: "Data Cleanup", status: "Active", icon: "🗑️", color: "#ff4d4d" },
    { id: 3, name: "Create Agent", role: "Data Entry", status: "Idle", icon: "📝", color: "#00ff88" },
    { id: 4, name: "Feedback Agent", role: "Review Writer", status: "Active", icon: "✍️", color: "#ffaa00" },
    { id: 5, name: "Summarizer Agent", role: "Behavior Analyst", status: "Active", icon: "🧠", color: "#a259ff" },
];

const AgentChat = () => {
    const [activeAgentId, setActiveAgentId] = useState(() => {
        const savedAgent = localStorage.getItem('active_agent_id');
        return savedAgent ? parseInt(savedAgent) : null;
    });
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('agent_chat_history');
        return saved ? JSON.parse(saved) : [
            { sender: 'agent', text: "Hello Admin, I am your System Supervisor. Tell me any database operation you need." }
        ];
    });
    useEffect(() => {
        localStorage.setItem('agent_chat_history', JSON.stringify(messages));
        if (activeAgentId) {
            localStorage.setItem('active_agent_id', activeAgentId);
        }
    }, [messages, activeAgentId]);
    const [input, setInput] = useState("");
    const clearChat = () => {
        if (window.confirm("Are you sure you want to delete this conversation?")) {
            localStorage.removeItem('agent_chat_history');
            localStorage.removeItem('active_agent_id');
            setMessages([{
                sender: 'agent',
                text: "Hello Admin, I am your System Supervisor. Tell me any database operation you need."
            }]);
            setActiveAgentId(null);
        }
    };
    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input.toLowerCase();
        setInput("");

        setIsThinking(true);
        setActiveAgentId(null);

        setTimeout(() => {
            let assignedId = 5;

            if (currentInput.includes("update") || currentInput.includes("cập nhật")) {
                assignedId = 1;
            } else if (currentInput.includes("delete") || currentInput.includes("xóa")) {
                assignedId = 2;
            } else if (currentInput.includes("create") || currentInput.includes("tạo")) {
                assignedId = 3;
            } else if (currentInput.includes("feedback") || currentInput.includes("viết")) {
                assignedId = 4;
            }

            setActiveAgentId(assignedId);
            setIsThinking(false);

            const selectedAgent = agents.find(a => a.id === assignedId);
            setMessages(prev => [...prev, {
                sender: 'agent',
                text: `[${selectedAgent.name}]: I have been assigned to handle your request. I am now accessing the database for the "${currentInput}" task.`
            }]);
        }, 2000);
    };

    return (
        <div className="agent-ops-wrapper">
            <div className="ops-sidebar-left">
                <h3 className="ops-title">Active Workers</h3>
                <div className="agent-list">
                    {agents.map(agent => {
                        const isWorking = activeAgentId === agent.id;
                        return (
                            <div
                                key={agent.id}
                                className={`agent-nav-item monitor-mode ${isWorking ? 'working' : ''} ${isThinking ? 'thinking' : ''}`}
                            >
                                <div className="agent-mini-icon" style={{ background: agent.color }}>
                                    {agent.icon}
                                    {isThinking && <div className="icon-spinner"></div>}
                                </div>
                                <div className="agent-nav-info">
                                    <p className="nav-name">{agent.name}</p>
                                    <p className="nav-role">
                                        {isWorking ? "Processing..." : (isThinking ? "Connecting..." : "Idle")}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="ops-chat-container">
                <div className="ops-chat-header">
                    <div className="header-agent-info">
                        <h4>System Supervisor</h4>
                        <span className="status-dot">● {isThinking ? "Analyzing Request..." : "Ready"}</span>
                    </div>
                    <button className="clear-chat-btn" onClick={clearChat} title="Clear Chat">
                        Clear
                    </button>
                </div>
                <div className="ops-messages-view">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`ops-bubble-wrapper ${msg.sender}`}>
                            <div className="ops-bubble">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="ops-bubble-wrapper agent">
                            <div className="ops-bubble thinking-dots">Supervisor is thinking...</div>
                        </div>
                    )}
                </div>

                <div className="ops-input-area">
                    <div className="input-inner">
                        <input
                            type="text"
                            placeholder="Enter your command (e.g. 'Update monthly charges...')"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isThinking}
                        />
                        <button
                            className="ops-send-btn"
                            onClick={handleSend}
                            disabled={isThinking}
                            style={{ opacity: isThinking ? 0.5 : 1 }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>

            <div className="ops-sidebar-right">
                {activeAgentId ? (
                    <>
                        <div className="agent-profile-card">
                            <div className="profile-large-icon" style={{ background: agents.find(a => a.id === activeAgentId).color }}>
                                {agents.find(a => a.id === activeAgentId).icon}
                            </div>
                            <h3>{agents.find(a => a.id === activeAgentId).name}</h3>
                            <p className="profile-role-tag">Current Processor</p>
                        </div>
                        <div className="agent-stats-grid">
                            <div className="stat-card"><span>Uptime</span><h4>99.9%</h4></div>
                            <div className="stat-card"><span>Status</span><h4>Working</h4></div>
                        </div>
                    </>
                ) : (
                    <div className="no-agent-info">
                        <p>Waiting for Supervisor ...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentChat;