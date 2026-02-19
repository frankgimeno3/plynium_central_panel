"use client";

import React, { FC, useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

const DatePicker: FC<DatePickerProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "Seleccionar fecha",
  min,
  max,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar el date picker cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Formatear la fecha para mostrar
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Manejar cambio de fecha desde el input nativo
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(false);
  };

  // Obtener el valor para el input nativo
  const inputValue = value || "";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input visual que muestra la fecha formateada */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors bg-white"
      >
        <div className="flex items-center justify-between">
          <span className={value ? "text-gray-700" : "text-gray-400"}>
            {value ? formatDate(value) : placeholder}
          </span>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Input nativo de fecha (oculto pero funcional) */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <input
            type="date"
            value={inputValue}
            onChange={handleDateChange}
            min={min}
            max={max}
            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onBlur={() => {
              // Pequeño delay para permitir que el click en el calendario se registre
              setTimeout(() => setIsOpen(false), 200);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;





