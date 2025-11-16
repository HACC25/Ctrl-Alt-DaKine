import { type FormEvent, useState } from 'react';
import './InputTextbox.css';

interface InputTextboxProps {
  question: string;
  onSubmit: (value: string) => void;
}

export default function InputTextbox({ question, onSubmit }: InputTextboxProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }

    onSubmit(value);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <h2 className="section-title">{question}</h2>
      <p className="section-subtitle">Describe your degree goals and where you want to stay.</p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="I like UH because..."
        className="input-textbox-input"
        rows={3}
      />
      <button type="submit" disabled={!value.trim()} className="submit-button">
        Submit
      </button>
    </form>
  );
}
