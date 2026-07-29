import {useEffect, useState, useCallback} from 'react'
import {useClient, set, unset} from 'sanity'
import type {ArrayOfPrimitivesInputProps} from 'sanity'
import {Box, Card, Flex, Inline, Stack, Text, TextInput} from '@sanity/ui'
import {CloseIcon} from '@sanity/icons/Close'

/**
 * Free-form tag entry (type anything, press Enter/comma to add) that also
 * suggests tags already used on other posts, so "coaching" and "Coaching "
 * don't quietly become two different tags scattered across the archive.
 */
export function TagsAutocompleteInput(props: ArrayOfPrimitivesInputProps) {
  const {value, onChange} = props
  const client = useClient({apiVersion: '2023-01-01'})
  const [allTags, setAllTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    client.fetch<string[][]>(`*[_type == "post" && defined(tags)].tags`).then((results) => {
      setAllTags(Array.from(new Set(results.flat())).sort())
    })
  }, [client])

  const currentTags = ((value || []) as string[]).filter((t): t is string => typeof t === 'string')

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim()
      if (!tag || currentTags.includes(tag)) {
        setInputValue('')
        return
      }
      onChange(set([...currentTags, tag]))
      setInputValue('')
    },
    [currentTags, onChange]
  )

  const removeTag = useCallback(
    (tag: string) => {
      const next = currentTags.filter((t) => t !== tag)
      onChange(next.length ? set(next) : unset())
    },
    [currentTags, onChange]
  )

  const suggestions = inputValue
    ? allTags.filter(
        (t) => !currentTags.includes(t) && t.toLowerCase().includes(inputValue.toLowerCase())
      )
    : []

  return (
    <Stack space={3}>
      {currentTags.length > 0 && (
        <Inline space={2}>
          {currentTags.map((tag) => (
            <Card key={tag} padding={2} radius={2} tone="primary" border>
              <Flex align="center" gap={2}>
                <Text size={1}>{tag}</Text>
                <Box
                  as="button"
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{display: 'flex', cursor: 'pointer', background: 'none', border: 'none', padding: 0}}
                  aria-label={`Remove tag ${tag}`}
                >
                  <CloseIcon />
                </Box>
              </Flex>
            </Card>
          ))}
        </Inline>
      )}

      <Box style={{position: 'relative'}}>
        <TextInput
          value={inputValue}
          placeholder="Type a tag, press Enter to add — existing tags are suggested"
          onChange={(event) => setInputValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addTag(inputValue)
            }
          }}
        />
        {suggestions.length > 0 && (
          <Card
            radius={2}
            shadow={2}
            style={{position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4}}
          >
            <Stack space={0}>
              {suggestions.slice(0, 8).map((tag) => (
                <Box
                  key={tag}
                  as="button"
                  type="button"
                  padding={3}
                  onClick={() => addTag(tag)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                  }}
                >
                  <Text size={1}>{tag}</Text>
                </Box>
              ))}
            </Stack>
          </Card>
        )}
      </Box>
    </Stack>
  )
}
