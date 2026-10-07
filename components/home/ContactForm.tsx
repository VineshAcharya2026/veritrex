"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setStatus("ok");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (status === "ok") {
    return (
      <p className="text-sm text-landing-teal" role="status">
        Thanks — your message was sent to {BRAND.email}. We&apos;ll reply soon.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      <div>
        <label htmlFor="contact-name" className="sr-only">
          Name
        </label>
        <input
          id="contact-name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-md border border-landing-teal/20 px-3 py-2 text-sm focus:border-landing-teal focus:outline-none focus:ring-1 focus:ring-landing-teal"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="sr-only">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full rounded-md border border-landing-teal/20 px-3 py-2 text-sm focus:border-landing-teal focus:outline-none focus:ring-1 focus:ring-landing-teal"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="sr-only">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          maxLength={5000}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className="w-full resize-y rounded-md border border-landing-teal/20 px-3 py-2 text-sm focus:border-landing-teal focus:outline-none focus:ring-1 focus:ring-landing-teal"
        />
      </div>
      {status === "error" && errorMsg ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMsg}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-landing-teal text-white hover:bg-landing-teal/90"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
