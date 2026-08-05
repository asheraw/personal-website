// Pure logic for Studio -> Bulk Operations (BulkOperationsTool.tsx) --
// deliberately separated from the React/Sanity-client wiring so it can be
// exercised directly (npx tsx) against real fetched data before ever
// touching the UI, the same verification approach used for every export
// format. Every "compute*Changes" function is a pure function: given the
// currently-loaded post data and an intended edit, it returns exactly what
// would change and what it would revert to -- nothing here ever calls
// Sanity's API itself.

export type PostForBulkEdit = {
  _id: string;
  title?: string;
  tags?: string[];
  categories?: { _key?: string; _ref: string }[];
  author?: { _ref: string } | null;
};

export type FieldPath = "tags" | "categories" | "author" | "title" | "excerpt" | "body";

export type FieldChange = {
  postId: string;
  postTitle: string;
  fieldPath: FieldPath;
  previousValue: unknown;
  newValue: unknown;
};

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function computeAddTagChanges(posts: PostForBulkEdit[], tag: string): FieldChange[] {
  const clean = tag.trim();
  if (!clean) return [];
  return posts
    .filter((p) => !(p.tags ?? []).includes(clean))
    .map((p) => ({
      postId: p._id,
      postTitle: p.title ?? "Untitled",
      fieldPath: "tags" as const,
      previousValue: p.tags ?? [],
      newValue: [...(p.tags ?? []), clean],
    }));
}

export function computeRemoveTagChanges(posts: PostForBulkEdit[], tag: string): FieldChange[] {
  return posts
    .filter((p) => (p.tags ?? []).includes(tag))
    .map((p) => ({
      postId: p._id,
      postTitle: p.title ?? "Untitled",
      fieldPath: "tags" as const,
      previousValue: p.tags ?? [],
      newValue: (p.tags ?? []).filter((t) => t !== tag),
    }));
}

export function computeAddCategoryChanges(posts: PostForBulkEdit[], categoryId: string): FieldChange[] {
  return posts
    .filter((p) => !(p.categories ?? []).some((c) => c._ref === categoryId))
    .map((p) => ({
      postId: p._id,
      postTitle: p.title ?? "Untitled",
      fieldPath: "categories" as const,
      previousValue: p.categories ?? [],
      newValue: [...(p.categories ?? []), { _type: "reference", _ref: categoryId, _key: randomKey() }],
    }));
}

export function computeRemoveCategoryChanges(posts: PostForBulkEdit[], categoryId: string): FieldChange[] {
  return posts
    .filter((p) => (p.categories ?? []).some((c) => c._ref === categoryId))
    .map((p) => ({
      postId: p._id,
      postTitle: p.title ?? "Untitled",
      fieldPath: "categories" as const,
      previousValue: p.categories ?? [],
      newValue: (p.categories ?? []).filter((c) => c._ref !== categoryId),
    }));
}

export function computeChangeAuthorChanges(posts: PostForBulkEdit[], authorId: string): FieldChange[] {
  return posts
    .filter((p) => p.author?._ref !== authorId)
    .map((p) => ({
      postId: p._id,
      postTitle: p.title ?? "Untitled",
      fieldPath: "author" as const,
      previousValue: p.author ?? null,
      newValue: { _type: "reference", _ref: authorId },
    }));
}

// ---- Search & replace ------------------------------------------------

export type SearchPost = {
  _id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: unknown[];
};

type PTSpan = { _type?: string; text?: string };
type PTBlock = { _type?: string; children?: PTSpan[] } & Record<string, unknown>;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Scoped to plain paragraph/heading/blockquote/list-item text only --
// not image captions, callout text, code blocks, or accordion content.
// Walking every custom block type's own text fields for a bulk
// find-and-replace would be a lot of special-casing for a feature meant
// to fix a typo across many posts, not rewrite arbitrary structured
// content -- stated plainly here and in the tool's own UI text.
function bodySpans(body: unknown[] | undefined): { block: PTBlock; span: PTSpan }[] {
  const out: { block: PTBlock; span: PTSpan }[] = [];
  for (const node of body ?? []) {
    const block = node as PTBlock;
    if (block._type !== "block" || !Array.isArray(block.children)) continue;
    for (const span of block.children) {
      if (typeof span.text === "string") out.push({ block, span });
    }
  }
  return out;
}

/** Every match's surrounding context, across title/excerpt/body -- capped so one very common term doesn't flood the preview. */
export function findMatchContexts(post: SearchPost, term: string, maxContexts = 6): string[] {
  const contexts: string[] = [];
  const re = new RegExp(escapeRegExp(term), "gi");
  function collect(text: string) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) && contexts.length < maxContexts) {
      const start = Math.max(0, m.index - 30);
      const end = Math.min(text.length, m.index + term.length + 30);
      contexts.push(`${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`);
      if (m.index === re.lastIndex) re.lastIndex++; // guard against a zero-width match looping forever
    }
  }
  if (post.title) collect(post.title);
  if (post.excerpt) collect(post.excerpt);
  for (const { span } of bodySpans(post.body)) {
    if (contexts.length >= maxContexts) break;
    if (span.text) collect(span.text);
  }
  return contexts;
}

function replaceText(text: string, term: string, replacement: string): string {
  return text.replace(new RegExp(escapeRegExp(term), "gi"), replacement);
}

function bodyHasMatch(body: unknown[] | undefined, term: string): boolean {
  const re = new RegExp(escapeRegExp(term), "i");
  return bodySpans(body).some(({ span }) => span.text && re.test(span.text));
}

function replaceInBody(body: unknown[] | undefined, term: string, replacement: string): unknown[] {
  const re = new RegExp(escapeRegExp(term), "gi");
  return (body ?? []).map((node) => {
    const block = node as PTBlock;
    if (block._type !== "block" || !Array.isArray(block.children)) return node;
    return {
      ...block,
      children: block.children.map((span) =>
        typeof span.text === "string" ? { ...span, text: span.text.replace(re, replacement) } : span,
      ),
    };
  });
}

export function computeSearchReplaceChanges(post: SearchPost, term: string, replacement: string): FieldChange[] {
  const changes: FieldChange[] = [];
  const re = new RegExp(escapeRegExp(term), "i");
  if (post.title && re.test(post.title)) {
    changes.push({
      postId: post._id,
      postTitle: post.title,
      fieldPath: "title",
      previousValue: post.title,
      newValue: replaceText(post.title, term, replacement),
    });
  }
  if (post.excerpt && re.test(post.excerpt)) {
    changes.push({
      postId: post._id,
      postTitle: post.title ?? "Untitled",
      fieldPath: "excerpt",
      previousValue: post.excerpt,
      newValue: replaceText(post.excerpt, term, replacement),
    });
  }
  if (bodyHasMatch(post.body, term)) {
    changes.push({
      postId: post._id,
      postTitle: post.title ?? "Untitled",
      fieldPath: "body",
      previousValue: post.body ?? [],
      newValue: replaceInBody(post.body, term, replacement),
    });
  }
  return changes;
}

// ---- Shared summary text ------------------------------------------------

export function affectedPostCount(changes: FieldChange[]): number {
  return new Set(changes.map((c) => c.postId)).size;
}

export function summarizeFieldEdit(
  kind: "addTag" | "removeTag" | "addCategory" | "removeCategory" | "changeAuthor",
  label: string,
  changes: FieldChange[],
): string {
  const n = affectedPostCount(changes);
  const verb = {
    addTag: `Added tag "${label}" to`,
    removeTag: `Removed tag "${label}" from`,
    addCategory: `Added category "${label}" to`,
    removeCategory: `Removed category "${label}" from`,
    changeAuthor: `Changed author to "${label}" on`,
  }[kind];
  return `${verb} ${n} post${n === 1 ? "" : "s"}`;
}

export function summarizeSearchReplace(term: string, replacement: string, changes: FieldChange[]): string {
  const n = affectedPostCount(changes);
  return `Replaced "${term}" with "${replacement}" in ${n} post${n === 1 ? "" : "s"}`;
}
