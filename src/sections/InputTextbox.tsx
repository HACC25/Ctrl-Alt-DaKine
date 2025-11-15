import { useState } from 'react';
import './InputTextbox.css';

export default function InputTextbox({ question, onSubmit } ) {
  // State for local input value
  const [value, setValue] = useState('');

  // Submission handler (the textbox)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      setValue('');
    }
  };


  // Render the textbox form
  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h2 className="section-title">{question}</h2>
      <p className="section-subtitle">Describe your degree goals and where you want to stay.</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={'I like UH because...'}
        className="input-textbox-input"
        rows={3}
      />
      <button type="submit" disabled={!value.trim()} className="submit-button">
        Submit
      </button>
    </form>
  );
}