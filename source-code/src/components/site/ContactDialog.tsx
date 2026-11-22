import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const field =
  "mt-1.5 w-full rounded-sm border border-input bg-inset px-3.5 py-3 text-base text-foreground outline-none transition focus:border-primary";

export function ContactDialog({ open, onOpenChange }: Props) {
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name || !email || !message) {
      setStatus("Please fill in name, email and message.");
      return;
    }
    setStatus("Thanks — we will get back to you shortly.");
    form.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setStatus("");
      }}
    >
      <DialogContent className="max-w-lg rounded-sm border-border bg-popover p-7 sm:rounded-sm">
        <p className="eyebrow">Contact</p>
        <DialogTitle className="font-display text-[1.675rem] font-bold tracking-tight">
          Tell me about your project
        </DialogTitle>
        <DialogDescription className="sr-only">Contact form</DialogDescription>
        <form className="mt-2 grid gap-4" noValidate onSubmit={handleSubmit}>
          <label className="text-[13px] font-medium text-muted-foreground">
            Name
            <input className={field} name="name" type="text" autoComplete="name" required />
          </label>
          <label className="text-[13px] font-medium text-muted-foreground">
            Email
            <input className={field} name="email" type="email" autoComplete="email" required />
          </label>
          <label className="text-[13px] font-medium text-muted-foreground">
            Company
            <input className={field} name="company" type="text" autoComplete="organization" />
          </label>
          <label className="text-[13px] font-medium text-muted-foreground">
            Message
            <textarea className={field} name="message" rows={4} required />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="solid" size="hero">
              Send message <ArrowRight />
            </Button>
            <p className="text-sm text-primary" role="status">
              {status}
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
