import {useEffect, useState} from 'react'
import {useClient, useFormValue, set, unset} from 'sanity'
import type {ObjectInputProps} from 'sanity'
import {Card, Flex, Spinner, Text} from '@sanity/ui'

type CategoryOption = {_id: string; title: string}
type CategoryRef = {_ref?: string}

/**
 * Replaces the default reference field's search-a-list picker with a row of
 * tap targets scoped to only the categories already ticked on the post --
 * the field only ever makes sense as one of those anyway (its own schema
 * `options.filter` already restricted the search results the same way, this
 * just makes picking one a single tap instead of opening a dropdown and
 * typing/scrolling to find it, which was slow enough on mobile to be worth
 * fixing on its own). `useFormValue` reads the sibling `categories` field's
 * live value (just `_ref` ids, not titles -- a reference's stored value is
 * never dereferenced in form state), so which categories are even eligible
 * always matches what's actually ticked above without waiting on a save;
 * their titles come from the same category fetch CategoryCheckboxInput
 * already does for the field above this one.
 *
 * Also auto-clears the primary category the moment it's no longer among
 * the ticked categories (e.g. Asher unticks the one currently set as
 * primary) -- previously nothing did this, so the field could keep
 * pointing at a category the post no longer actually has, silently
 * disagreeing with the checkbox list above it.
 */
export function PrimaryCategoryInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const client = useClient({apiVersion: '2023-01-01'})
  const [options, setOptions] = useState<CategoryOption[] | null>(null)

  useEffect(() => {
    client.fetch<CategoryOption[]>(`*[_type == "category"] | order(title asc){_id, title}`).then(setOptions)
  }, [client])

  const selectedRefs = ((useFormValue(['categories']) as CategoryRef[] | undefined) ?? [])
    .map((c) => c._ref)
    .filter((ref): ref is string => !!ref)
  const currentRef = (value as {_ref?: string} | undefined)?._ref

  useEffect(() => {
    if (currentRef && !selectedRefs.includes(currentRef)) {
      onChange(unset())
    }
  }, [currentRef, selectedRefs.join(','), onChange])

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

  const selectedOptions = options.filter((o) => selectedRefs.includes(o._id))

  if (selectedOptions.length === 0) {
    return (
      <Text size={1} muted>
        Pick at least one category above first.
      </Text>
    )
  }

  return (
    <Card padding={3} radius={2} border>
      <Flex gap={2} wrap="wrap">
        {selectedOptions.map((opt) => {
          const isSelected = currentRef === opt._id
          return (
            <button
              key={opt._id}
              type="button"
              onClick={() => onChange(isSelected ? unset() : set({_type: 'reference', _ref: opt._id}))}
              style={{
                cursor: 'pointer',
                border: '1px solid var(--card-border-color)',
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: isSelected ? 600 : 400,
                background: isSelected ? 'var(--card-focus-ring-color, #2276fc)' : 'transparent',
                color: isSelected ? 'white' : 'inherit',
              }}
            >
              {opt.title}
            </button>
          )
        })}
      </Flex>
    </Card>
  )
}
