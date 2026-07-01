import React, { useState, useEffect, useRef } from 'react';
import Icons from './Icons.jsx';
import Avatar from './Avatar.jsx';

export const SearchableSelect = ({
  label,
  name,
  options = [], // [{ value, label, avatar, subtitle }]
  value, // string/number or array
  onChange,
  multiple = false,
  error,
  placeholder = 'Select option...',
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize options
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Filtered options
  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.subtitle && opt.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync active index to boundary
  useEffect(() => {
    if (activeIndex >= filteredOptions.length) {
      setActiveIndex(filteredOptions.length - 1);
    } else if (activeIndex < -1) {
      setActiveIndex(-1);
    }
  }, [filteredOptions, activeIndex]);

  const handleSelectOption = (optValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter(val => val !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      setActiveIndex(prev => (prev + 1 < filteredOptions.length ? prev + 1 : 0));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredOptions.length - 1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[activeIndex].value);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
      e.preventDefault();
    }
  };

  // Helper to check if a value is selected
  const isSelected = (optValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optValue);
    }
    return value === optValue;
  };

  // Get display text/elements for input area
  const renderDisplay = () => {
    if (multiple) {
      const selectedOpts = normalizedOptions.filter(opt => 
        Array.isArray(value) && value.includes(opt.value)
      );
      if (selectedOpts.length === 0) {
        return <span className="text-muted">{placeholder}</span>;
      }
      return (
        <div className="d-flex flex-wrap gap-1 align-items-center">
          {selectedOpts.map(opt => (
            <span 
              key={opt.value} 
              className="badge bg-ws-primary-light text-ws-primary rounded-pill d-flex align-items-center gap-1 py-1 px-2.5 fs-8"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectOption(opt.value);
              }}
            >
              {opt.avatar && <Avatar src={opt.avatar} name={opt.label} size="xs" className="me-0.5" />}
              {opt.label}
              <button 
                type="button" 
                className="btn-close btn-close-ws-primary p-0" 
                style={{ fontSize: '0.65rem' }}
                aria-label="Remove"
              ></button>
            </span>
          ))}
        </div>
      );
    }

    const selectedOpt = normalizedOptions.find(opt => opt.value === value);
    if (!selectedOpt) {
      return <span className="text-muted">{placeholder}</span>;
    }
    return (
      <div className="d-flex align-items-center gap-2">
        {selectedOpt.avatar && <Avatar src={selectedOpt.avatar} name={selectedOpt.label} size="xs" />}
        <span className="text-dark fs-7 fw-medium">{selectedOpt.label}</span>
      </div>
    );
  };

  return (
    <div className={`mb-3 ${className}`} ref={containerRef}>
      {label && (
        <label className="form-label font-heading fw-medium text-dark fs-7 mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="position-relative">
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={`form-control rounded-3 py-2 px-3 fs-6 d-flex align-items-center justify-content-between cursor-pointer ${
            error ? 'is-invalid border-danger' : 'border-ws-border'
          }`}
          style={{ minHeight: '43px', backgroundColor: '#fff' }}
        >
          <div className="flex-grow-1 overflow-hidden">
            {renderDisplay()}
          </div>
          <div className="d-flex align-items-center gap-1.5 ms-2 text-muted">
            {multiple && Array.isArray(value) && value.length > 0 && (
              <span 
                className="fs-8 hover-text-danger" 
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
              >
                Clear
              </span>
            )}
            <Icons.ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </div>

        {isOpen && (
          <div 
            className="position-absolute w-100 bg-white rounded-3 shadow-lg border border-light mt-1.5 overflow-hidden" 
            style={{ zIndex: 1050 }}
          >
            {/* Search Input */}
            <div className="p-2 border-bottom border-light bg-light">
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-2.5 text-muted">
                  <Icons.Search size={14} />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type to filter..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveIndex(-1);
                  }}
                  className="form-control form-control-sm rounded-2 ps-5 py-1.5 fs-8 bg-white border-ws-border"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-auto" style={{ maxHeight: '200px' }}>
              {filteredOptions.length === 0 ? (
                <div className="text-center py-3 text-muted fs-8">No matches found</div>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`d-flex align-items-center justify-content-between px-3 py-2 cursor-pointer transition-all ${
                      isSelected(opt.value) ? 'bg-ws-primary-light text-ws-primary fw-medium' : 'hover-bg-light'
                    } ${idx === activeIndex ? 'bg-slate-100' : ''}`}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      {opt.avatar && <Avatar src={opt.avatar} name={opt.label} size="xs" />}
                      <div>
                        <div className="fs-7 text-dark fw-semibold">{opt.label}</div>
                        {opt.subtitle && <div className="text-muted fs-8 leading-normal">{opt.subtitle}</div>}
                      </div>
                    </div>
                    {isSelected(opt.value) && (
                      <Icons.Check size={16} className="text-ws-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="invalid-feedback d-block fs-7 mt-1 fw-medium text-danger">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
