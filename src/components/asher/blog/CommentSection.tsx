"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";

type Comment = {
  _id: string;
  name: string;
  message: string;
  createdAt: string;
  isAuthorReply?: boolean;
  parentComment?: string | null;
};
type Status = "idle" | "submitting" | "success" | "error";

export function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captcha, setCaptcha] = useState({ a: 2, b: 3 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    setCaptcha({ a: Math.floor(Math.random() * 8) + 2, b: Math.floor(Math.random() * 8) + 2 });
    fetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  }, [postId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    if (honeypot) {
      setStatus("success");
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          name: data.name,
          email: data.email,
          message: data.message,
          captchaA: captcha.a,
          captchaB: captcha.b,
          captchaAnswer,
        }),
      });
      const result = await res.json();
      if (result.success) {
        track({ action: "comment_submit", category: "engagement", label: "success" });
        setStatus("success");
        form.reset();
        setCaptchaAnswer("");
      } else {
        track({ action: "comment_submit", category: "engagement", label: "error" });
        setStatus("error");
        setErrorMsg(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — your comment wasn't sent. Please try again.");
    }
  }

  return (
    <div id="comments" className="mt-16 scroll-mt-24 border-t border-amber-faint pt-10">
      <div className="flex items-center gap-2">
        <MessageCircle size={18} className="text-spotlight" />
        <h2 className="font-display text-2xl font-semibold text-ivory">
          {comments === null
            ? "Comments"
            : comments.length === 0
            ? "Start the Conversation"
            : `${comments.length} Comment${comments.length === 1 ? "" : "s"}`}
        </h2>
      </div>

      {comments && comments.length > 0 && (
        <div className="mt-8 space-y-6">
          {comments
            .filter((c) => !c.parentComment)
            .map((c) => (
              <div key={c._id}>
                <CommentCard comment={c} />
                {comments
                  .filter((r) => r.parentComment === c._id)
                  .map((r) => (
                    <div key={r._id} className="ml-6 mt-3 sm:ml-10">
                      <CommentCard comment={r} />
                    </div>
                  ))}
              </div>
            ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-amber-faint bg-stage/40 p-6">
        {status === "success" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-spotlight" />
            <p className="font-medium text-ivory">Comment sent for review</p>
            <p className="mt-1 text-sm text-stone/70">
              It&rsquo;ll appear here once approved — thanks for reading.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-4 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight hover:underline"
            >
              Leave another comment
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="hidden" aria-hidden="true">
              <label>
                Don&rsquo;t fill this in:
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-name" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
                  Name <span className="text-spotlight">*</span>
                </Label>
                <Input id="c-name" name="name" required placeholder="Jane Doe" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
                  Email (not shown publicly) <span className="text-spotlight">*</span>
                </Label>
                <Input id="c-email" name="email" type="email" required placeholder="jane@example.com" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-message" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
                Comment <span className="text-spotlight">*</span>
              </Label>
              <Textarea id="c-message" name="message" required rows={4} placeholder="What did you think?" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40 resize-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-captcha" className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
                Quick check (helps stop spam) <span className="text-spotlight">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <span className="font-mono-stage text-sm text-ivory">
                  {captcha.a} + {captcha.b} =
                </span>
                <Input
                  id="c-captcha"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                  inputMode="numeric"
                  placeholder="?"
                  className="w-20 border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40 text-center"
                />
              </div>
            </div>
            {status === "error" && <p className="text-sm text-destructive">{errorMsg}</p>}
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="group inline-flex items-center gap-2 rounded-full bg-spotlight px-6 py-3 font-mono-stage text-xs uppercase tracking-[0.2em] text-stage transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  Post Comment <Send size={14} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// Asher's own replies (isAuthorReply, set only via the Studio moderation
// tool's Reply action -- visitors can't create these) render with a
// spotlight-tinted card and a small badge instead of the neutral style
// every other comment gets, so a reply is recognizable at a glance.
function CommentCard({ comment }: { comment: Comment }) {
  if (comment.isAuthorReply) {
    return (
      <div className="rounded-lg border border-spotlight/40 bg-spotlight/[0.06] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-spotlight">
            {comment.name}
            <span className="rounded-full bg-spotlight/15 px-2 py-0.5 font-mono-stage text-[9px] uppercase tracking-[0.14em] text-spotlight">
              Author
            </span>
          </p>
          <p className="font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/50">
            {new Date(comment.createdAt).toLocaleDateString()}
          </p>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ivory/90">{comment.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-faint bg-stage/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ivory">{comment.name}</p>
        <p className="font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/50">
          {new Date(comment.createdAt).toLocaleDateString()}
        </p>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone/85">{comment.message}</p>
    </div>
  );
}
