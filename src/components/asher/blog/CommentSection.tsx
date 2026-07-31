"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Loader2, CheckCircle2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { track } from "@/lib/analytics";

type Comment = {
  _id: string;
  name: string;
  message: string;
  createdAt: string;
  isAuthorReply?: boolean;
  parentComment?: string | null;
};

export function CommentSection({ postId, commentsLocked = false }: { postId: string; commentsLocked?: boolean }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const refetch = () => {
    fetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  };

  useEffect(refetch, [postId]);

  const topLevel = comments?.filter((c) => !c.parentComment) ?? [];

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

      {comments && topLevel.length > 0 && (
        <div className="mt-8 space-y-6">
          {topLevel.map((c) => (
            <div key={c._id}>
              <CommentCard comment={c} />
              <ReplyControl
                comment={c}
                postId={postId}
                replyingToId={replyingToId}
                setReplyingToId={setReplyingToId}
                refetch={refetch}
                locked={commentsLocked}
              />

              {comments
                .filter((r) => r.parentComment === c._id)
                .map((r) => (
                  <div key={r._id} className="ml-6 mt-3 sm:ml-10">
                    <CommentCard comment={r} />
                    <ReplyControl
                      comment={r}
                      postId={postId}
                      replyingToId={replyingToId}
                      setReplyingToId={setReplyingToId}
                      refetch={refetch}
                      locked={commentsLocked}
                    />

                    {comments
                      .filter((r3) => r3.parentComment === r._id)
                      .map((r3) => (
                        <div key={r3._id} className="ml-6 mt-3 sm:ml-10">
                          <CommentCard comment={r3} />
                          {/* Reply here still works, per the design -- it just
                              doesn't nest a 4th level. /api/comments flattens
                              it to a sibling of r3, under the same level-2
                              parent (r), which is exactly where it'll render
                              once this list refetches. */}
                          <ReplyControl
                            comment={r3}
                            postId={postId}
                            replyingToId={replyingToId}
                            setReplyingToId={setReplyingToId}
                            refetch={refetch}
                            locked={commentsLocked}
                          />
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        {commentsLocked ? (
          <div className="rounded-2xl border border-amber-faint bg-stage/40 p-6 text-center">
            <p className="text-sm text-stone/70">Comments are closed for this post.</p>
          </div>
        ) : (
          <CommentForm postId={postId} variant="main" onPosted={refetch} />
        )}
      </div>
    </div>
  );
}

// The "Reply" toggle + its inline form, shared across all 3 levels a
// comment can appear at. Always sends the clicked comment's own id as
// parentComment -- /api/comments decides whether that nests one level
// deeper or (once already at the 3rd/deepest level) flattens to a sibling
// instead, so this component never needs to know which case it's in.
// Renders nothing at all once the post's comments are locked -- existing
// replies still show, there's just no way to add another.
function ReplyControl({
  comment,
  postId,
  replyingToId,
  setReplyingToId,
  refetch,
  locked,
}: {
  comment: Comment;
  postId: string;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  refetch: () => void;
  locked: boolean;
}) {
  if (locked) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setReplyingToId(replyingToId === comment._id ? null : comment._id)}
        className="mt-2 inline-flex items-center gap-1.5 font-mono-stage text-[10px] uppercase tracking-[0.18em] text-stone/60 transition-colors hover:text-spotlight"
      >
        <Reply size={12} /> Reply
      </button>

      {replyingToId === comment._id && (
        <div className="mt-3 ml-6 sm:ml-10">
          <CommentForm
            postId={postId}
            parentComment={comment._id}
            variant="reply"
            onPosted={() => {
              setReplyingToId(null);
              refetch();
            }}
            onCancel={() => setReplyingToId(null)}
          />
        </div>
      )}
    </>
  );
}

// Asher's own replies (isAuthorReply, set only via the Studio moderation
// tool's Reply action) render with a spotlight-tinted card and a small
// badge instead of the neutral style every other comment gets, so a reply
// is recognizable at a glance. A visitor's own reply (parentComment set,
// isAuthorReply false) still renders in the normal neutral style -- it's
// just indented under the comment it answers.
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

type FormStatus = "idle" | "submitting" | "success" | "error";

// Shared by the main "leave a comment" form and the compact reply form that
// opens under a top-level comment -- same validation/spam-check/submit
// logic either way, just a smaller footprint and a "Cancel" link when it's
// a reply. Every comment created here (top-level or reply, from anyone but
// Asher's own Studio-side replies) goes into the same moderation queue.
function CommentForm({
  postId,
  parentComment,
  variant,
  onPosted,
  onCancel,
}: {
  postId: string;
  parentComment?: string;
  variant: "main" | "reply";
  onPosted: () => void;
  onCancel?: () => void;
}) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captcha, setCaptcha] = useState({ a: 2, b: 3 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  // Opt-in, unchecked by default -- controlled separately from the rest of
  // the form (a native FormData read, elsewhere in this component) because
  // the shadcn/Radix Checkbox isn't a plain native checkbox input.
  const [notifyOnReply, setNotifyOnReply] = useState(false);

  useEffect(() => {
    setCaptcha({ a: Math.floor(Math.random() * 8) + 2, b: Math.floor(Math.random() * 8) + 2 });
  }, []);

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
          parentComment,
          name: data.name,
          email: data.email,
          message: data.message,
          captchaA: captcha.a,
          captchaB: captcha.b,
          captchaAnswer,
          notifyOnReply,
        }),
      });
      const result = await res.json();
      if (result.success) {
        track({ action: "comment_submit", category: "engagement", label: parentComment ? "reply" : "top_level" });
        setStatus("success");
        form.reset();
        setCaptchaAnswer("");
        setNotifyOnReply(false);
        onPosted();
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

  const isReply = variant === "reply";

  if (status === "success") {
    return (
      <div className={isReply ? "rounded-lg border border-amber-faint bg-stage/40 p-4" : "rounded-2xl border border-amber-faint bg-stage/40 p-6"}>
        <div className="flex flex-col items-center py-2 text-center">
          <CheckCircle2 className={isReply ? "mb-2 h-7 w-7 text-spotlight" : "mb-3 h-10 w-10 text-spotlight"} />
          <p className="font-medium text-ivory">{isReply ? "Reply sent for review" : "Comment sent for review"}</p>
          <p className="mt-1 text-sm text-stone/70">It&rsquo;ll appear here once approved — thanks for reading.</p>
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 font-mono-stage text-[10px] uppercase tracking-[0.2em] text-spotlight hover:underline"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={isReply ? "rounded-lg border border-amber-faint bg-stage/40 p-4" : "rounded-2xl border border-amber-faint bg-stage/40 p-6"}>
      <form onSubmit={onSubmit} className={isReply ? "space-y-3" : "space-y-4"}>
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
            <Label htmlFor={`c-name-${parentComment ?? "main"}`} className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
              Name <span className="text-spotlight">*</span>
            </Label>
            <Input id={`c-name-${parentComment ?? "main"}`} name="name" required placeholder="Jane Doe" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`c-email-${parentComment ?? "main"}`} className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
              Email (not shown publicly) <span className="text-spotlight">*</span>
            </Label>
            <Input id={`c-email-${parentComment ?? "main"}`} name="email" type="email" required placeholder="jane@example.com" className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`c-message-${parentComment ?? "main"}`} className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
            {isReply ? "Reply" : "Comment"} <span className="text-spotlight">*</span>
          </Label>
          <Textarea
            id={`c-message-${parentComment ?? "main"}`}
            name="message"
            required
            rows={isReply ? 3 : 4}
            placeholder={isReply ? "Write a reply…" : "What did you think?"}
            className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40 resize-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`c-notify-${parentComment ?? "main"}`}
            checked={notifyOnReply}
            onCheckedChange={(checked) => setNotifyOnReply(checked === true)}
            className="border-amber-faint data-[state=checked]:bg-spotlight data-[state=checked]:border-spotlight data-[state=checked]:text-stage"
          />
          <Label
            htmlFor={`c-notify-${parentComment ?? "main"}`}
            className="cursor-pointer text-xs font-normal text-stone/70"
          >
            Email me if there&rsquo;s a reply to this
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`c-captcha-${parentComment ?? "main"}`} className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
            Quick check (helps stop spam) <span className="text-spotlight">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <span className="font-mono-stage text-sm text-ivory">
              {captcha.a} + {captcha.b} =
            </span>
            <Input
              id={`c-captcha-${parentComment ?? "main"}`}
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
        <div className="flex items-center gap-3">
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
                {isReply ? "Post Reply" : "Post Comment"} <Send size={14} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/60 hover:text-spotlight"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
