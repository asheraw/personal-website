import {defineType, defineArrayMember, defineField} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {UlistIcon} from '@sanity/icons/Ulist'
import {PlayIcon} from '@sanity/icons/Play'
import {ComponentIcon} from '@sanity/icons/Component'

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
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
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
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
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
  ],
})
