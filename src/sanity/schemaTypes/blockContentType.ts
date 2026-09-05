import {defineType, defineArrayMember, defineField} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {ImagesIcon} from '@sanity/icons/Images'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {UlistIcon} from '@sanity/icons/Ulist'
import {PlayIcon} from '@sanity/icons/Play'
import {ComponentIcon} from '@sanity/icons/Component'
import {LinkIcon} from '@sanity/icons/Link'
import {DocumentIcon} from '@sanity/icons/Document'
import {TagIcon} from '@sanity/icons/Tag'
import {DoubleQuoteIcon} from '@sanity/icons/DoubleQuote'
import {ThListIcon} from '@sanity/icons/ThList'
import {TEXT_COLORS} from '../../lib/textColors'
import {SavedStatusInput} from '../components/SavedStatusInput'
import {ImageGalleryStatusInput} from '../components/ImageGalleryStatusInput'
import {CollapsedImageBlock} from '../components/CollapsedImageBlock'
import {DividerBlockPreview} from '../components/DividerBlockPreview'
import {GifPickerInput} from '../components/GifPickerInput'
import {CollapsedGifBlock} from '../components/CollapsedGifBlock'
import {TooltipDescriptionField} from '../components/TooltipDescriptionField'
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

// Shared by the single Accordion block, each item inside an Accordion
// Group, and Callout's Text field -- all three need the exact same
// deliberately restricted rich text (bold/italic/underline/lists/a plain
// URL link, no headings/blockquotes/custom annotations), and a factory
// function is what keeps that in sync between them rather than hand-copied
// definitions drifting apart the way Story/Play's own duplicated prose
// once did (see RUNBOOK.md). Originally accordion-only (`accordionContentField`);
// generalized to take a name/title when Callout needed the identical shape.
function restrictedRichTextField(name: string, title: string) {
  return defineField({
    name,
    title,
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
      components: {input: ImageGalleryStatusInput, block: CollapsedImageBlock},
      // Groups the gallery-only fields (More photos, Display style) into
      // their own visually distinct box instead of blending into the same
      // flat list as Alt text/Caption/Display size -- those describe THIS
      // image regardless of mode, gallery fields only matter once you've
      // actually started building one. "More photos" itself has to stay
      // outside the `hidden` gate everything else in the group respects
      // (see displayStyle below) since it's the field that STARTS gallery
      // mode -- can't hide the on-ramp.
      fieldsets: [
        {
          name: 'gallery',
          title: 'Gallery',
          description: 'Add more photos here to turn this into a gallery.',
          options: {collapsible: false},
        },
      ],
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
          title: 'More photos',
          type: 'array',
          fieldset: 'gallery',
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
            'Add one or more extra photos here and the image above becomes the first photo in a gallery, alongside these.',
        }),
        defineField({
          name: 'displayStyle',
          title: 'Display style',
          type: 'string',
          fieldset: 'gallery',
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
          components: {field: TooltipDescriptionField},
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
        defineField({
          name: 'float',
          title: 'Wrap text around it',
          type: 'string',
          // Only makes sense for a single small/medium photo, not a gallery
          // (floating several photos at once is a much stranger reading
          // pattern) and not Wide/Original (already fills or exceeds the
          // column, nothing left to wrap text around). Hidden rather than
          // disabled -- if displaySize changes later and this becomes
          // hidden again with a stale value still stored, the frontend
          // (SizedImage.tsx) independently re-checks size before ever
          // applying a float, so a stale value can't cause a visual bug.
          hidden: ({parent}) => {
            const p = parent as {additionalImages?: unknown[]; displaySize?: string}
            if (p?.additionalImages?.length) return true
            return p?.displaySize === 'wide' || p?.displaySize === 'original'
          },
          options: {
            list: [
              {title: 'No (default)', value: 'none'},
              {title: 'Float left (text wraps on the right)', value: 'left'},
              {title: 'Float right (text wraps on the left)', value: 'right'},
            ],
            layout: 'radio',
          },
          initialValue: 'none',
          description: 'Stacks full-width on mobile either way, same as Small/Medium already do -- floating only kicks in on wider screens where there\'s room for text to actually wrap.',
        }),
      ],
      preview: {
        select: {alt: 'alt', asset: 'asset', additionalImages: 'additionalImages', displayStyle: 'displayStyle'},
        prepare: ({alt, asset, additionalImages, displayStyle}) => {
          const items = (additionalImages as {asset?: unknown}[] | undefined) ?? [];
          const extra = items.length;
          // Same gap as the live blog page had (see portableTextComponents.tsx):
          // the bulk picker lets someone build a whole gallery through
          // "More photos" alone, leaving the primary `asset` slot empty. The
          // live page already falls back to additionalImages in that case;
          // this thumbnail didn't, so a real, fully-populated gallery block
          // showed as a blank/broken preview in the post's block list.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Studio resolves an image-asset preview from this shape at runtime, but PreviewValue['media'] is only typed for React nodes.
          const media = {_type: 'image', asset: asset ?? items[0]?.asset} as any;
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
    // Hotlinks straight to Giphy's own URL instead of downloading and
    // re-uploading into Sanity -- Asher's own ask (2026-08-29), after
    // noticing the old "Insert GIF" option on image fields was copying
    // every picked GIF into his own asset storage. Sits right next to
    // Image in the toolbar since that's conceptually the closest existing
    // block, but is a plain object (not Sanity's `image` type) precisely
    // so it never needs a real asset -- same reasoning as the youtube/
    // instagramEmbed blocks above, just for Giphy specifically. Trade-off
    // Asher explicitly accepted: if Giphy ever takes a GIF down, it stops
    // showing here too, since nothing's actually stored on this end.
    defineArrayMember({
      type: 'object',
      name: 'externalGif',
      title: 'GIF (Giphy)',
      icon: ImagesIcon,
      fields: [
        defineField({name: 'url', title: 'GIF URL', type: 'url', hidden: true}),
        defineField({name: 'thumbUrl', title: 'Thumbnail URL', type: 'url', hidden: true}),
        // Giphy's own metadata, not editable -- GifPickerInput sets this
        // automatically when a GIF is picked and never exposes a field for
        // it, so there's no way to override it by hand right now.
        defineField({name: 'title', title: 'Description (alt text)', type: 'string', hidden: true}),
        // Same 4 options as Image's own Display size (SizedImage.tsx),
        // so a GIF sizes the same way a photo does instead of always
        // rendering at whatever pixel size Giphy happens to serve --
        // Asher's ask (2026-08-29), after noticing GIFs from different
        // searches came out wildly different sizes with no way to control
        // it. hidden: true since GifPickerInput renders its own control
        // for this, same as url/thumbUrl/title above.
        defineField({name: 'displaySize', title: 'Display size', type: 'string', hidden: true, initialValue: 'original'}),
        // Same float option Image's block already has (blockContentType.ts's
        // image array member) -- Asher's ask (2026-08-31): a GIF should be
        // able to wrap text the same way a small photo can. `hidden: true`
        // like every other field here since GifPickerInput.tsx renders its
        // own control (it already decides for itself when to show it,
        // based on displaySize, rather than relying on Sanity's schema-level
        // hidden callback the way Image's field does -- this form is fully
        // custom-rendered regardless).
        defineField({name: 'float', title: 'Wrap text around it', type: 'string', hidden: true, initialValue: 'none'}),
        // Visible caption under the GIF -- added as the alternative to
        // editable alt text (Asher's ask, 2026-08-29): since `title`
        // above stays Giphy-controlled, this is the field he can actually
        // write in, same role as Image's own `caption`.
        defineField({name: 'caption', title: 'Caption (optional)', type: 'string', hidden: true}),
      ],
      components: {input: GifPickerInput, block: CollapsedGifBlock},
      preview: {
        select: {title: 'title'},
        prepare: ({title}) => ({title: title ? `GIF: ${title}` : 'GIF'}),
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'divider',
      title: 'Divider',
      icon: UlistIcon,
      fields: [defineField({name: 'style', type: 'string', hidden: true, initialValue: 'divider'})],
      preview: {prepare: () => ({title: '— Divider —'})},
      components: {block: DividerBlockPreview},
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
    // A genuine rows-of-fields overview -- one card per entry, every field
    // visible at once, no click needed to see it. Built for Asher's "How to
    // Keep Track of Your Skills" post (2026-08-29): the Accordion Group
    // alternative made every entry a click to open, which fought the whole
    // point of the post (an at-a-glance list he can scan to decide keep/
    // update/delete). Rendered by SkillGrid.tsx.
    defineArrayMember({
      type: 'object',
      name: 'skillGrid',
      title: 'Skill Grid',
      icon: ThListIcon,
      fields: [
        defineField({
          name: 'layout',
          title: 'Layout',
          type: 'string',
          description: 'Cards: every field visible per skill, no click needed. Table: one row per skill, longer fields (why/clash/improved) expand in place from the Details column.',
          options: {
            list: [
              {title: 'Cards (grid of bordered cards)', value: 'cards'},
              {title: 'Table (rows + columns, hover for details)', value: 'table'},
            ],
          },
          initialValue: 'cards',
        }),
        defineField({
          name: 'entries',
          title: 'Skills',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'skillEntry',
              fields: [
                defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
                // Right under Name -- Asher's ask (2026-08-29), the most
                // logical spot for it editing-wise, and it's also what the
                // rendered skill name itself links to.
                defineField({
                  name: 'sourceUrl',
                  title: 'Source link (optional)',
                  type: 'url',
                  description: 'The original repo, marketplace, or listing this was installed from.',
                }),
                // What kind of skill this is, broader than just "coding" --
                // Asher's ask (2026-08-29), planning ahead for Claude
                // surfaces beyond Claude Code too (image/video generation,
                // etc.), not just what's installed today. "Others" is a
                // deliberate catch-all, not a sign the list is incomplete.
                defineField({
                  name: 'category',
                  title: 'Category',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Coding & Dev', value: 'coding-dev'},
                      {title: 'Design', value: 'design'},
                      {title: 'Writing', value: 'writing'},
                      {title: 'Productivity', value: 'productivity'},
                      {title: 'Documents', value: 'documents'},
                      {title: 'Memory & Data', value: 'memory-data'},
                      {title: 'Media (graphic, video, audio)', value: 'media'},
                      {title: 'Others', value: 'others'},
                    ],
                  },
                  initialValue: 'others',
                }),
                // A multi-select checkbox list, same shape as Category
                // above, not two separately-titled booleans -- Asher's ask
                // (2026-08-29): the old "On this machine (user-level)" /
                // "On this project (project-level, reaches the web
                // session)" titles read inconsistently next to Category's
                // clean short options. Meaning is unchanged: "Desktop" =
                // installed at the user level (~/.claude/skills), works in
                // any project on this computer but never reaches a web
                // session. "Web" = installed at the project level
                // (committed to this repo's .claude/skills), so it also
                // follows into the browser-based session for this project.
                // Any nuance that doesn't fit these two belongs in Details
                // below instead.
                defineField({
                  name: 'platform',
                  title: 'Platform',
                  type: 'array',
                  of: [{type: 'string'}],
                  options: {
                    list: [
                      {title: 'Desktop', value: 'desktop'},
                      {title: 'Web', value: 'web'},
                    ],
                  },
                }),
                defineField({
                  name: 'installed',
                  title: 'Installed',
                  type: 'string',
                  description: 'Plain text, e.g. "08 Aug 2026".',
                }),
                // One rich-text field, not several separate plain-text
                // boxes -- Asher's ask (2026-08-29): three fields (Why /
                // Clash / Improved) to tab through felt like more editing
                // overhead than the content warranted, and "Where from"
                // (originally its own field, later a Table column) turned
                // out to belong here too rather than needing its own slot
                // anywhere. Same restricted rich text as Accordion/
                // Callout's own content fields -- write it as one
                // continuous note (bold a "From:"/"Why:"/"Clash:"/
                // "Improved:" label inline if that structure's useful for a
                // given entry, or just write freely).
                restrictedRichTextField('details', 'Details'),
                // Three states, not a boolean -- "unmodified off-the-shelf"
                // and "unmodified but changed/merged since" are genuinely
                // different answers to "should I keep this as is," which a
                // Yes/No Custom-built toggle couldn't tell apart (Asher's
                // ask, 2026-08-29). "Status" was briefly relabeled "Origin"
                // the same day, then reverted -- "Status" was fine all
                // along, it was the "Off the shelf" *value* that read
                // wrong; renamed that to "Installed" instead, which now
                // reads as a real lifecycle rather than just "how much did
                // I touch this": Installed -> Modified -> Custom is how
                // active entries progress, Shelved and Removed cover the
                // two ways an entry stops being active (never adopted vs.
                // adopted then taken out). Value key changed from
                // `off-the-shelf` to `installed` to match (migrated every
                // existing entry, 2026-08-29) -- worth doing properly now
                // rather than leaving the stored value and the displayed
                // label permanently out of sync with each other.
                defineField({
                  name: 'status',
                  title: 'Status',
                  type: 'string',
                  options: {
                    list: [
                      {title: 'Installed (unmodified)', value: 'installed'},
                      {title: 'Modified (installed, but changed or merged since)', value: 'modified'},
                      {title: 'Custom (built it myself)', value: 'custom'},
                      {title: 'Shelved (considered, never actually installed)', value: 'shelved'},
                      {title: 'Removed (installed once, taken out since)', value: 'removed'},
                    ],
                  },
                  initialValue: 'installed',
                }),
              ],
              preview: {
                select: {name: 'name', details: 'details'},
                prepare: ({name, details}) => {
                  const flatText = Array.isArray(details)
                    ? (details as {children?: {text?: string}[]}[])
                        .map((block) => (block.children ?? []).map((c) => c.text ?? '').join(''))
                        .join(' ')
                    : ''
                  return {title: name || 'Skill', subtitle: flatText}
                },
              },
            }),
          ],
          validation: (rule) => rule.min(1).error('Add at least one skill.'),
        }),
      ],
      preview: {
        select: {entries: 'entries'},
        prepare: ({entries}) => {
          const count = (entries as unknown[] | undefined)?.length ?? 0
          return {title: `Skill Grid (${count} ${count === 1 ? 'skill' : 'skills'})`}
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
          description: 'Picks the colour only. The word shown above the text (e.g. "Note") comes from Style’s name unless Label below overrides it.',
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
          name: 'label',
          title: 'Label (optional)',
          type: 'string',
          description: 'Overrides the word shown above the text on the live post (normally "Note"/"Tip"/"Warning", matching Style above). Leave blank to just use Style’s own name.',
        }),
        // Was a plain `type: 'text'` string field (Asher's ask, 2026-08-29:
        // "can callouts have rich text?") -- same restricted shape as
        // Accordion's content, via restrictedRichTextField() above.
        // Existing callouts were migrated to this array shape (one 'normal'
        // block per paragraph) rather than left to break -- see RUNBOOK.md's
        // Callout section for the migration script. Every place that reads
        // this field (portableTextComponents.tsx, portableText.ts,
        // exportHtml/exportMarkdown/exportPdf.ts) handles both the old
        // string shape and the new array shape defensively, the same
        // precaution Accordion's own migration used.
        restrictedRichTextField('text', 'Text'),
      ],
      preview: {
        select: {text: 'text', style: 'style', label: 'label'},
        prepare: ({text, style, label}) => {
          const flatText = Array.isArray(text)
            ? (text as {children?: {text?: string}[]}[])
                .map((block) => (block.children ?? []).map((c) => c.text ?? '').join(''))
                .join(' ')
            : text || ''
          return {title: flatText || 'Callout', subtitle: label || style}
        },
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
        restrictedRichTextField('content', 'Content (hidden until clicked)'),
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
    // rich text as the single Accordion via `restrictedRichTextField()`.
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
                restrictedRichTextField('content', 'Content (hidden until clicked)'),
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
