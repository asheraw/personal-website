import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Box, Card, Spinner, Stack, Text, Flex} from '@sanity/ui'

type LinkedPost = {_id: string; title?: string; publishedAt?: string}

/**
 * Extra tab on a category's document pane (see structure.ts) showing which
 * posts actually use it -- lets Asher tell at a glance whether a category
 * is safe to delete instead of guessing.
 */
export function CategoryPostsView(props: {documentId: string}) {
  const client = useClient({apiVersion: '2023-01-01'})
  const [posts, setPosts] = useState<LinkedPost[] | null>(null)

  // The stored reference on posts always points at the published category
  // id, even while editing a draft of the category itself.
  const publishedId = props.documentId.replace(/^drafts\./, '')

  useEffect(() => {
    client
      .fetch<LinkedPost[]>(
        `*[_type == "post" && references($id)] | order(coalesce(publishedAt, _updatedAt) desc){_id, title, publishedAt}`,
        {id: publishedId}
      )
      .then((results) => {
        // A post can appear twice (its draft AND its published version both
        // referencing this category) -- collapse to one row per post,
        // preferring the draft since it reflects the most current state.
        const seen = new Map<string, LinkedPost>()
        for (const post of results) {
          const baseId = post._id.replace(/^drafts\./, '')
          if (!seen.has(baseId) || post._id.startsWith('drafts.')) seen.set(baseId, post)
        }
        setPosts([...seen.values()])
      })
  }, [client, publishedId])

  if (!posts) {
    return (
      <Box padding={4}>
        <Flex align="center" gap={3}>
          <Spinner muted />
          <Text muted size={1}>
            Checking which posts use this category…
          </Text>
        </Flex>
      </Box>
    )
  }

  if (posts.length === 0) {
    return (
      <Box padding={4}>
        <Text muted size={1}>
          No posts use this category yet — safe to delete if you don&rsquo;t need it.
        </Text>
      </Box>
    )
  }

  return (
    <Box padding={4}>
      <Stack space={3}>
        <Text size={1} muted>
          {posts.length} post{posts.length === 1 ? '' : 's'} use this category:
        </Text>
        {posts.map((post) => (
          <Card key={post._id} padding={3} radius={2} border>
            <Text size={1} weight="medium">
              {post.title || 'Untitled'}
            </Text>
            {post.publishedAt && (
              <Box marginTop={2}>
                <Text size={0} muted>
                  {new Date(post.publishedAt).toLocaleDateString()}
                </Text>
              </Box>
            )}
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
