'use client';

import { useState, type DragEvent } from 'react';
import { useApi } from '@/lib/admin/client';
import { Badge, Button, Check, Input, Textarea } from '@/components/admin/ui';

/** One field of a recruitment event's registration form (same shape as the backend's EventFormFields.FormField). */
export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean | null;
  help?: string | null;
  options?: string[] | null;
  source?: string | null;
}

interface ProfileField {
  key: string;
  group: string;
  label: string;
  type: string;
  options: string[] | null;
  readOnly: boolean;
}

export const FIELD_TYPE_LABEL: Record<string, string> = {
  text: 'Văn bản ngắn',
  textarea: 'Đoạn văn',
  number: 'Số',
  date: 'Ngày',
  email: 'Email',
  phone: 'Số điện thoại',
  select: 'Danh sách chọn',
  radio: 'Chọn một',
  checkboxes: 'Chọn nhiều',
  agree: 'Ô xác nhận',
  heading: 'Tiêu đề mục',
  image: 'Ảnh',
  link: 'Đường dẫn',
};

const CUSTOM_ORDER = ['heading', 'text', 'textarea', 'number', 'date', 'phone', 'email', 'select', 'radio', 'checkboxes', 'agree'];
const CHOICE = new Set(['select', 'radio', 'checkboxes']);
const NO_REQUIRED = new Set(['heading', 'image', 'link']);

const MIME_NEW = 'application/x-11of-field-new';
const MIME_MOVE = 'application/x-11of-field-move';

const newId = () => `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function fromProfile(p: ProfileField): FormField {
  return { id: p.key.replace('.', '_'), type: p.type, label: p.label, required: !p.readOnly, help: null, options: p.options, source: p.key };
}

function fromType(type: string): FormField {
  return {
    id: newId(),
    type,
    label: type === 'heading' ? 'Phần mới' : type === 'agree' ? 'Tôi xác nhận thông tin trên là đúng' : FIELD_TYPE_LABEL[type],
    required: !NO_REQUIRED.has(type),
    help: null,
    options: CHOICE.has(type) ? ['Lựa chọn 1', 'Lựa chọn 2'] : null,
    source: null,
  };
}

type Palette = { kind: 'profile'; key: string } | { kind: 'type'; type: string };

/**
 * Drag-and-drop form builder: drag a profile field or a field type from the left into the form,
 * drag fields in the form to reorder them, click a field to edit it. Clicking a palette item adds it at the end
 * (and the arrows move fields), so it also works on touch screens.
 */
export default function FormBuilder({ value, onChange }: { value: FormField[]; onChange: (v: FormField[]) => void }) {
  const catalog = useApi<{ profile: ProfileField[]; defaultForm: FormField[] }>('event-form/fields');
  const [open, setOpen] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const profile = catalog.data?.profile ?? [];
  const used = new Set(value.map((f) => f.source).filter(Boolean) as string[]);
  const groups = Array.from(new Set(profile.map((p) => p.group)));

  function make(p: Palette): FormField | null {
    if (p.kind === 'type') return fromType(p.type);
    const pf = profile.find((x) => x.key === p.key);
    if (!pf || used.has(pf.key)) return null;
    return fromProfile(pf);
  }

  function insert(p: Palette, at: number) {
    const f = make(p);
    if (!f) return;
    const next = [...value];
    next.splice(at, 0, f);
    onChange(next);
    if (p.kind === 'type') setOpen(f.id);
  }

  function move(from: number, to: number) {
    if (from === to || from + 1 === to) return;
    const next = [...value];
    const [f] = next.splice(from, 1);
    next.splice(from < to ? to - 1 : to, 0, f);
    onChange(next);
  }

  const update = (i: number, patch: Partial<FormField>) => onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  // ---- drag & drop ----
  const startPalette = (p: Palette) => (e: DragEvent) => {
    e.dataTransfer.setData(MIME_NEW, JSON.stringify(p));
    e.dataTransfer.effectAllowed = 'copy';
  };
  const startMove = (i: number) => (e: DragEvent) => {
    e.dataTransfer.setData(MIME_MOVE, String(i));
    e.dataTransfer.effectAllowed = 'move';
    setDragging(i);
  };
  const overItem = (i: number) => (e: DragEvent<HTMLElement>) => {
    if (!e.dataTransfer.types.includes(MIME_NEW) && !e.dataTransfer.types.includes(MIME_MOVE)) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1);
  };
  const overEnd = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes(MIME_NEW) && !e.dataTransfer.types.includes(MIME_MOVE)) return;
    e.preventDefault();
    if (e.target === e.currentTarget) setDropAt(value.length);
  };
  function drop(e: DragEvent) {
    e.preventDefault();
    const at = dropAt ?? value.length;
    const n = e.dataTransfer.getData(MIME_NEW);
    const m = e.dataTransfer.getData(MIME_MOVE);
    if (n) insert(JSON.parse(n) as Palette, at);
    else if (m !== '') move(Number(m), at);
    setDropAt(null);
    setDragging(null);
  }
  const endDrag = () => {
    setDropAt(null);
    setDragging(null);
  };

  const Line = ({ show }: { show: boolean }) => <div className={`h-0.5 rounded bg-[#1F7A3A] transition-opacity ${show ? 'opacity-100' : 'opacity-0'}`} />;

  return (
    <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
      {/* palette */}
      <div className="space-y-4 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
        {catalog.error && <p className="text-[13px] text-red-700">{catalog.error}</p>}
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#66766D]">Hồ sơ {g.toLowerCase()}</p>
            <div className="flex flex-wrap gap-1.5 lg:flex-col">
              {profile.filter((p) => p.group === g).map((p) => {
                const isUsed = used.has(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    draggable={!isUsed}
                    onDragStart={startPalette({ kind: 'profile', key: p.key })}
                    onDragEnd={endDrag}
                    onClick={() => insert({ kind: 'profile', key: p.key }, value.length)}
                    disabled={isUsed}
                    title={isUsed ? 'Đã có trong biểu mẫu' : 'Kéo vào biểu mẫu hoặc bấm để thêm'}
                    className="flex items-center gap-2 rounded-md border border-[#C9D5CD] bg-[#F3F8F4] px-2.5 py-1.5 text-left text-[13px] text-[#10231A] hover:border-[#1F7A3A] disabled:cursor-default disabled:border-dashed disabled:bg-white disabled:text-[#9AA8A0] lg:cursor-grab"
                  >
                    <span className="text-[#1F7A3A]">{isUsed ? '✓' : '⠿'}</span>
                    <span className="flex-1">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#66766D]">Trường tùy chỉnh</p>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {CUSTOM_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                draggable
                onDragStart={startPalette({ kind: 'type', type: t })}
                onDragEnd={endDrag}
                onClick={() => insert({ kind: 'type', type: t }, value.length)}
                title="Kéo vào biểu mẫu hoặc bấm để thêm"
                className="flex items-center gap-2 rounded-md border border-[#C9D5CD] bg-white px-2.5 py-1.5 text-left text-[13px] text-[#10231A] hover:border-[#1F7A3A] lg:cursor-grab"
              >
                <span className="text-[#1F7A3A]">+</span>
                <span className="flex-1">{FIELD_TYPE_LABEL[t]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* the form */}
      <div
        onDragOver={overEnd}
        onDrop={drop}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropAt(null);
        }}
        className="min-h-[200px] rounded-lg border-2 border-dashed border-[#DCE5DF] bg-[#FAFCFB] p-2"
      >
        {value.length === 0 && (
          <p className="pointer-events-none px-4 py-16 text-center text-[13px] text-[#66766D]">Kéo trường từ bên trái vào đây để dựng biểu mẫu.</p>
        )}
        {value.map((f, i) => {
          const isOpen = open === f.id;
          return (
            <div key={f.id}>
              <Line show={dropAt === i && dragging !== i && dragging !== i - 1} />
              <div
                draggable={!isOpen}
                onDragStart={startMove(i)}
                onDragEnd={endDrag}
                onDragOver={overItem(i)}
                className={`my-1 rounded-md border bg-white ${isOpen ? 'border-[#1F7A3A]' : 'border-[#DCE5DF]'} ${dragging === i ? 'opacity-40' : ''} ${f.type === 'heading' ? 'bg-[#F3F6F4]' : ''}`}
              >
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <span className="cursor-grab select-none text-[#9AA8A0]" aria-hidden>⠿</span>
                  <button type="button" onClick={() => setOpen(isOpen ? null : f.id)} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-left">
                    <span className={`truncate text-[14px] ${f.type === 'heading' ? 'font-semibold uppercase tracking-wide text-[#1F6B32]' : 'text-[#10231A]'}`}>
                      {f.label || <em className="text-[#9AA8A0]">Chưa có tên</em>}
                      {f.required && <span className="text-red-600"> *</span>}
                    </span>
                    <Badge tone={f.source ? 'green' : 'gray'}>{f.source ? 'Hồ sơ' : FIELD_TYPE_LABEL[f.type] || f.type}</Badge>
                    {f.source && <span className="text-[11px] text-[#66766D]">{FIELD_TYPE_LABEL[f.type]}</span>}
                  </button>
                  <div className="flex shrink-0 items-center">
                    <button type="button" className="px-1.5 text-[#66766D] hover:text-[#10231A] disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Lên">↑</button>
                    <button type="button" className="px-1.5 text-[#66766D] hover:text-[#10231A] disabled:opacity-30" disabled={i === value.length - 1} onClick={() => move(i, i + 2)} aria-label="Xuống">↓</button>
                    <button type="button" className="px-1.5 text-red-700 hover:text-red-900" onClick={() => remove(i)} aria-label="Xoá trường">✕</button>
                  </div>
                </div>
                {isOpen && (
                  <div className="space-y-3 border-t border-[#E6ECE8] px-3 py-3">
                    <label className="block">
                      <span className="mb-1 block text-[12px] text-[#66766D]">{f.type === 'heading' ? 'Tiêu đề' : 'Tên trường'}</span>
                      <Input value={f.label} onChange={(e) => update(i, { label: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[12px] text-[#66766D]">{f.type === 'agree' ? 'Nội dung xác nhận (để trống thì dùng tên trường)' : 'Ghi chú cho cầu thủ'}</span>
                      <Input value={f.help || ''} onChange={(e) => update(i, { help: e.target.value })} />
                    </label>
                    {CHOICE.has(f.type) && (
                      <label className="block">
                        <span className="mb-1 block text-[12px] text-[#66766D]">Các lựa chọn, mỗi dòng một lựa chọn</span>
                        <Textarea
                          rows={4}
                          value={(f.options || []).join('\n')}
                          onChange={(e) => update(i, { options: e.target.value.split('\n') })}
                          onBlur={(e) => update(i, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                        />
                      </label>
                    )}
                    {!NO_REQUIRED.has(f.type) && <Check label="Bắt buộc điền" checked={!!f.required} onChange={(v) => update(i, { required: v })} />}
                    {f.source && (
                      <p className="text-[12px] text-[#66766D]">
                        {f.type === 'image' || f.type === 'link'
                          ? 'Lấy thẳng từ hồ sơ của cầu thủ, cầu thủ không sửa được.'
                          : 'Điền sẵn từ hồ sơ của cầu thủ, cầu thủ có thể sửa trong biểu mẫu.'}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button small onClick={() => setOpen(null)}>Xong</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <Line show={dropAt === value.length && dragging !== value.length - 1} />
        {value.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2">
            <p className="text-[12px] text-[#66766D]">{value.length} trường · kéo để sắp xếp, bấm vào trường để sửa</p>
            {catalog.data && (
              <Button small variant="ghost" onClick={() => onChange(catalog.data!.defaultForm)}>Dùng mẫu mặc định</Button>
            )}
          </div>
        )}
        {value.length === 0 && catalog.data && (
          <div className="flex justify-center pb-4">
            <Button small onClick={() => onChange(catalog.data!.defaultForm)}>Dùng mẫu mặc định</Button>
          </div>
        )}
      </div>
    </div>
  );
}
