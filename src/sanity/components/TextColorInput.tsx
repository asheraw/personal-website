import {Card, Flex, Grid, Radio, Text} from '@sanity/ui'
import {set} from 'sanity'
import type {StringInputProps} from 'sanity'
import {TEXT_COLORS} from '../../lib/textColors'

// The dark-theme shades from globals.css (--tc-*), the ones that show on
// the Studio's own dark background -- same values readers see in dark mode.
const SWATCH: Record<string, string> = {
  red: '#e2685c',
  orange: '#e0965a',
  yellow: '#e8c468',
  green: '#7fb389',
  teal: '#5cc2c9',
  blue: '#6b9bd8',
  purple: '#a888d8',
  pink: '#d888b0',
}

// Radio list with a colour dot beside each name, instead of a plain
// dropdown -- for the "Text color" annotation in the rich-text editor.
export function TextColorInput({value, onChange, readOnly}: StringInputProps) {
  return (
    <Grid columns={2} gap={2}>
      {TEXT_COLORS.map((c) => (
        <Card
          key={c.value}
          as="label"
          padding={3}
          radius={2}
          border
          tone={value === c.value ? 'primary' : 'default'}
          style={{cursor: readOnly ? 'default' : 'pointer'}}
        >
          <Flex align="center" gap={3}>
            <Radio checked={value === c.value} disabled={readOnly} name="text-color" value={c.value} onChange={() => onChange(set(c.value))} />
            <span style={{width: 16, height: 16, borderRadius: '50%', background: SWATCH[c.value], flexShrink: 0}} />
            <Text size={1}>{c.title}</Text>
          </Flex>
        </Card>
      ))}
    </Grid>
  )
}
