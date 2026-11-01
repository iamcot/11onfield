"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { eventService } from "@/services/event.service";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterData } from "@/types";
import type { FormField, MyRegistration, RegistrationForm } from "@/types/event";
import { useI18n } from "@/i18n/I18nProvider";

interface Props {
  eventId: number;
  eventTitle: string;
  form: RegistrationForm;
  /** Not signed in: fields start empty, and the guest may make an 11onfield account while sending. */
  guest?: boolean;
  onClose: () => void;
  onSubmitted: (r: MyRegistration) => void;
}

type Values = Record<string, string | string[] | boolean>;

const inputCls =
  "w-full px-3 py-2.5 border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-600";

/** Starting values: what the player sent before, else what their profile says. */
function initialValues(form: RegistrationForm): Values {
  const v: Values = {};
  const sent = new Map((form.registration?.answers ?? []).map((a) => [a.id, a.value]));
  for (const f of form.fields) {
    const raw = sent.has(f.id) ? sent.get(f.id) ?? "" : form.prefill[f.id] ?? "";
    if (f.type === "checkboxes") v[f.id] = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    else if (f.type === "agree") v[f.id] = !!raw;
    else v[f.id] = raw;
  }
  return v;
}

const FOOT_KEY: Record<string, string> = { "Chân phải": "right", "Chân trái": "left", "Hai chân": "both" };
const POSITION_KEY: Record<string, string> = {
  "Tiền đạo": "striker", "Tiền vệ": "midfielder", "Hậu vệ": "defender", "Trung vệ": "centerback", "Thủ môn": "goalkeeper",
};
const PHONE_RE = /^0\d{9}$/;

/**
 * The "Tham gia" form of a recruitment event. Signed in: profile fields come filled in, the player checks and sends.
 * Guest: they type everything; the box "đồng thời đăng ký hồ sơ" (ticked by default) also makes their 11onfield
 * account and profile from the same answers.
 */
export default function RegistrationFormModal({ eventId, eventTitle, form, guest = false, onClose, onSubmitted }: Props) {
  const { t } = useI18n();
  const { register } = useAuth();
  const [makeAccount, setMakeAccount] = useState(true);
  const [account, setAccount] = useState({ fullName: "", phone: "", password: "" });
  // set once the account exists, so a retry after a failed send does not try to make it again
  const [accountMade, setAccountMade] = useState(false);
  const [wasGuest] = useState(guest);
  const [values, setValues] = useState<Values>(() => initialValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState<MyRegistration | null>(null);
  const locked = form.registration?.status === "FORWARDED" || !form.open;
  const [sentBefore] = useState(!!form.registration);
  const fieldOf = (source: string) => form.fields.find((f) => f.source === source);
  const nameField = fieldOf("user.fullName");
  const phoneField = fieldOf("user.phone");
  const valueOf = (f?: FormField) => (f ? String(values[f.id] ?? "").trim() : "");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const set = (id: string, v: string | string[] | boolean) => {
    setValues((s) => ({ ...s, [id]: v }));
    setErrors((e) => {
      if (!e[id]) return e;
      const { [id]: _, ...rest } = e;
      return rest;
    });
  };

  const fromProfile = useMemo(() => new Set(Object.keys(form.prefill)), [form.prefill]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    for (const f of form.fields) {
      if (!f.required || f.type === "heading" || f.type === "image" || f.type === "link") continue;
      const v = values[f.id];
      const empty = Array.isArray(v) ? v.length === 0 : typeof v === "boolean" ? !v : !String(v ?? "").trim();
      if (empty) e[f.id] = t("Vui lòng điền mục này");
    }
    if (wasGuest && makeAccount && !accountMade) {
      const name = nameField ? valueOf(nameField) : account.fullName.trim();
      const phone = (phoneField ? valueOf(phoneField) : account.phone).replace(/[^0-9]/g, "");
      if (!nameField && !name) e.acc_fullName = t("Vui lòng điền mục này");
      if (!PHONE_RE.test(phone)) {
        if (phoneField) e[phoneField.id] = t("Số điện thoại cần 10 số, bắt đầu bằng 0, để tạo tài khoản");
        else e.acc_phone = t("Số điện thoại cần 10 số, bắt đầu bằng 0");
      }
      if (account.password.length < 8) e.acc_password = t("Mật khẩu cần ít nhất 8 ký tự");
    }
    setErrors(e);
    const first = form.fields.find((f) => e[f.id]);
    if (first) document.getElementById(`rf-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (Object.keys(e).length) document.getElementById("rf-account")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (locked || sending) return;
    setServerError("");
    if (!validate()) return;
    setSending(true);
    try {
      let saveToProfile = false;
      if (wasGuest && makeAccount) {
        if (!accountMade) {
          const num = (f?: FormField) => {
            const n = parseInt(valueOf(f), 10);
            return Number.isFinite(n) ? String(n) : undefined;
          };
          const email = valueOf(fieldOf("user.email"));
          const dob = valueOf(fieldOf("user.dob"));
          const positions = valueOf(fieldOf("player.positions")).split(",").map((x) => POSITION_KEY[x.trim()] ?? "").filter(Boolean);
          const data: RegisterData = {
            fullName: nameField ? valueOf(nameField) : account.fullName.trim(),
            phone: (phoneField ? valueOf(phoneField) : account.phone).replace(/[^0-9]/g, ""),
            password: account.password,
            role: "PLAYER",
            ...(email ? { email } : {}),
            ...(dob ? { dob } : {}),
            playerProfile: {
              positions,
              ...(num(fieldOf("player.height")) ? { height: num(fieldOf("player.height")) } : {}),
              ...(num(fieldOf("player.weight")) ? { weight: num(fieldOf("player.weight")) } : {}),
              ...(FOOT_KEY[valueOf(fieldOf("player.preferredFoot"))] ? { preferredFoot: FOOT_KEY[valueOf(fieldOf("player.preferredFoot"))] } : {}),
            },
          };
          try {
            await register(data);
          } catch (err: any) {
            const msg = t(err?.message || "Đăng ký thất bại. Vui lòng thử lại.");
            setServerError(
              /điện thoại|tồn tại|exists/i.test(msg)
                ? t("Số điện thoại này đã có tài khoản 11onfield. Hãy đăng nhập để gửi hồ sơ, hoặc bỏ chọn ô tạo tài khoản.")
                : msg,
            );
            return;
          }
          setAccountMade(true);
        }
        saveToProfile = true;
      }
      const r = await eventService.submitRegistration(eventId, values, saveToProfile);
      setDone(r);
      onSubmitted(r);
    } catch (err: any) {
      setServerError(t(err?.message || "Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setSending(false);
    }
  }

  function renderInput(f: FormField) {
    const v = values[f.id];
    const disabled = locked;
    switch (f.type) {
      case "heading":
        return null;
      case "image":
        return form.prefill[f.id] ? (
          <img src={form.prefill[f.id]} alt={f.label} className="h-32 w-auto rounded-md border border-gray-200 object-cover" />
        ) : (
          <p className="text-sm text-amber-700">{t("Hồ sơ của bạn chưa có ảnh này. Hãy cập nhật trong trang hồ sơ.")}</p>
        );
      case "link":
        return form.prefill[f.id] ? (
          <a href={form.prefill[f.id]} target="_blank" rel="noreferrer" className="text-sm text-green-700 underline break-all">
            {form.prefill[f.id]}
          </a>
        ) : null;
      case "textarea":
        return <textarea rows={4} className={inputCls} value={String(v ?? "")} disabled={disabled} onChange={(e) => set(f.id, e.target.value)} />;
      case "select":
        return (
          <select className={inputCls} value={String(v ?? "")} disabled={disabled} onChange={(e) => set(f.id, e.target.value)}>
            <option value="">{t("— Chọn —")}</option>
            {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case "radio":
        return (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {(f.options ?? []).map((o) => (
              <label key={o} className="flex items-center gap-2 text-[15px]">
                <input type="radio" name={f.id} checked={v === o} disabled={disabled} onChange={() => set(f.id, o)} className="h-4 w-4 accent-green-700" />
                {o}
              </label>
            ))}
          </div>
        );
      case "checkboxes": {
        const list = Array.isArray(v) ? v : [];
        return (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {(f.options ?? []).map((o) => (
              <label key={o} className="flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  checked={list.includes(o)}
                  disabled={disabled}
                  onChange={(e) => set(f.id, e.target.checked ? [...list, o] : list.filter((x) => x !== o))}
                  className="h-4 w-4 accent-green-700"
                />
                {o}
              </label>
            ))}
          </div>
        );
      }
      case "agree":
        return (
          <label className="flex items-start gap-2 text-[15px]">
            <input type="checkbox" checked={!!v} disabled={disabled} onChange={(e) => set(f.id, e.target.checked)} className="mt-1 h-4 w-4 accent-green-700" />
            <span>{f.help || t("Tôi đồng ý")}</span>
          </label>
        );
      default: {
        const type = f.type === "phone" ? "tel" : f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "email" ? "email" : "text";
        return (
          <input
            type={type}
            inputMode={f.type === "number" ? "decimal" : undefined}
            className={inputCls}
            value={String(v ?? "")}
            disabled={disabled}
            onChange={(e) => set(f.id, e.target.value)}
          />
        );
      }
    }
  }

  return (
    // of-modal: the app skin gives modals a solid panel and a dark backdrop
    <div className="of-modal">
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={t("Đăng ký tham gia")}>
      <div className="flex max-h-[100dvh] w-full flex-col bg-white md:max-h-[90vh] md:max-w-2xl md:rounded-lg md:shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">{t("Đăng ký tham gia")}</p>
            <h2 className="mt-0.5 text-lg font-bold leading-snug text-gray-800">{eventTitle}</h2>
          </div>
          <button type="button" onClick={onClose} className="-mr-1 shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label={t("Đóng")}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{sentBefore ? t("Đã cập nhật hồ sơ") : t("Đã gửi hồ sơ")}</h3>
            {wasGuest && makeAccount && (
              <p className="max-w-md rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{t("Tài khoản và hồ sơ 11onfield của bạn đã được tạo từ thông tin trong đơn.")}</p>
            )}
            <p className="max-w-md text-gray-600">
              {wasGuest && !makeAccount
                ? t("11of sẽ kiểm tra và chuyển hồ sơ của bạn tới đơn vị tuyển sinh, rồi báo cho bạn qua email nếu bạn có để lại email.")
                : form.partnerName
                ? t("11of sẽ kiểm tra và chuyển hồ sơ của bạn tới {partner}. Bạn sẽ nhận được email khi hồ sơ đã được chuyển.", { partner: form.partnerName })
                : t("11of sẽ kiểm tra và chuyển hồ sơ của bạn tới đơn vị tuyển sinh. Bạn sẽ nhận được email khi hồ sơ đã được chuyển.")}
            </p>
            <button type="button" onClick={onClose} className="mt-2 rounded-md bg-green-600 px-6 py-2.5 text-white hover:bg-green-700">{t("Đóng")}</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {form.registration?.status === "FORWARDED" ? (
                <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">{t("Hồ sơ đã được chuyển cho đơn vị tuyển sinh nên không sửa được nữa.")}</p>
              ) : !form.open ? (
                <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("Sự kiện đang không nhận đăng ký.")}</p>
              ) : sentBefore ? (
                <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{t("Bạn đã gửi hồ sơ. Có thể sửa và gửi lại cho tới khi 11of chuyển hồ sơ đi.")}</p>
              ) : wasGuest ? (
                <p className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {t("Đã có tài khoản 11onfield?")}{" "}
                  <Link href={`/auth/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`} className="font-semibold text-green-700 underline">
                    {t("Đăng nhập")}
                  </Link>{" "}
                  {t("để thông tin hồ sơ được điền sẵn.")}
                </p>
              ) : fromProfile.size > 0 ? (
                <p className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">{t("Các mục có nhãn “Từ hồ sơ” đã được điền sẵn từ hồ sơ 11of của bạn. Hãy kiểm tra lại trước khi gửi.")}</p>
              ) : null}

              {form.registration?.status === "FORWARDED" ? (
                // what was actually sent, not the current form
                <dl className="divide-y divide-gray-200 rounded-md border border-gray-200">
                  {form.registration.answers.map((a) =>
                    a.type === "heading" ? (
                      <dt key={a.id} className="px-3 pb-1 pt-3 font-bold text-green-800">{a.label}</dt>
                    ) : (
                      <div key={a.id} className="grid gap-1 px-3 py-2 sm:grid-cols-[40%_1fr]">
                        <dt className="text-sm text-gray-500">{a.label}</dt>
                        <dd className="break-words text-[15px] text-gray-800">
                          {a.type === "image" && a.value ? (
                            <img src={a.value} alt={a.label} className="h-24 w-auto rounded border border-gray-200 object-cover" />
                          ) : a.type === "date" && a.value ? (
                            a.value.split("-").reverse().join("/")
                          ) : (
                            a.value || "—"
                          )}
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
              ) : (
              <div className="space-y-4">
                {/* a guest has no profile to take a photo or a profile link from */}
                {form.fields.filter((f) => !(wasGuest && (f.type === "image" || f.type === "link"))).map((f) =>
                  f.type === "heading" ? (
                    <div key={f.id} className="border-b border-green-700/30 pb-1 pt-2">
                      <h3 className="font-bold text-green-800">{f.label}</h3>
                      {f.help && <p className="text-sm text-gray-500">{f.help}</p>}
                    </div>
                  ) : (
                    <div key={f.id} id={`rf-${f.id}`}>
                      {f.type !== "agree" || f.help ? (
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            {f.label}
                            {f.required && <span className="text-red-600"> *</span>}
                          </span>
                          {f.source && fromProfile.has(f.id) && (
                            <span className="rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">{t("Từ hồ sơ")}</span>
                          )}
                        </div>
                      ) : null}
                      {renderInput(f.type === "agree" && !f.help ? { ...f, help: f.label } : f)}
                      {f.help && f.type !== "agree" && <p className="mt-1 text-xs text-gray-500">{f.help}</p>}
                      {errors[f.id] && <p className="mt-1 text-xs text-red-600">{errors[f.id]}</p>}
                    </div>
                  ),
                )}
              </div>
              )}
            </div>

            <div className="border-t px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {wasGuest && !locked && (
                <div id="rf-account" className="mb-3">
                  <label className="flex items-start gap-2 text-[15px]">
                    <input
                      type="checkbox"
                      checked={makeAccount}
                      disabled={accountMade}
                      onChange={(e) => setMakeAccount(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-green-700"
                    />
                    <span className="font-medium text-gray-800">{t("Gửi đơn đồng thời đăng ký hồ sơ trên 11onfield")}</span>
                  </label>
                  {makeAccount && !accountMade && (
                    <div className="mt-2 grid gap-2 pl-6 sm:grid-cols-2">
                      {!nameField && (
                        <div>
                          <input className={inputCls} placeholder={t("Họ và tên")} value={account.fullName} onChange={(e) => setAccount((a) => ({ ...a, fullName: e.target.value }))} />
                          {errors.acc_fullName && <p className="mt-1 text-xs text-red-600">{errors.acc_fullName}</p>}
                        </div>
                      )}
                      {!phoneField && (
                        <div>
                          <input className={inputCls} type="tel" placeholder={t("Số điện thoại")} value={account.phone} onChange={(e) => setAccount((a) => ({ ...a, phone: e.target.value }))} />
                          {errors.acc_phone && <p className="mt-1 text-xs text-red-600">{errors.acc_phone}</p>}
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <input
                          className={inputCls}
                          type="password"
                          autoComplete="new-password"
                          placeholder={t("Đặt mật khẩu tài khoản (ít nhất 8 ký tự)")}
                          value={account.password}
                          onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
                        />
                        {errors.acc_password && <p className="mt-1 text-xs text-red-600">{errors.acc_password}</p>}
                        <p className="mt-1 text-xs text-gray-500">{t("Đăng nhập bằng số điện thoại trong đơn và mật khẩu này để theo dõi hồ sơ.")}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {serverError && <p className="mb-2 text-sm text-red-600">{serverError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 rounded-md bg-gray-100 px-4 py-3 text-gray-700 hover:bg-gray-200 md:flex-none">
                  {locked ? t("Đóng") : t("Huỷ")}
                </button>
                {!locked && (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending}
                    className="flex-[2] rounded-md bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-300 md:ml-auto md:flex-none"
                  >
                    {sending ? t("Đang gửi…") : sentBefore ? t("Gửi lại hồ sơ") : t("Gửi hồ sơ")}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
