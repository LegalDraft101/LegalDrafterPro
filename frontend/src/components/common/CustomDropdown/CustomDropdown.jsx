import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.scss';

function CustomDropdown({ placeholder = 'Select...', options = [], value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    const selected = options.find(o => o.id === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`cdrop ${isOpen ? 'cdrop--open' : ''}`} ref={ref}>
            <button
                type="button"
                className="cdrop__trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`cdrop__label ${selected ? '' : 'cdrop__label--placeholder'}`}>
                    {selected ? selected.title : placeholder}
                </span>
                <span className="cdrop__arrow">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {isOpen && options.length > 0 && (
                <div className="cdrop__menu">
                    {options.map(opt => (
                        <button
                            key={opt.id}
                            type="button"
                            className={`cdrop__item ${opt.id === value ? 'cdrop__item--active' : ''}`}
                            onClick={() => { onChange(opt.id); setIsOpen(false); }}
                        >
                            <span className="cdrop__item-title">{opt.title}</span>
                            {opt.description && (
                                <span className="cdrop__item-desc">{opt.description}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CustomDropdown;
