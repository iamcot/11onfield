"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface EditProfileContextType {
  isOpen: boolean;
  openEditProfile: () => void;
  closeEditProfile: () => void;
  setOpenCallback: (callback: (() => void) | null) => void;
}

const EditProfileContext = createContext<EditProfileContextType | undefined>(undefined);

export function EditProfileProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCallback, setOpenCallbackState] = useState<(() => void) | null>(null);

  const openEditProfile = useCallback(() => {
    console.log("EditProfileContext: openEditProfile called, callback exists:", !!openCallback);
    if (openCallback) {
      openCallback();
    } else {
      console.warn("EditProfileContext: No callback registered, falling back to setIsOpen");
      setIsOpen(true);
    }
  }, [openCallback]);

  const closeEditProfile = () => setIsOpen(false);

  const setOpenCallback = (callback: (() => void) | null) => {
    setOpenCallbackState(() => callback);
  };

  return (
    <EditProfileContext.Provider value={{ isOpen, openEditProfile, closeEditProfile, setOpenCallback }}>
      {children}
    </EditProfileContext.Provider>
  );
}

export function useEditProfile() {
  const context = useContext(EditProfileContext);
  if (context === undefined) {
    throw new Error("useEditProfile must be used within an EditProfileProvider");
  }
  return context;
}
