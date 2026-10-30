'use client';

import { useSyncExternalStore } from 'react';

// The "đom đóm" (fireflies) switch: background particles and the stage sparkles. Kept per browser.
const KEY = '11of-fx';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function fxEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return read();
}

export function setFxEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // private mode: the switch only lasts for this page
  }
  listeners.forEach((l) => l());
}

export function subscribeFx(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFx(): boolean {
  return useSyncExternalStore(subscribeFx, fxEnabled, () => true);
}
