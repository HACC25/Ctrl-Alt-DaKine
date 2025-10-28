import { useState } from 'react';
import './InputTextbox.css';

export default function InputTextbox({ question, onSubmit }: InputTextboxProps) {
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
    <form onSubmit={handleSubmit} className="input-textbox-form">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={question}
        className="input-textbox-input"
      />
      <button type="submit" disabled={!value.trim()} className="input-textbox-button">
        Submit
      </button>
    </form>
  );
}