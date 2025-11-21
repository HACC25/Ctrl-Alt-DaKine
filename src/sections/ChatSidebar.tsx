// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import './ChatSidebar.css';
import { buildApiUrl } from '../config';

export default function ChatSidebar({ answers, insights, isVisible }) {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatMessagesRef = useRef(null);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const sendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const userMessage = userInput.trim();
        setUserInput('');
        const updatedMessages = [...messages, { role: 'user', text: userMessage }];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const context = {
                goal: answers.whyuh || 'Not provided',
                interests: answers.experiencesandinterests || [],
                skills: answers.skills || [],
            };

            if (insights) {
                context.recommended_majors = insights.majors?.map(m => ({
                    name: m.name,
                    campus: m.campus,
                    reason: m.reason
                })) || [];

                context.recommended_campuses = insights.campuses?.map(c => ({
                    name: c.name,
                    score: c.score,
                    reason: c.reason
                })) || [];
            }

            const response = await fetch(buildApiUrl('/api/ask-question'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage,
                    context,
                    conversation_history: updatedMessages.slice(-6)
                })
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`chat-sidebar ${!isVisible ? 'hidden' : ''}`}>
            <h2>Ask Questions</h2>
            <hr />
            <div className="chat-item">
                <h3>Career Path Assistant</h3>
                <p className="chat-description">
                    Ask me anything about your college journey, majors, career paths, or the UH system!
                </p>
                <div className="chat-messages" ref={chatMessagesRef}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.role}`}>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chat-message assistant">
                            <p>Thinking...</p>
                        </div>
                    )}
                </div>
                <div className="chat-input-row">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask about your career path..."
                        disabled={isLoading}
                    />
                    <button onClick={sendMessage} disabled={isLoading || !userInput.trim()}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
