interface Highlight {
  url: string;
  date: string;
}

interface DynamicHighlightListProps {
  label: string;
  urlPlaceholder: string;
  values: Highlight[];
  onChange: (values: Highlight[]) => void;
}

export default function DynamicHighlightList({
  label,
  urlPlaceholder,
  values,
  onChange
}: DynamicHighlightListProps) {
  const addField = () => {
    onChange([...values, { url: "", date: "" }]);
  };

  const removeField = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: keyof Highlight, value: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: value };
    onChange(newValues);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value.url}
              onChange={(e) => updateField(index, "url", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm placeholder:text-gray-400 placeholder:opacity-50"
              placeholder={urlPlaceholder}
            />
            <input
              type="date"
              value={value.date}
              onChange={(e) => updateField(index, "date", e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-40"
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
