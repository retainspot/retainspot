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
    const [pendingAction, setPendingAction] = useState(null);
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
    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput("");

        setIsThinking(true);
        setActiveAgentId(null);
        setPendingAction(null);

        try {
            const supervisorRes = await fetch("http://localhost:8000/api/supervisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: currentInput }),
            });

            const supervisorJson = JSON.parse(await supervisorRes.json());
            setActiveAgentId(supervisorJson.agent_id);

            if (supervisorJson.agent_id === 1 || supervisorJson.agent_id === 2 || supervisorJson.agent_id === 3 || supervisorJson.agent_id === 4) {
                setPendingAction(supervisorJson);
                setMessages(prev => [...prev, {
                    sender: 'agent',
                    text: `[Supervisor]: ${supervisorJson.supervisor_message}\n\nDo you want to proceed with this action?`,
                    isConfirm: true
                }]);
            } else {
                setMessages(prev => [...prev, { sender: 'agent', text: supervisorJson.supervisor_message }]);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsThinking(false);
        }
    };
    const handleConfirmAction = async (isApproved) => {
        if (!isApproved) {
            setMessages(prev => [...prev, { sender: 'agent', text: "❌ Action cancelled by Admin." }]);
            setPendingAction(null);
            setActiveAgentId(null);
            return;
        }

        setIsThinking(true);
        try {
            const endpoints = {
                1: "/api/worker/update",
                2: "/api/worker/delete",
                3: "/api/worker/create",
                4: "/api/worker/feedback"
            };

            const agentNames = {
                1: "Update",
                2: "Delete",
                3: "Create",
                4: "Feedback"
            };

            const endpoint = endpoints[pendingAction.agent_id];
            const workerRes = await fetch(`http://localhost:8000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pendingAction),
            });

            const workerData = await workerRes.json();

            if (workerRes.ok) {
                const agentName = agentNames[pendingAction.agent_id] || "Unknown";

                setMessages(prev => [...prev, {
                    sender: 'agent',
                    text: `✅ [${agentName} Agent]: ${workerData.agent_response}`
                }]);
            } else {
                throw new Error(workerData.detail || "Worker error");
            }
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'agent', text: `❌ Error: ${error.message}` }]);
        } finally {
            setIsThinking(false);
            setPendingAction(null);
        }
    };

    return (
        <div className="agent-ops-wrapper">
            <div className="ops-sidebar-left">
                <h3 className="ops-title">Active Workers</h3>
                <div className="agent-list">
                    {agents.map(agent => {
                        const isWorking = activeAgentId === agent.id;
                        const isProcessing = isThinking && activeAgentId === null;

                        return (
                            <div
                                key={agent.id}
                                className={`agent-nav-item monitor-mode 
                                ${isWorking ? 'working' : ''} 
                                ${isProcessing ? 'thinking' : ''}`}
                                style={{
                                    backgroundColor: isWorking ? `${agent.color}20` : ''
                                }}
                            >
                                <div className="agent-mini-icon" style={{ background: agent.color }}>
                                    {agent.icon}
                                    {isProcessing && <div className="icon-spinner"></div>}
                                </div>
                                <div className="agent-nav-info">
                                    <p className="nav-name">{agent.name}</p>
                                    <p className="nav-role">
                                        {isWorking ? "Active Now" : (isProcessing ? "Scanning..." : "Idle")}
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

                                {msg.isConfirm && idx === messages.length - 1 && (
                                    <div className="confirm-container">
                                        <button className="confirm-btn approve" onClick={() => handleConfirmAction(true)}>
                                            Confirm execution
                                        </button>
                                        <button className="confirm-btn cancel" onClick={() => handleConfirmAction(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isThinking && <div className="ops-bubble agent thinking-dots">AI is processing...</div>}
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