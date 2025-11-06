// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import './Summary.css';

export default function Summary({ answers, onEditInterests, onEditSkills, onGenerate, isVisible }) {
    const goal = answers.whyuh || 'Not provided';
    const interests = answers.experiencesandinterests || [];
    const skills = answers.skills || [];

    // AI COMMENT: chatbot state
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatMessagesRef = useRef(null);

    // AI COMMENT: scroll to bottom when messages change
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // AI COMMENT: send message to AI
    const sendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const userMessage = userInput.trim();
        setUserInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/ask-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage,
                    context: { goal, interests, skills }
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
        <div className={`summary-sidebar ${!isVisible ? 'hidden' : ''}`}>
            <h2>Your Inputs</h2>

            {/* Career Goal */}
            <div className="summary-item">
                <h3>Career Goal</h3>
                <p>{goal}</p>
            </div>

            {/* Career Interests */}
            <div className="summary-item">
                <h3>Career Interests</h3>
                <ul>
                    {interests.length > 0
                        ? interests.map(interest => <li key={interest}>{interest}</li>)
                        : <li>No interests selected</li>}
                </ul>
                <button onClick={onEditInterests} className="edit-button">Edit Interests</button>
            </div>

            {/* Skills */}
            <div className="summary-item">
                <h3>Skills</h3>
                <ul>
                    {skills.length > 0
                        ? skills.map(skill => <li key={skill}>{skill}</li>)
                        : <li>No skills selected</li>}
                </ul>
                <button onClick={onEditSkills} className="edit-button">Edit Skills</button>
            </div>

            {/* AI COMMENT: chatbot section */}
            <div className="summary-item">
                <h3>Ask Questions</h3>
                <div className="chat-messages" ref={chatMessagesRef}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.role}`}>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    {isLoading && <div className="chat-message assistant"><p>Thinking...</p></div>}
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
                    <button onClick={sendMessage} disabled={isLoading || !userInput.trim()}>Send</button>
                </div>
            </div>            {/* Generate Path */}
            <div className="generate-actions">
                <button onClick={onGenerate} className="edit-button">Generate Path</button>
            </div>
        </div>
    );
}