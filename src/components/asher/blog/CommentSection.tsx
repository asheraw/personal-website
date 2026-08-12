"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, CheckCircle2, Reply, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { track } from "@/lib/analytics";

type Comment = {
  _id: string;
  name: string;
  message: string;
  gifUrl?: string;
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
        {comment.message && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ivory/90">{comment.message}</p>
        )}
        {comment.gifUrl && <CommentGif url={comment.gifUrl} />}
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
      {comment.message && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone/85">{comment.message}</p>
      )}
      {comment.gifUrl && <CommentGif url={comment.gifUrl} />}
    </div>
  );
}

// Plain <img>, deliberately never wrapped in an <a> -- the whole point of
// rendering a GIF this way (see gif-search/route.ts and /api/comments's
// isGiphyUrl check) is that it's never a clickable link, so it can't
// reopen the "no clickable URLs" spam concern this feature was scoped
// around. next/image is skipped on purpose: it re-encodes through Next's
// image optimizer, which isn't guaranteed to preserve GIF animation.
function CommentGif({ url }: { url: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- animated GIF, not safe to route through next/image's optimizer
    <img
      src={url}
      alt=""
      loading="lazy"
      className="mt-2 max-h-64 rounded-lg border border-amber-faint/60 object-contain"
    />
  );
}

// A curated set, not a full searchable emoji database -- this is a quick
// reaction picker for blog comments, not a chat app. Most visitors already
// have a native emoji keyboard shortcut (Win+. / Cmd+Ctrl+Space); this is
// just a visible, one-click option for anyone who doesn't know it.
const COMMENT_EMOJIS = [
  "😀", "😂", "😅", "😍", "🥲", "😎", "🤔", "😭",
  "🥹", "😮", "🙌", "👏", "🙏", "👍", "👎", "✌️",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🔥",
  "✨", "🎉", "💯", "😢", "😡", "🤯", "😴", "🥳",
  "🤝", "👀", "💀", "🫠", "🤡", "☕", "📚", "🎬",
  "🍪", "🌈", "⭐", "💡", "🎯", "🙈", "😇", "🤗",
];

// Inserts at the cursor position, not just appended -- the message field is
// an uncontrolled textarea (read via FormData on submit, same as every
// other field here), so this mutates the DOM node directly through the
// ref rather than adding React state just to track message text.
function EmojiPickerButton({ textareaRef }: { textareaRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const [open, setOpen] = useState(false);

  function insert(emoji: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + emoji + el.value.slice(end);
    const cursor = start + emoji.length;
    el.selectionStart = el.selectionEnd = cursor;
    el.focus();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Insert emoji"
          className="rounded-full p-1 text-stone/60 transition-colors hover:text-spotlight"
        >
          <Smile size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 border-amber-faint bg-stage p-2">
        <div className="grid grid-cols-8 gap-1">
          {COMMENT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insert(emoji)}
              className="rounded text-lg leading-none transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type GifResult = { id: string; title: string; thumbUrl: string; url: string };
type SelectedGif = { url: string; title: string };

// Search-as-you-type against /api/gif-search (a server-side proxy to
// Giphy, keeping the API key out of the browser and forcing a "g" content
// rating on every request). Debounced 350ms so normal typing doesn't fire
// a request per keystroke; opening the picker with an empty query shows
// Giphy's trending results instead of a blank panel.
function GifPickerButton({ onSelect }: { onSelect: (gif: SelectedGif) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadError(false);
    const timer = setTimeout(() => {
      fetch(`/api/gif-search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.gifs) setGifs(data.gifs);
          else setLoadError(true);
        })
        .catch(() => {
          if (!cancelled) setLoadError(true);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setGifs(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Attach a GIF"
          className="rounded-full border border-amber-faint/60 px-2 py-0.5 font-mono-stage text-[10px] uppercase tracking-[0.1em] text-stone/60 transition-colors hover:border-spotlight/60 hover:text-spotlight"
        >
          GIF
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 border-amber-faint bg-stage p-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Giphy…"
          className="mb-2 w-full rounded border border-amber-faint bg-stage/60 px-2 py-1.5 text-sm text-ivory outline-none placeholder:text-stone/40 focus-visible:border-spotlight"
        />
        <div className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto">
          {gifs === null && !loadError && (
            <p className="col-span-3 py-4 text-center text-xs text-stone/50">Loading…</p>
          )}
          {loadError && (
            <p className="col-span-3 py-4 text-center text-xs text-stone/50">Couldn&rsquo;t load GIFs — try again.</p>
          )}
          {gifs && gifs.length === 0 && (
            <p className="col-span-3 py-4 text-center text-xs text-stone/50">No results.</p>
          )}
          {gifs?.map((gif) => (
            <button
              key={gif.id}
              type="button"
              onClick={() => {
                onSelect({ url: gif.url, title: gif.title });
                setOpen(false);
              }}
              className="aspect-square overflow-hidden rounded bg-stage/60 transition-opacity hover:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF thumbnail, not safe to route through next/image's optimizer */}
              <img src={gif.thumbUrl} alt={gif.title} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-stone/40">Powered by GIPHY</p>
      </PopoverContent>
    </Popover>
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
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [selectedGif, setSelectedGif] = useState<SelectedGif | null>(null);
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

    // A GIF alone is a valid comment (Asher's own call -- "it is also a
    // response"), so message isn't a required field anymore -- but at
    // least one of the two has to be there. Checked client-side too, not
    // just by /api/comments, so this fails fast instead of round-tripping
    // for something catchable immediately.
    if (!data.message?.trim() && !selectedGif) {
      setStatus("error");
      setErrorMsg("Write something or attach a GIF before sending.");
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
          gifUrl: selectedGif?.url,
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
        setSelectedGif(null);
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
          <div className="flex items-center justify-between">
            <Label htmlFor={`c-message-${parentComment ?? "main"}`} className="font-mono-stage text-[10px] uppercase tracking-[0.2em] text-stone/70">
              {isReply ? "Reply" : "Comment"}
            </Label>
            <div className="flex items-center gap-2">
              <GifPickerButton onSelect={setSelectedGif} />
              <EmojiPickerButton textareaRef={messageRef} />
            </div>
          </div>
          <Textarea
            ref={messageRef}
            id={`c-message-${parentComment ?? "main"}`}
            name="message"
            rows={isReply ? 3 : 4}
            placeholder={isReply ? "Write a reply… (or just attach a GIF)" : "What did you think? (or just attach a GIF)"}
            className="border-amber-faint bg-stage/40 text-ivory placeholder:text-stone/40 resize-none"
          />
          {selectedGif && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF, not safe to route through next/image's optimizer */}
              <img
                src={selectedGif.url}
                alt={selectedGif.title}
                className="max-h-40 rounded-lg border border-amber-faint/60 object-contain"
              />
              <button
                type="button"
                onClick={() => setSelectedGif(null)}
                aria-label="Remove GIF"
                className="absolute -right-2 -top-2 rounded-full bg-stage p-1 text-stone/70 shadow-sm ring-1 ring-amber-faint transition-colors hover:text-spotlight"
              >
                <X size={12} />
              </button>
            </div>
          )}
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
