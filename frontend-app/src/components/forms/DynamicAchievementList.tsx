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
              value={value.title}
              onChange={(e) => updateField(index, "title", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm placeholder:text-gray-400 placeholder:opacity-50"
              placeholder={titlePlaceholder}
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
