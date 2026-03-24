import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatWidget.css';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am RetainSpot AI. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await axios.post('http://localhost:8000/api/chat', {
                messages: [...messages, userMessage]
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.content
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I am having trouble connecting. Please try again later.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="chat-widget">
            {isOpen ? (
                <div className="chat-window">
                    <div className="chat-header" style={{
                        background: '#6c47ff',
                        padding: '15px',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '14px' }}>RetainSpot AI</strong>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.role}`}>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        {isTyping && <div className="message assistant">...</div>}
                        <div ref={scrollRef} />
                    </div>
                    <form className="chat-input" onSubmit={handleSendMessage}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button type="submit">Send</button>
                    </form>
                </div>
            ) : (
                <button className="chat-icon" onClick={() => setIsOpen(true)}>
                    <button className="chat-icon" onClick={() => setIsOpen(true)}>
                        <img
                            src="https://media.istockphoto.com/id/2158683000/vector/chat-bot-vector-icon.jpg?s=612x612&w=0&k=20&c=ACzE9Oi5WsYRd3PwaJD2Kcf3DbLpIKiWqSS3vS4806A="
                            alt="Chatbot Icon"
                            className="chat-icon-img"
                        />
                    </button>
                </button>
            )}
        </div>
    );
};

export default ChatWidget;