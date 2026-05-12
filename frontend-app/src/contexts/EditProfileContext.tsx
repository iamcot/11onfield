"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface EditProfileContextType {
  isOpen: boolean;
  openEditProfile: () => void;
  closeEditProfile: () => void;
}

const EditProfileContext = createContext<EditProfileContextType | undefined>(undefined);

export function EditProfileProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openEditProfile = () => setIsOpen(true);
  const closeEditProfile = () => setIsOpen(false);

  return (
    <EditProfileContext.Provider value={{ isOpen, openEditProfile, closeEditProfile }}>
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
