"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { track } from "@/lib/analytics";

type Status = "idle" | "submitting" | "success" | "error";

const NOTIFY_EMAIL = "hello@asheraw.com"; // TODO: replace with the real inbox to receive fallback mailto messages

const COUNTRY_CODES = [
  { code: "+65", label: "Singapore (+65)" },
  { code: "+60", label: "Malaysia (+60)" },
  { code: "+62", label: "Indonesia (+62)" },
  { code: "+63", label: "Philippines (+63)" },
  { code: "+66", label: "Thailand (+66)" },
  { code: "+852", label: "Hong Kong (+852)" },
  { code: "+886", label: "Taiwan (+886)" },
  { code: "+86", label: "China (+86)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+82", label: "Korea (+82)" },
  { code: "+91", label: "India (+91)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+64", label: "New Zealand (+64)" },
  { code: "+1", label: "USA / Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "other", label: "Other" },
];

type FormSnapshot = {
  name: string;
  email: string;
  subject: string;
  countryCode: string;
  phone: string;
  message: string;
};

function buildMailtoHref(data: FormSnapshot) {
  const bodyLines = [
    data.message,
    "",
    "---",
    `Name: ${data.name}`,
    `Reply email: ${data.email}`,
    data.phone ? `Phone: ${data.countryCode} ${data.phone}` : null,
  ].filter(Boolean);

  const params = new URLSearchParams({
    subject: data.subject || "Message from asheraw.com",
    body: bodyLines.join("\n"),
  });

  // URLSearchParams encodes spaces as "+"; mailto needs "%20" for a clean body render in most clients.
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${NOTIFY_EMAIL}?${query}`;
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [countryCode, setCountryCode] = useState("+65");
  const [errorMsg, setErrorMsg] = useState("");
  const [captcha, setCaptcha] = useState<{ a: number; b: number }>({ a: 2, b: 3 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [lastSubmission, setLastSubmission] = useState<FormSnapshot | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaptcha({ a: Math.floor(Math.random() * 8) + 2, b: Math.floor(Math.random() * 8) + 2 });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;
	data.countryCode = countryCode;
	console.log(data);

    const snapshot: FormSnapshot = {
      name: data.name || "",
      email: data.email || "",
      subject: data.subject || "",
      countryCode: data.countryCode || "+65",
      phone: data.phone || "",
      message: data.message || "",
    };
    setLastSubmission(snapshot);

    if (honeypot) {
      setStatus("success");
      return;
    }
    if (parseInt(captchaAnswer, 10) !== captcha.a + captcha.b) {
      setStatus("error");
      setErrorMsg("Please solve the math check correctly.");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.success) {
        track({ action: "contact_form_submit", category: "contact", label: "success" });
        setStatus("success");
        form.reset();
        setCaptchaAnswer("");
      } else {
        track({ action: "contact_form_submit", category: "contact", label: "error" });
        setStatus("error");
        setErrorMsg(result.error || "Something went wrong. Please try the email link below.");
      }
    } catch {
      track({ action: "contact_form_submit", category: "contact", label: "network_error" });
      setStatus("error");
      setErrorMsg("Network error — your message wasn't sent. Please use the email link below.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-spotlight/40 bg-spotlight/5 p-8 text-center">
        <CheckCircle2 className="mb-3 h-12 w-12 text-spotlight" />
        <h3 className="font-display text-xl font-semibold text-ivory">Message sent!</h3>
        <p className="mt-2 max-w-sm text-sm text-stone/80">Thanks for reaching out. Asher will get back to you as soon as he can — usually within 1–2 days.</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-5 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight hover:underline">Send another message</button>
      </div>
    );
  }

  if (status === "error" && lastSubmission) {
    const mailtoHref = buildMailtoHref(lastSubmission);
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-destructive" />
        <h3 className="font-display text-xl font-semibold text-ivory">Message failed to send</h3>
        <p className="mt-2 max-w-sm text-sm text-stone/80">{errorMsg}</p>
        <a
          href={mailtoHref}
          onClick={() => track({ action: "contact_mailto_fallback", category: "contact", label: "clicked" })}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-spotlight px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.01]"
        >
          <Mail size={14} />
          Open in your email app
        </a>
        <p className="mt-3 max-w-sm text-xs text-stone/50">This opens your email app with your message already filled in — just hit send.</p>
        <button
          type="button"
          onClick={() => { setStatus("idle"); setErrorMsg(""); }}
          className="mt-4 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight hover:underline"
        >
          Try the form again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="hidden" aria-hidden="true">
        <label>Don&rsquo;t fill this in:<input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">Your Name <span className="text-spotlight">*</span></Label>
          <Input id="name" name="name" required placeholder="Jane Doe" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">Reply Email <span className="text-spotlight">*</span></Label>
          <Input id="email" name="email" type="email" required placeholder="jane@example.com" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">Subject <span className="text-spotlight">*</span></Label>
        <Input id="subject" name="subject" required placeholder="1:1 coaching, workshop enquiry, speaking..." className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
      </div>
      <div className="space-y-2">
        <Label className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">Contact Number (with country code)</Label>
        <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="border-amber-faint bg-stage/40 text-ivory w-full overflow-hidden"><SelectValue placeholder="+65" /></SelectTrigger>
            <SelectContent className="bg-card border-amber-faint max-h-64">
              {COUNTRY_CODES.map((c) => (<SelectItem key={c.code} value={c.code} className="text-ivory focus:bg-spotlight/10 focus:text-spotlight">{c.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input name="phone" type="tel" inputMode="numeric" pattern="[0-9]*" onInput={(e) => {e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");}} placeholder="Your mobile number" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
        </div>
        <p className="text-xs text-stone/50">If your country code isn&rsquo;t listed, select &ldquo;Other&rdquo; and include it in your message.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">Message <span className="text-spotlight">*</span></Label>
        <Textarea id="message" name="message" required rows={5} placeholder="Tell Asher what you&rsquo;re working on, what you need help with, or what you&rsquo;d like to explore together..." className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40 resize-none" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="captcha" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">Quick check (helps stop spam) <span className="text-spotlight">*</span></Label>
        <div className="flex items-center gap-3">
          <span className="font-mono-stage text-sm text-ivory">{captcha.a} + {captcha.b} =</span>
          <Input id="captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required inputMode="numeric" placeholder="?" className="w-20 border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40 text-center" />
        </div>
      </div>
      {status === "error" && !lastSubmission && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle size={16} />{errorMsg}
        </div>
      )}
      <Button type="submit" disabled={status === "submitting"} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-spotlight px-6 py-4 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.01] disabled:opacity-60">
        {status === "submitting" ? (<><Loader2 size={14} className="animate-spin" />Sending...</>) : (<>Send Message<Send size={14} className="transition-transform group-hover:translate-x-1" /></>)}
      </Button>
      <p className="text-center font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/50">Protected against bots · Your details are never shared</p>
    </form>
  );
}
