"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Achievement {
  title: string;
  date: string;
}

interface DynamicAchievementListProps {
  label: string;
  titlePlaceholder: string;
  values: Achievement[];
  onChange: (values: Achievement[]) => void;
}

export default function DynamicAchievementList({
  label,
  titlePlaceholder,
  values,
  onChange
}: DynamicAchievementListProps) {
  const addField = () => {
    onChange([...values, { title: "", date: "" }]);
  };

  const removeField = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: keyof Achievement, value: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: value };
    onChange(newValues);
  };

  const updateDateField = (index: number, date: Date | null) => {
    const newValues = [...values];
    newValues[index] = {
      ...newValues[index],
      date: date ? date.toISOString().split('T')[0] : ""
    };
    onChange(newValues);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={value.title}
              onChange={(e) => updateField(index, "title", e.target.value)}
              className="md:flex-1 w-full px-3 py-2 border rounded-md text-sm placeholder:text-gray-400 placeholder:opacity-50"
              placeholder={titlePlaceholder}
              required
            />
            <div className="flex gap-2">
              <DatePicker
                selected={value.date ? new Date(value.date) : null}
                onChange={(date: Date | null) => updateDateField(index, date)}
                dateFormat="dd/MM/yyyy"
                className="flex-1 md:w-40 px-3 py-2 border rounded-md text-sm"
                placeholderText="Chọn ngày"
                required
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
              />
              <button
                type="button"
                onClick={() => removeField(index)}
                className="px-3 py-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-md transition font-medium text-sm"
                title="Xóa"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 rounded-md border border-green-300 transition"
        >
          <span>+</span>
          <span>Thêm {label.toLowerCase()}</span>
        </button>
      </div>
    </div>
  );
}
