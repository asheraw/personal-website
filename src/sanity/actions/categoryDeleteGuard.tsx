import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {Box, Button, Card, Flex, Select, Spinner, Stack, Text} from '@sanity/ui'
import {ErrorMessage} from '../components/ErrorMessage'

type LinkedPost = {
  _id: string
  title?: string
  categoryRefs: string[]
  primaryCategoryRef?: string
}
type CategoryOption = {_id: string; title?: string}

/**
 * Wraps the default "Delete" action for categories. If nothing uses this
 * category, deletion proceeds exactly as normal -- no extra step. If posts
 * do use it, shows what's affected first and asks what should happen to
 * them: reassign to another category, or leave uncategorised. Only after
 * that choice is applied does the underlying delete actually run, so a
 * category never vanishes out from under posts that were counting on it.
 */
export function withCategoryDeleteGuard(originalAction: DocumentActionComponent): DocumentActionComponent {
  const WrappedDeleteAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const client = useClient({apiVersion: '2023-01-01'})
    const original = originalAction(props)

    const [phase, setPhase] = useState<'idle' | 'checking' | 'confirming' | 'working'>('idle')
    const [linkedPosts, setLinkedPosts] = useState<LinkedPost[]>([])
    const [otherCategories, setOtherCategories] = useState<CategoryOption[]>([])
    const [replacementId, setReplacementId] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    if (!original) return null
    const safeOriginal = original

    const publishedId = props.id.replace(/^drafts\./, '')

    async function startCheck() {
      setPhase('checking')
      setErrorMsg('')
      try {
        const posts = await client.fetch<LinkedPost[]>(
          `*[_type == "post" && references($id)]{
            _id, title,
            "categoryRefs": categories[]._ref,
            "primaryCategoryRef": primaryCategory._ref
          }`,
          {id: publishedId}
        )
        if (posts.length === 0) {
          setPhase('idle')
          safeOriginal.onHandle?.()
          return
        }
        const others = await client.fetch<CategoryOption[]>(
          `*[_type == "category" && _id != $id] | order(title asc){_id, title}`,
          {id: publishedId}
        )
        setLinkedPosts(posts)
        setOtherCategories(others)
        setPhase('confirming')
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Could not check which posts use this category.')
        setPhase('idle')
      }
    }

    async function confirmAndDelete() {
      setPhase('working')
      setErrorMsg('')
      try {
        const tx = client.transaction()
        for (const post of linkedPosts) {
          // Every path removed in one call and every field set in one call
          // -- calling .unset() (or .set()) more than once on the same
          // patch silently drops all but the last call's paths instead of
          // accumulating them, so these must be collected up front rather
          // than chained. Verified with scripts/_test-uncategorize.mjs
          // after this exact bug showed up in testing.
          const unsetPaths = [`categories[_ref=="${publishedId}"]`]
          const setFields: Record<string, unknown> = {}

          if (post.primaryCategoryRef === publishedId) {
            if (replacementId) {
              setFields.primaryCategory = {_type: 'reference', _ref: replacementId}
            } else {
              unsetPaths.push('primaryCategory')
            }
          }

          let patch = client.patch(post._id).unset(unsetPaths)
          if (Object.keys(setFields).length > 0) {
            patch = patch.set(setFields)
          }
          if (replacementId && !post.categoryRefs.includes(replacementId)) {
            patch = patch
              .setIfMissing({categories: []})
              .append('categories', [{_type: 'reference', _ref: replacementId, _key: replacementId}])
          }

          tx.patch(patch)
        }
        await tx.commit()

        // Reassignment is done and safe -- hand off to the real delete
        // action for the actual deletion (it already handles removing
        // both the draft and published copies of the category itself).
        setPhase('idle')
        safeOriginal.onHandle?.()
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Something went wrong reassigning those posts -- nothing was deleted.')
        setPhase('confirming')
      }
    }

    return {
      ...original,
      onHandle: () => {
        if (phase === 'idle') startCheck()
      },
      dialog:
        phase === 'checking'
          ? {
              type: 'dialog',
              header: 'Checking usage…',
              onClose: () => setPhase('idle'),
              content: (
                <Box padding={4}>
                  <Flex align="center" gap={3}>
                    <Spinner />
                    <Text>Checking which posts use this category…</Text>
                  </Flex>
                </Box>
              ),
            }
          : phase === 'confirming' || phase === 'working'
            ? {
                type: 'dialog',
                header: 'This category is in use',
                onClose: () => setPhase('idle'),
                content: (
                  <Box padding={4}>
                    <Stack space={4}>
                      <Text>
                        {linkedPosts.length} post{linkedPosts.length === 1 ? '' : 's'} use this category. What
                        should happen to {linkedPosts.length === 1 ? 'it' : 'them'} once this category is
                        deleted?
                      </Text>
                      <Card padding={3} radius={2} border>
                        <Stack space={2}>
                          {linkedPosts.map((post) => (
                            <Text key={post._id} size={1}>
                              {post.title || 'Untitled'}
                            </Text>
                          ))}
                        </Stack>
                      </Card>
                      <Stack space={2}>
                        <Text size={1} weight="medium">
                          Reassign to
                        </Text>
                        <Select
                          value={replacementId}
                          onChange={(e) => setReplacementId(e.currentTarget.value)}
                          disabled={phase === 'working'}
                        >
                          <option value="">Leave uncategorised</option>
                          {otherCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.title || 'Untitled'}
                            </option>
                          ))}
                        </Select>
                      </Stack>
                      {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}
                      <Flex justify="flex-end" gap={2}>
                        <Button
                          text="Cancel"
                          mode="ghost"
                          disabled={phase === 'working'}
                          onClick={() => setPhase('idle')}
                        />
                        <Button
                          text={phase === 'working' ? 'Deleting…' : 'Reassign and delete category'}
                          tone="critical"
                          disabled={phase === 'working'}
                          onClick={confirmAndDelete}
                        />
                      </Flex>
                    </Stack>
                  </Box>
                ),
              }
            : null,
    }
  }

  return WrappedDeleteAction
}
