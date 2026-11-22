import { createContext, useContext, useState, type ReactNode } from "react";

import { ContactDialog } from "./ContactDialog";

const ContactContext = createContext<() => void>(() => {});

export function ContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ContactContext.Provider value={() => setOpen(true)}>
      {children}
      <ContactDialog open={open} onOpenChange={setOpen} />
    </ContactContext.Provider>
  );
}

export function useOpenContact() {
  return useContext(ContactContext);
}
