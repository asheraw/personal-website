import {defineType, defineArrayMember, defineField} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {UlistIcon} from '@sanity/icons/Ulist'
import {PlayIcon} from '@sanity/icons/Play'
import {ComponentIcon} from '@sanity/icons/Component'
import {LinkIcon} from '@sanity/icons/Link'
import {DocumentIcon} from '@sanity/icons/Document'
import {TagIcon} from '@sanity/icons/Tag'
import {DoubleQuoteIcon} from '@sanity/icons/DoubleQuote'
import {TEXT_COLORS} from '../../lib/textColors'
import {SavedStatusInput} from '../components/SavedStatusInput'
import {BulkImagePickerInput} from '../components/BulkImagePickerInput'

/**
 * This is the schema type for block content used in the post document type
 * Importing this type into the studio configuration's `schema` property
 * lets you reuse it in other document types with:
 *  {
 *    name: 'someName',
 *    title: 'Some title',
 *    type: 'blockContent'
 *  }
 */

const CODE_LANGUAGES = [
  {title: 'Plain text', value: 'text'},
  {title: 'JavaScript', value: 'javascript'},
  {title: 'TypeScript', value: 'typescript'},
  {title: 'HTML', value: 'html'},
  {title: 'CSS', value: 'css'},
  {title: 'JSON', value: 'json'},
  {title: 'Bash / Shell', value: 'bash'},
  {title: 'Python', value: 'python'},
  {title: 'Markdown', value: 'markdown'},
]

// Shared by the single Accordion block and each item inside an Accordion
// Group -- both need the exact same deliberately restricted rich text
// (bold/italic/underline/lists/a plain URL link, no headings/blockquotes/
// custom annotations), and a factory function is what keeps that in sync
// between the two rather than two hand-copied definitions drifting apart
// the way Story/Play's own duplicated prose once did (see RUNBOOK.md).
function accordionContentField() {
  return defineField({
    name: 'content',
    title: 'Content (hidden until clicked)',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [{title: 'Normal', value: 'normal'}],
        lists: [
          {title: 'Bullet', value: 'bullet'},
          {title: 'Numbered', value: 'number'},
        ],
        marks: {
          decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'},
            {title: 'Underline', value: 'underline'},
          ],
          annotations: [
            {
              title: 'URL',
              name: 'link',
              type: 'object',
              icon: LinkIcon,
              fields: [
                {title: 'URL', name: 'href', type: 'url'},
                {
                  title: 'Open in the same tab instead',
                  name: 'openInSameTab',
                  type: 'boolean',
                  initialValue: false,
                },
              ],
            },
          ],
        },
      }),
    ],
  })
}

export const blockContentType = defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      // Styles let you define what blocks can be marked up as. The default
      // set corresponds with HTML tags, but you can set any title or value
      // you want, and decide how you want to deal with it where you want to
      // use your content.
      // No "H1" choice on purpose -- the post title itself is the page's
      // one H1 (rendered outside this field entirely, see PostPage's own
      // <h1>), so offering H1 here would just invite multiple-H1 pages.
      // Values (h2/h3/h4) are unchanged from before, only the labels are
      // friendlier -- style *values* are what's actually stored per block
      // and what src/lib/portableText.ts's extractH2Checkpoints() and the
      // reading-bar checkpoints key off, so renaming labels here is purely
      // cosmetic and doesn't touch any already-written post.
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Header', value: 'h2'},
        {title: 'Subhead', value: 'h3'},
        {title: 'Minor Heading', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      // Marks let you mark up inline text in the Portable Text Editor
      marks: {
        // Decorators usually describe a single property – e.g. a typographic
        // preference or highlighting
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Strike', value: 'strike-through'},
          {title: 'Inline code', value: 'code'},
        ],
        // Annotations can be any object structure – e.g. a link or a footnote.
        annotations: [
          // Two separate, distinctly-iconed toolbar buttons on purpose --
          // without an explicit icon on each, Sanity falls back to the same
          // generic link icon for both, so they're easy to mistake for one
          // single button (this is why the internal-link option below was
          // hard to discover even though it already existed).
          {
            title: 'External URL',
            name: 'link',
            type: 'object',
            icon: LinkIcon,
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
              {
                title: 'Open in the same tab instead',
                name: 'openInSameTab',
                type: 'boolean',
                description: 'External links open in a new tab by default. Turn this on for the rare case you want it to replace the current page instead (e.g. linking to your own site under a different domain).',
                initialValue: false,
              },
            ],
          },
          // Links to another post by reference (its stable _id), not a
          // pasted URL -- the link keeps working even if that post's slug
          // changes later, since the current slug is only resolved at
          // render time (POST_BY_SLUG_QUERY), not baked in when the link is
          // created. Uses Sanity's own built-in reference search (type to
          // filter by title) rather than a custom picker, so this stays
          // fast -- nothing extra to build or load.
          {
            title: 'Internal link (post)',
            name: 'internalLink',
            type: 'object',
            icon: DocumentIcon,
            fields: [
              defineField({
                name: 'reference',
                title: 'Post',
                type: 'reference',
                to: [{type: 'post'}],
              }),
            ],
            preview: {
              select: {title: 'reference.title'},
              prepare: ({title}) => ({title: title ? `→ ${title}` : 'Internal link'}),
            },
          },
          // A separate annotation from the plain URL one, not a checkbox on
          // it -- distinct so it's obvious at a glance while writing which
          // links are affiliate links, so the link checker can tell them
          // apart in its registry, and so the rendered post can render
          // `rel="sponsored"` and show a disclosure banner automatically
          // (bodyHasAffiliateLinks in src/lib/portableText.ts) without a
          // writer ever needing to remember to add one by hand.
          {
            title: 'Affiliate link',
            name: 'affiliateLink',
            type: 'object',
            icon: TagIcon,
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
          // Named colors only -- deliberately not a hex/RGB picker. Each
          // name maps (see textColors.ts + globals.css) to one shade tuned
          // for dark mode and a separately-chosen shade for light mode, so
          // there's no hex value here for a writer to accidentally pick
          // that reads fine in one theme and vanishes in the other.
          {
            title: 'Text color',
            name: 'textColor',
            type: 'object',
            fields: [
              defineField({
                name: 'color',
                title: 'Color',
                type: 'string',
                options: {list: [...TEXT_COLORS]},
                validation: (rule) => rule.required(),
              }),
            ],
            preview: {
              select: {color: 'color'},
              prepare: ({color}) => ({title: `Color: ${color ?? 'none'}`}),
            },
          },
        ],
      },
    }),
    // You can add additional types here. Note that you can't use
    // primitive types such as 'string' and 'number' in the same array
    // as a block type.
    // One block for both a single photo and a multi-photo carousel/
    // slideshow -- adding one or more "More photos" turns an ordinary
    // Image into a gallery automatically, so there's only one button in
    // the toolbar instead of two. A block with no additionalImages
    // renders exactly like a plain image always has (see
    // portableTextComponents.tsx); Display style only appears once a
    // second photo is added. Rendered by ImageCarousel.tsx when it is one.
    defineArrayMember({
      type: 'image',
      icon: ImageIcon,
      options: {hotspot: true},
      components: {input: SavedStatusInput},
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          description: 'Describe the image for screen readers and search engines.',
        }),
        defineField({
          name: 'caption',
          type: 'string',
          title: 'Caption (optional)',
          description: 'Shown beneath the image.',
        }),
        defineField({
          name: 'additionalImages',
          title: 'More photos (optional -- turns this into a carousel)',
          type: 'array',
          components: {input: BulkImagePickerInput},
          // Sanity's own default array-of-images rendering is one full-width
          // row per photo (drag handle, thumbnail, filename, a "..." menu) --
          // fine for two or three, genuinely chunky for the ten-plus photo
          // batches BulkImagePickerInput's own "Add multiple" button is built
          // for. `layout: 'grid'` is Sanity Studio's own built-in alternative
          // for exactly this: small square tiles instead of full rows.
          options: {layout: 'grid'},
          of: [
            defineArrayMember({
              type: 'image',
              options: {hotspot: true},
              fields: [
                defineField({
                  name: 'alt',
                  type: 'string',
                  title: 'Alternative text',
                  description: 'Describe the image for screen readers and search engines.',
                }),
                defineField({
                  name: 'caption',
                  type: 'string',
                  title: 'Caption (optional)',
                  description: 'Shown beneath the image while it\'s the one showing.',
                }),
              ],
            }),
          ],
          description:
            'Add one or more extra photos here and the image above becomes the first photo in a carousel, alongside these.',
        }),
        defineField({
          name: 'displayStyle',
          title: 'Display style',
          type: 'string',
          hidden: ({parent}) => !((parent as {additionalImages?: unknown[]})?.additionalImages?.length),
          options: {
            list: [
              {title: 'Carousel (reader clicks through)', value: 'carousel'},
              {title: 'Slideshow (auto-advances on its own)', value: 'slideshow'},
              {title: 'Scrolling strip (variable width, auto-scrolls)', value: 'scroll-strip'},
              {title: 'Masonry grid (many photos at once, Pinterest-style)', value: 'masonry'},
            ],
          },
          // Scrolling strip, not Slideshow -- Asher's own call: he doesn't
          // want a display style that needs the reader to click through
          // manually, and prefers photos just showing automatically.
          initialValue: 'scroll-strip',
        }),
        defineField({
          name: 'displaySize',
          title: 'Display size',
          type: 'string',
          description:
            'How wide this shows in the post. "Original" fills the post column, same as always -- pick Small or Medium for a photo that doesn\'t need to dominate the page, or "Wide" to break out past the column on desktop (useful for a gallery with a lot of photos in it -- more fit per row instead of one long scroll). Readers can still tap/click through to the full-size original either way. "Wide" looks the same as "Original" on a phone -- there isn\'t extra screen width to break out into there.',
          options: {
            list: [
              {title: 'Small', value: 'small'},
              {title: 'Medium', value: 'medium'},
              {title: 'Original (fills the column)', value: 'original'},
              {title: 'Wide (breaks out of the column on desktop)', value: 'wide'},
            ],
          },
          initialValue: 'original',
        }),
      ],
      preview: {
        select: {alt: 'alt', asset: 'asset', additionalImages: 'additionalImages', displayStyle: 'displayStyle'},
        prepare: ({alt, asset, additionalImages, displayStyle}) => {
          const extra = (additionalImages as unknown[] | undefined)?.length ?? 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Studio resolves an image-asset preview from this shape at runtime, but PreviewValue['media'] is only typed for React nodes.
          const media = {_type: 'image', asset} as any;
          if (!extra) return {title: alt || 'Image', media};
          const label =
            displayStyle === 'slideshow'
              ? 'Slideshow'
              : displayStyle === 'scroll-strip'
                ? 'Scrolling strip'
                : displayStyle === 'masonry'
                  ? 'Masonry grid'
                  : 'Carousel';
          return {title: `Image ${label} (${extra + 1} photos)`, media};
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'divider',
      title: 'Divider',
      icon: UlistIcon,
      fields: [defineField({name: 'style', type: 'string', hidden: true, initialValue: 'divider'})],
      preview: {prepare: () => ({title: '— Divider —'})},
    }),
    // A named-quote alternative to a plain bulleted list -- built for
    // laying out several people's names/photos/comments together (e.g. a
    // roundup of reactions to a post), not a spreadsheet-style rows/columns
    // table. "Layout" picks between three genuinely different visual
    // treatments (see QuoteGrid.tsx) rather than one fixed look, so the
    // same set of quotes can be tried a few ways before deciding what fits
    // a given post best.
    defineArrayMember({
      type: 'object',
      name: 'quoteGrid',
      title: 'Quote Grid',
      icon: DoubleQuoteIcon,
      fields: [
        defineField({
          name: 'layout',
          title: 'Layout',
          type: 'string',
          options: {
            list: [
              {title: 'Cards (grid of bordered cards)', value: 'cards'},
              {title: 'Spotlight (alternating rows, larger type)', value: 'spotlight'},
              {title: 'Minimal (clean divided list, pull-quote style)', value: 'minimal'},
            ],
          },
          initialValue: 'cards',
        }),
        defineField({
          name: 'textWeight',
          title: 'Text weight',
          type: 'string',
          description:
            'How bold the quote text itself is. Regular reads more comfortably when several Quote Grids appear one after another on the same post; Bold gives a single grid more visual punch.',
          options: {
            list: [
              {title: 'Regular', value: 'regular'},
              {title: 'Bold', value: 'bold'},
            ],
            layout: 'radio',
          },
          initialValue: 'regular',
        }),
        defineField({
          name: 'textSize',
          title: 'Text size',
          type: 'string',
          description:
            'How large the quote text itself is, independent of weight above. Small suits a longer or denser set of quotes; Regular is the original size.',
          options: {
            list: [
              {title: 'Regular', value: 'regular'},
              {title: 'Small', value: 'small'},
            ],
            layout: 'radio',
          },
          initialValue: 'regular',
        }),
        defineField({
          name: 'entries',
          title: 'Quotes',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'quoteEntry',
              fields: [
                defineField({
                  name: 'photo',
                  title: 'Photo (optional)',
                  type: 'image',
                  options: {hotspot: true},
                  description: 'Leave blank to show a plain initial circle instead.',
                  fields: [
                    defineField({name: 'alt', type: 'string', title: 'Alternative text'}),
                  ],
                }),
                defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
                defineField({
                  name: 'role',
                  title: 'Role / context (optional)',
                  type: 'string',
                  description: 'Shown under the name, e.g. "Workshop attendee" or "Friend since college".',
                }),
                defineField({
                  name: 'quote',
                  title: 'Quote',
                  type: 'text',
                  rows: 3,
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: {
                select: {name: 'name', quote: 'quote', media: 'photo'},
                prepare: ({name, quote, media}) => ({title: name || 'Untitled', subtitle: quote, media}),
              },
            }),
          ],
          validation: (rule) => rule.min(1).error('Add at least one quote.'),
        }),
      ],
      preview: {
        select: {entries: 'entries', layout: 'layout'},
        prepare: ({entries, layout}) => {
          const count = (entries as unknown[] | undefined)?.length ?? 0
          const layoutLabel = layout === 'spotlight' ? 'Spotlight' : layout === 'minimal' ? 'Minimal' : 'Cards'
          // `as any` (not flagged by this project's no-explicit-any rule --
          // that only catches explicit `: any` annotations, not casts): the
          // real type is PreviewValue['media'], which only allows React
          // nodes, but Studio actually resolves an image-asset preview from
          // this plain-object shape at runtime. Same pattern as the Image
          // block's own preview above.
          const media = (entries as any[] | undefined)?.[0]?.photo
          return {title: `Quote Grid — ${layoutLabel} (${count} ${count === 1 ? 'quote' : 'quotes'})`, media}
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'codeBlock',
      title: 'Code block',
      icon: CodeBlockIcon,
      fields: [
        defineField({
          name: 'language',
          title: 'Language',
          type: 'string',
          options: {list: CODE_LANGUAGES},
          initialValue: 'text',
        }),
        defineField({
          name: 'code',
          title: 'Code',
          type: 'text',
          rows: 8,
        }),
      ],
      preview: {
        select: {code: 'code', language: 'language'},
        prepare: ({code, language}) => ({
          title: code ? code.split('\n')[0] : 'Code block',
          subtitle: language,
        }),
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'callout',
      title: 'Callout',
      fields: [
        defineField({
          name: 'style',
          title: 'Style',
          type: 'string',
          options: {
            list: [
              {title: 'Note', value: 'note'},
              {title: 'Tip', value: 'tip'},
              {title: 'Warning', value: 'warning'},
            ],
          },
          initialValue: 'note',
        }),
        defineField({
          name: 'text',
          title: 'Text',
          type: 'text',
          rows: 3,
        }),
      ],
      preview: {
        select: {text: 'text', style: 'style'},
        prepare: ({text, style}) => ({title: text || 'Callout', subtitle: style}),
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'accordion',
      title: 'Accordion (show/hide)',
      components: {input: SavedStatusInput},
      fields: [
        defineField({name: 'title', title: 'Heading (always visible)', type: 'string'}),
        // A deliberately smaller version of the top-level block config
        // above, not a re-use of it -- "simple rich text" means bold,
        // italic, underline, links, and lists, not headings/blockquotes/
        // code/the custom internalLink/affiliateLink/textColor annotations
        // or nested embeds. Was a plain `type: 'text'` string field before;
        // existing accordions were migrated to this array shape (one
        // 'normal' block per paragraph) rather than left to break -- see
        // RUNBOOK.md's Accordion section for the migration script.
        accordionContentField(),
      ],
      preview: {
        select: {title: 'title'},
        prepare: ({title}) => ({title: title || 'Accordion'}),
      },
    }),
    // A separate block from the single Accordion above, not that same
    // block widened to hold many items -- every already-published post's
    // Accordion blocks stay exactly as they are, no migration needed, and
    // Asher picks per-use whether a spot needs one lone disclosure or a
    // stacked FAQ-style group. Each item shares the exact same restricted
    // rich text as the single Accordion via `accordionContentField()`.
    defineArrayMember({
      type: 'object',
      name: 'accordionGroup',
      title: 'Accordion Group (multiple items)',
      icon: UlistIcon,
      fields: [
        defineField({
          name: 'items',
          title: 'Items',
          type: 'array',
          validation: (rule) => rule.min(1),
          of: [
            defineArrayMember({
              type: 'object',
              name: 'accordionGroupItem',
              components: {input: SavedStatusInput},
              fields: [
                defineField({name: 'title', title: 'Heading (always visible)', type: 'string'}),
                accordionContentField(),
              ],
              preview: {
                select: {title: 'title'},
                prepare: ({title}) => ({title: title || 'Item'}),
              },
            }),
          ],
        }),
      ],
      preview: {
        select: {items: 'items'},
        prepare: ({items}) => {
          const count = (items as unknown[] | undefined)?.length ?? 0
          return {title: `Accordion Group (${count} item${count === 1 ? '' : 's'})`}
        },
      },
    }),
    // Embeds a *reference* to a Reusable Snippet document, not a copy of
    // its content -- editing the snippet updates every post that inserts
    // One button instead of two -- pick between "YouTube embed" and
    // "Instagram embed" was removed as a decision Asher had to make every
    // time; the URL itself already says which platform it's from, so this
    // one type figures that out at render time (isInstagramUrl() /
    // getYouTubeId() in portableTextComponents.tsx) instead of asking.
    // Ordered ahead of Reusable snippet -- Asher reaches for this often
    // enough that it was getting buried in the toolbar's "..." overflow.
    defineArrayMember({
      type: 'object',
      name: 'embed',
      title: 'Embed (YouTube / Instagram)',
      icon: PlayIcon,
      fields: [
        defineField({
          name: 'url',
          title: 'URL',
          type: 'url',
          description: 'Paste a YouTube video URL or an Instagram post URL -- which one it is gets figured out automatically.',
          validation: (rule) => rule.required(),
        }),
      ],
      preview: {
        select: {url: 'url'},
        prepare: ({url}) => {
          const platform = /instagram\.com/i.test(url || '') ? 'Instagram' : 'YouTube'
          return {title: `${platform} embed`, subtitle: url}
        },
      },
    }),
    defineArrayMember({
      type: 'reference',
      name: 'snippetRef',
      title: 'Reusable snippet',
      icon: ComponentIcon,
      to: [{type: 'snippet'}],
    }),
  ],
})
