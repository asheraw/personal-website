import {Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import type {FieldProps} from 'sanity'

/**
 * Moves a field's `description` out of its own always-visible paragraph
 * (Sanity's default) into a hover tooltip on a small info icon instead --
 * built for Display size specifically, whose description is a genuinely
 * long explanation (all 4 options plus a mobile caveat) that took up more
 * vertical space than the field it explains, throwing off the whole
 * panel's rhythm. The title still renders through Sanity's own default
 * chrome unchanged (only `description` is overridden to undefined below);
 * this just adds one small hint row above it.
 */
export function TooltipDescriptionField(props: FieldProps) {
  const {description} = props
  return (
    <Stack space={2}>
      {description && (
        <Tooltip
          content={
            <Stack space={0} style={{maxWidth: 280, padding: '0.75em'}}>
              <Text size={1}>{description}</Text>
            </Stack>
          }
          placement="top"
        >
          <Flex align="center" gap={1} style={{cursor: 'help', width: 'fit-content'}}>
            <InfoOutlineIcon />
            <Text size={0} muted>
              What do these options mean?
            </Text>
          </Flex>
        </Tooltip>
      )}
      {props.renderDefault({...props, description: undefined})}
    </Stack>
  )
}
