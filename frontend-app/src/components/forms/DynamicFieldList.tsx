interface DynamicFieldListProps {
  label: string;
  placeholder: string;
  helpText?: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export default function DynamicFieldList({
  label,
  placeholder,
  helpText,
  values,
  onChange
}: DynamicFieldListProps) {
  const addField = () => {
    onChange([...values, ""]);
  };

  const removeField = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateField = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {helpText && (
        <p className="text-xs text-gray-500 mb-3">{helpText}</p>
      )}
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(index, e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm placeholder:text-gray-400 placeholder:opacity-50"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeField(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition"
              title="Xóa"
            >
              ×
            </button>
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
