import React, { useState } from "react";
import Checkbox from "./input/Checkbox";


interface Option {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div className="w-full">
            <div
              className="mb-2 flex h-11 rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition dark:border-gray-700 dark:bg-gray-900"
              onClick={toggleDropdown}
            >
              <span className="text-gray-500">
                {selectedOptions.length > 0 ? "Selected options" : "Select option"}
              </span>
              <button
                type="button"
                className="ml-auto px-3 py-1 text-sm text-white bg-primary rounded-md"
              >
                {isOpen ? "Hide Options" : "Show Options"}
              </button>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-40 w-full overflow-y-auto bg-white rounded-lg shadow-sm top-full max-h-60 dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className={`hover:bg-primary/5 w-full cursor-pointer rounded-t border-b border-gray-200 dark:border-gray-800 p-2 ${{
                      "bg-primary/10": selectedOptions.includes(option.value),
                    }}`}
                  >
                    <Checkbox
                      label={option.text}
                      checked={selectedOptions.includes(option.value)}
                      onChange={() => handleSelect(option.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;