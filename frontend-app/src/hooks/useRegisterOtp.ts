'use client';

import { useCallback, useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';

/**
 * Sign-up phone check: send a code to the phone, keep the typed code and the resend countdown.
 * `sentTo` is the phone the last code went to, so a form can tell when the phone was changed afterwards.
 */
export function useRegisterOtp() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCodeRaw] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  /** Throws the API error (phone taken, too many codes, Zalo down) for the caller to show. */
  const send = useCallback(async (phone: string) => {
    setSending(true);
    try {
      const r = await authService.sendRegisterOtp(phone);
      setSentTo(phone);
      setCodeRaw('');
      setCooldown(r?.resendAfterSeconds ?? 60);
    } finally {
      setSending(false);
    }
  }, []);

  const setCode = useCallback((v: string) => setCodeRaw(v.replace(/\D/g, '').slice(0, 6)), []);
  const reset = useCallback(() => {
    setSentTo(null);
    setCodeRaw('');
  }, []);

  return { sentTo, code, setCode, cooldown, sending, send, reset, codeValid: /^\d{6}$/.test(code) };
}
