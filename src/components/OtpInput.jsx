import React, { useRef, useEffect } from 'react';

/**
 * Modern 6-digit OTP Input component.
 * Supports:
 * - Auto-focus first input on mount
 * - Numeric-only input
 * - Auto-advance to next input on typing
 * - Backspace jumps to previous input
 * - Arrow key navigation (Left/Right)
 * - Paste support for 6-digit code
 * - Accessible labels
 */
const OtpInput = ({ value = '', onChange, disabled = false, error = false, length = 6 }) => {
  const inputRefs = useRef([]);

  // Ensure digits array is of correct length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  // Auto-focus first input on mount
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index, e) => {
    const rawVal = e.target.value;
    // Only accept numeric characters
    const numericChar = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = numericChar;
    const combined = newDigits.join('').slice(0, length);
    onChange(combined);

    if (numericChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is already empty; move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    // Focus the box corresponding to the pasted length or the last box
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold rounded-xl sm:rounded-2xl border transition-all outline-none select-none
              ${disabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-gray-50/90 text-gray-900'}
              ${error ? 'border-red-400 bg-red-50/30 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-100' : ''}
              ${!error && isFilled ? 'border-purple-500 bg-purple-50/30 text-purple-900 shadow-sm' : ''}
              ${!error && !isFilled ? 'border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100' : ''}
            `}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
