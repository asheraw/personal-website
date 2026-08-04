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
import {HeartFilledIcon} from '@sanity/icons/HeartFilled'
import {TEXT_COLORS} from '../../lib/textColors'

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
    defineArrayMember({
      type: 'image',
      icon: ImageIcon,
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
          description: 'Shown beneath the image.',
        }),
      ],
    }),
    // Multiple images shown one at a time, not stacked -- either
    // visitor-controlled (Carousel: arrows/dots/swipe, sits still until
    // clicked) or self-advancing (Slideshow: same controls, plus an
    // auto-advance timer that pauses on hover). Both share one block type
    // and one image list, since "how it advances" is the only real
    // difference -- rendered by ImageCarousel.tsx, keyed off `layout`.
    defineArrayMember({
      type: 'object',
      name: 'imageGallery',
      title: 'Image Carousel / Slideshow',
      icon: ImagesIcon,
      fields: [
        defineField({
          name: 'layout',
          title: 'Layout',
          type: 'string',
          options: {
            list: [
              {title: 'Carousel (reader clicks through)', value: 'carousel'},
              {title: 'Slideshow (auto-advances on its own)', value: 'slideshow'},
            ],
          },
          initialValue: 'carousel',
        }),
        defineField({
          name: 'images',
          title: 'Images',
          type: 'array',
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
          validation: (rule) =>
            rule
              .min(2)
              .error('Add at least 2 images -- for just one, use the plain Image block instead.'),
        }),
      ],
      preview: {
        select: {images: 'images', layout: 'layout'},
        prepare: ({images, layout}) => ({
          title: `Image ${layout === 'slideshow' ? 'Slideshow' : 'Carousel'} (${images?.length ?? 0} photos)`,
          media: images?.[0],
        }),
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
      fields: [
        defineField({name: 'title', title: 'Heading (always visible)', type: 'string'}),
        defineField({name: 'content', title: 'Content (hidden until clicked)', type: 'text', rows: 4}),
      ],
      preview: {
        select: {title: 'title'},
        prepare: ({title}) => ({title: title || 'Accordion'}),
      },
    }),
    // Embeds a *reference* to a Reusable Snippet document, not a copy of
    // its content -- editing the snippet updates every post that inserts
    // it. `to: [{type: 'snippet'}]` on an array member (rather than a
    // nested reference field) is what makes Sanity store this directly as
    // a `{_type: 'snippetRef', _ref: ...}` item in the body array itself.
    defineArrayMember({
      type: 'reference',
      name: 'snippetRef',
      title: 'Reusable snippet',
      icon: ComponentIcon,
      to: [{type: 'snippet'}],
    }),
    defineArrayMember({
      type: 'object',
      name: 'youtube',
      title: 'YouTube embed',
      icon: PlayIcon,
      fields: [
        defineField({
          name: 'url',
          title: 'YouTube URL',
          type: 'url',
          description: 'Paste the full video URL, e.g. https://www.youtube.com/watch?v=...',
        }),
      ],
      preview: {
        select: {url: 'url'},
        prepare: ({url}) => ({title: 'YouTube embed', subtitle: url}),
      },
    }),
    // Instagram's own free, official embed (blockquote + embed.js) --
    // shows the real photo, caption, account, and like count, with a
    // "View this post on Instagram" link. Not the same as pulling actual
    // comment replies inline -- that needs Meta's token-gated Graph API
    // oEmbed endpoint and app review, a much bigger lift for a feature
    // that isn't asked for often enough to justify it yet.
    defineArrayMember({
      type: 'object',
      name: 'instagramEmbed',
      title: 'Instagram embed',
      icon: HeartFilledIcon,
      fields: [
        defineField({
          name: 'url',
          title: 'Instagram post URL',
          type: 'url',
          description: 'Paste the full post URL, e.g. https://www.instagram.com/p/XXXXXXXXXXX/',
        }),
      ],
      preview: {
        select: {url: 'url'},
        prepare: ({url}) => ({title: 'Instagram embed', subtitle: url}),
      },
    }),
  ],
})
