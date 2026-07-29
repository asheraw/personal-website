import {useEffect, useState, useCallback} from 'react'
import {useClient, set, unset} from 'sanity'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {Card, Checkbox, Flex, Grid, Spinner, Text} from '@sanity/ui'

type CategoryOption = {_id: string; title: string}

/**
 * Replaces the default reference-array "search a modal, add one at a time"
 * picker with a flat checkbox list -- there are only ever a handful of
 * categories, so seeing and ticking all of them at once beats searching for
 * each one individually. Per the ACE PRD's explicit "checkbox, not modal"
 * requirement for this field.
 */
export function CategoryCheckboxInput(props: ArrayOfObjectsInputProps) {
  const {value, onChange} = props
  const client = useClient({apiVersion: '2023-01-01'})
  const [options, setOptions] = useState<CategoryOption[] | null>(null)

  useEffect(() => {
    client.fetch<CategoryOption[]>(`*[_type == "category"] | order(title asc){_id, title}`).then(setOptions)
  }, [client])

  const selectedIds = new Set((value || []).map((item) => (item as {_ref?: string})._ref).filter(Boolean))

  const toggle = useCallback(
    (id: string, checked: boolean) => {
      const current = value || []
      if (checked) {
        onChange(set([...current, {_type: 'reference', _ref: id, _key: id}]))
      } else {
        const next = current.filter((item) => (item as {_ref?: string})._ref !== id)
        onChange(next.length ? set(next) : unset())
      }
    },
    [value, onChange]
  )

  if (!options) {
    return (
      <Flex align="center" gap={2}>
        <Spinner muted />
        <Text size={1} muted>
          Loading categories…
        </Text>
      </Flex>
    )
  }

  if (options.length === 0) {
    return (
      <Text size={1} muted>
        No categories exist yet — create one from the Categories tab in the sidebar first.
      </Text>
    )
  }

  return (
    <Card padding={3} radius={2} border>
      <Grid columns={[1, 2, 3]} gap={3}>
        {options.map((option) => {
          const checked = selectedIds.has(option._id)
          return (
            <Flex key={option._id} align="center" gap={3}>
              <Checkbox
                id={`category-${option._id}`}
                checked={checked}
                onChange={(event) => toggle(option._id, event.currentTarget.checked)}
              />
              <Text
                size={1}
                as="label"
                htmlFor={`category-${option._id}`}
                style={{cursor: 'pointer'}}
              >
                {option.title}
              </Text>
            </Flex>
          )
        })}
      </Grid>
    </Card>
  )
}
