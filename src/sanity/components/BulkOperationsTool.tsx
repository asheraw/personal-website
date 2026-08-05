import {useCallback, useEffect, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextInput,
} from '@sanity/ui'
import {useClient} from 'sanity'
import {
  computeAddTagChanges,
  computeRemoveTagChanges,
  computeAddCategoryChanges,
  computeRemoveCategoryChanges,
  computeChangeAuthorChanges,
  findMatchContexts,
  computeSearchReplaceChanges,
  summarizeFieldEdit,
  summarizeSearchReplace,
  affectedPostCount,
  type FieldChange,
  type PostForBulkEdit,
  type SearchPost,
} from '../../lib/bulkOperations'

type View = 'edit' | 'search' | 'history'
type FieldOp = 'addTag' | 'removeTag' | 'addCategory' | 'removeCategory' | 'changeAuthor'
type CategoryOption = {_id: string; title?: string}
type AuthorOption = {_id: string; name?: string}
type LogChange = {postId: string; postTitle?: string; fieldPath: string; previousValue: string}
type LogEntry = {_id: string; performedAt?: string; summary?: string; undoneAt?: string; changes: LogChange[]}

// Bulk field edits (add/remove tag, add/remove category, change author) and
// search & replace, both scoped down from the ACE spec's fuller list --
// no bulk publish/unpublish (this schema has no "archived" lifecycle state
// to transition into/out of), no "reassign to series" (no series field
// exists), no link/URL-migration tool (a separate feature). Every commit
// writes a bulkOperationLog document capturing exactly what changed --
// whole-field snapshots of the *previous* value, not per-character diffs
// -- so the History view's Undo can put it back regardless of what kind of
// edit it was. No existing multi-select UI pattern to extend in this
// codebase; the confirm-before-commit phase machine mirrors
// categoryDeleteGuard.tsx, the per-row patch pattern mirrors
// CommentsTool.tsx.
export function BulkOperationsTool() {
  const client = useClient({apiVersion: '2026-07-22'})
  const [view, setView] = useState<View>('edit')

  // ---- Bulk Edit ----
  const [posts, setPosts] = useState<PostForBulkEdit[] | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [authors, setAuthors] = useState<AuthorOption[]>([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tagInput, setTagInput] = useState('')
  const [removeTagValue, setRemoveTagValue] = useState('')
  const [addCategoryId, setAddCategoryId] = useState('')
  const [removeCategoryId, setRemoveCategoryId] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [pendingOp, setPendingOp] = useState<FieldOp | null>(null)
  const [pendingChanges, setPendingChanges] = useState<FieldChange[] | null>(null)
  const [pendingLabel, setPendingLabel] = useState('')
  const [editPhase, setEditPhase] = useState<'idle' | 'confirming' | 'working'>('idle')
  const [editError, setEditError] = useState('')

  const load = useCallback(() => {
    client
      .fetch<PostForBulkEdit[]>(
        `*[_type == "post" && defined(slug.current)] | order(title asc){
          _id, title, tags, "categories": categories[]{"_ref": _ref}, "author": author{"_ref": _ref}
        }`,
      )
      .then(setPosts)
    client.fetch<CategoryOption[]>(`*[_type == "category"] | order(title asc){_id, title}`).then(setCategories)
    client.fetch<AuthorOption[]>(`*[_type == "author"] | order(name asc){_id, name}`).then(setAuthors)
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  const visiblePosts = (posts ?? []).filter((p) => (p.title ?? '').toLowerCase().includes(filter.toLowerCase()))
  const allTagsInUse = [...new Set((posts ?? []).flatMap((p) => p.tags ?? []))].sort()

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllVisible() {
    setSelected((prev) => {
      const allVisibleSelected = visiblePosts.length > 0 && visiblePosts.every((p) => prev.has(p._id))
      if (allVisibleSelected) {
        const next = new Set(prev)
        visiblePosts.forEach((p) => next.delete(p._id))
        return next
      }
      return new Set([...prev, ...visiblePosts.map((p) => p._id)])
    })
  }

  function startFieldOp(op: FieldOp) {
    if (!posts) return
    const scoped = posts.filter((p) => selected.has(p._id))
    if (scoped.length === 0) {
      setEditError('Select at least one post first.')
      return
    }
    let changes: FieldChange[] = []
    let label = ''
    if (op === 'addTag') {
      label = tagInput.trim()
      if (!label) return
      changes = computeAddTagChanges(scoped, label)
    } else if (op === 'removeTag') {
      label = removeTagValue
      if (!label) return
      changes = computeRemoveTagChanges(scoped, label)
    } else if (op === 'addCategory') {
      const cat = categories.find((c) => c._id === addCategoryId)
      label = cat?.title ?? ''
      if (!addCategoryId) return
      changes = computeAddCategoryChanges(scoped, addCategoryId)
    } else if (op === 'removeCategory') {
      const cat = categories.find((c) => c._id === removeCategoryId)
      label = cat?.title ?? ''
      if (!removeCategoryId) return
      changes = computeRemoveCategoryChanges(scoped, removeCategoryId)
    } else {
      const author = authors.find((a) => a._id === authorId)
      label = author?.name ?? ''
      if (!authorId) return
      changes = computeChangeAuthorChanges(scoped, authorId)
    }
    if (changes.length === 0) {
      setEditError('No change needed -- every selected post already matches.')
      return
    }
    setEditError('')
    setPendingOp(op)
    setPendingChanges(changes)
    setPendingLabel(summarizeFieldEdit(op, label, changes))
    setEditPhase('confirming')
  }

  async function confirmFieldOp() {
    if (!pendingChanges || !pendingOp) return
    setEditPhase('working')
    setEditError('')
    try {
      const tx = client.transaction()
      for (const change of pendingChanges) {
        tx.patch(client.patch(change.postId).set({[change.fieldPath]: change.newValue}))
      }
      await tx.commit()
      await client.create({
        _type: 'bulkOperationLog',
        performedAt: new Date().toISOString(),
        operationType: pendingOp,
        summary: pendingLabel,
        changes: pendingChanges.map((c) => ({
          postId: c.postId,
          postTitle: c.postTitle,
          fieldPath: c.fieldPath,
          previousValue: JSON.stringify(c.previousValue),
        })),
      })
      setPosts((prev) =>
        prev
          ? prev.map((p) => {
              const change = pendingChanges.find((c) => c.postId === p._id)
              return change ? {...p, [change.fieldPath]: change.newValue} : p
            })
          : prev,
      )
      setSelected(new Set())
      setTagInput('')
      setRemoveTagValue('')
      setAddCategoryId('')
      setRemoveCategoryId('')
      setAuthorId('')
      setPendingChanges(null)
      setPendingOp(null)
      setEditPhase('idle')
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Something went wrong -- nothing was changed.')
      setEditPhase('confirming')
    }
  }

  // ---- Search & Replace ----
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchPost[] | null>(null)
  const [searchBusy, setSearchBusy] = useState(false)
  const [includedIds, setIncludedIds] = useState<Set<string>>(new Set())
  const [replacement, setReplacement] = useState('')
  const [srPendingChanges, setSrPendingChanges] = useState<FieldChange[] | null>(null)
  const [srSummary, setSrSummary] = useState('')
  const [srPhase, setSrPhase] = useState<'idle' | 'confirming' | 'working'>('idle')
  const [srError, setSrError] = useState('')

  async function runSearch() {
    const term = searchTerm.trim()
    if (!term) return
    setSearchBusy(true)
    setSrError('')
    setSearchResults(null)
    try {
      const results = await client.fetch<SearchPost[]>(
        `*[_type == "post" && (title match $t || excerpt match $t || pt::text(body) match $t)]{
          _id, title, "slug": slug.current, excerpt, body
        }`,
        {t: `*${term}*`},
      )
      setSearchResults(results)
      setIncludedIds(new Set(results.map((r) => r._id)))
    } catch (e) {
      setSrError(e instanceof Error ? e.message : 'Search failed.')
    } finally {
      setSearchBusy(false)
    }
  }

  function toggleIncluded(id: string) {
    setIncludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function startReplace() {
    if (!searchResults || !replacement) return
    const included = searchResults.filter((p) => includedIds.has(p._id))
    const changes = included.flatMap((p) => computeSearchReplaceChanges(p, searchTerm.trim(), replacement))
    if (changes.length === 0) {
      setSrError('Nothing to replace in the included posts.')
      return
    }
    setSrError('')
    setSrPendingChanges(changes)
    setSrSummary(summarizeSearchReplace(searchTerm.trim(), replacement, changes))
    setSrPhase('confirming')
  }

  async function confirmReplace() {
    if (!srPendingChanges) return
    setSrPhase('working')
    setSrError('')
    try {
      const tx = client.transaction()
      for (const change of srPendingChanges) {
        tx.patch(client.patch(change.postId).set({[change.fieldPath]: change.newValue}))
      }
      await tx.commit()
      await client.create({
        _type: 'bulkOperationLog',
        performedAt: new Date().toISOString(),
        operationType: 'searchReplace',
        summary: srSummary,
        changes: srPendingChanges.map((c) => ({
          postId: c.postId,
          postTitle: c.postTitle,
          fieldPath: c.fieldPath,
          previousValue: JSON.stringify(c.previousValue),
        })),
      })
      setSrPendingChanges(null)
      setSrPhase('idle')
      setSearchResults(null)
      setSearchTerm('')
      setReplacement('')
      setIncludedIds(new Set())
    } catch (e) {
      setSrError(e instanceof Error ? e.message : 'Something went wrong -- nothing was changed.')
      setSrPhase('confirming')
    }
  }

  // ---- History ----
  const [logs, setLogs] = useState<LogEntry[] | null>(null)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const [undoError, setUndoError] = useState('')

  const loadLogs = useCallback(() => {
    client
      .fetch<LogEntry[]>(
        `*[_type == "bulkOperationLog"] | order(performedAt desc){_id, performedAt, summary, undoneAt, changes}`,
      )
      .then(setLogs)
  }, [client])

  useEffect(() => {
    if (view === 'history') loadLogs()
  }, [view, loadLogs])

  async function undoLog(log: LogEntry) {
    setUndoingId(log._id)
    setUndoError('')
    try {
      const tx = client.transaction()
      for (const change of log.changes) {
        tx.patch(client.patch(change.postId).set({[change.fieldPath]: JSON.parse(change.previousValue)}))
      }
      await tx.commit()
      const undoneAt = new Date().toISOString()
      await client.patch(log._id).set({undoneAt}).commit()
      setLogs((prev) => (prev ? prev.map((l) => (l._id === log._id ? {...l, undoneAt} : l)) : prev))
    } catch (e) {
      setUndoError(
        e instanceof Error
          ? `Undo failed: ${e.message} -- a post in this batch may have been deleted since.`
          : 'Undo failed.',
      )
    } finally {
      setUndoingId(null)
    }
  }

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Bulk Operations
          </Text>
          <Text size={1} muted>
            Edit tags, categories, or the author across many posts at once, or find and replace text across
            every post&rsquo;s title, excerpt, and body. Every change here is undoable from the History tab.
          </Text>
        </Stack>

        <TabList space={2}>
          <Tab id="edit-tab" aria-controls="edit-panel" label="Bulk Edit" selected={view === 'edit'} onClick={() => setView('edit')} />
          <Tab
            id="search-tab"
            aria-controls="search-panel"
            label="Search & Replace"
            selected={view === 'search'}
            onClick={() => setView('search')}
          />
          <Tab
            id="history-tab"
            aria-controls="history-panel"
            label="History"
            selected={view === 'history'}
            onClick={() => setView('history')}
          />
        </TabList>

        {view === 'edit' && (
          <TabPanel id="edit-panel" aria-labelledby="edit-tab">
            {!posts ? (
              <Flex align="center" justify="center" padding={6}>
                <Spinner muted />
              </Flex>
            ) : (
              <Stack space={4} marginTop={3}>
                <Card padding={3} radius={2} border>
                  <Stack space={3}>
                    <TextInput
                      placeholder="Filter posts by title…"
                      value={filter}
                      onChange={(e) => setFilter(e.currentTarget.value)}
                    />
                    <Flex align="center" justify="space-between">
                      <Text size={1} muted>
                        {selected.size} of {posts.length} selected
                      </Text>
                      <Button
                        text={visiblePosts.length > 0 && visiblePosts.every((p) => selected.has(p._id)) ? 'Deselect visible' : 'Select visible'}
                        mode="ghost"
                        fontSize={1}
                        onClick={toggleSelectAllVisible}
                      />
                    </Flex>
                    <Box style={{maxHeight: 280, overflowY: 'auto'}}>
                      <Stack space={2}>
                        {visiblePosts.map((post) => (
                          <Flex key={post._id} align="center" gap={2}>
                            <Checkbox checked={selected.has(post._id)} onChange={() => toggleSelected(post._id)} />
                            <Text size={1} textOverflow="ellipsis">
                              {post.title || 'Untitled'}
                            </Text>
                          </Flex>
                        ))}
                        {visiblePosts.length === 0 && (
                          <Text size={1} muted>
                            No posts match &ldquo;{filter}&rdquo;.
                          </Text>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>

                <Card padding={3} radius={2} border>
                  <Stack space={4}>
                    <Text size={1} weight="semibold">
                      Tags
                    </Text>
                    <Flex gap={2} wrap="wrap" align="center">
                      <TextInput
                        placeholder="Add tag…"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.currentTarget.value)}
                        style={{minWidth: 160}}
                      />
                      <Button text="Add to selected" mode="ghost" fontSize={1} onClick={() => startFieldOp('addTag')} />
                      <Select
                        value={removeTagValue}
                        onChange={(e) => setRemoveTagValue(e.currentTarget.value)}
                        style={{minWidth: 160}}
                      >
                        <option value="">Remove tag…</option>
                        {allTagsInUse.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                      <Button
                        text="Remove from selected"
                        mode="ghost"
                        tone="critical"
                        fontSize={1}
                        onClick={() => startFieldOp('removeTag')}
                      />
                    </Flex>

                    <Text size={1} weight="semibold">
                      Categories
                    </Text>
                    <Flex gap={2} wrap="wrap" align="center">
                      <Select
                        value={addCategoryId}
                        onChange={(e) => setAddCategoryId(e.currentTarget.value)}
                        style={{minWidth: 160}}
                      >
                        <option value="">Add category…</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </Select>
                      <Button text="Add to selected" mode="ghost" fontSize={1} onClick={() => startFieldOp('addCategory')} />
                      <Select
                        value={removeCategoryId}
                        onChange={(e) => setRemoveCategoryId(e.currentTarget.value)}
                        style={{minWidth: 160}}
                      >
                        <option value="">Remove category…</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </Select>
                      <Button
                        text="Remove from selected"
                        mode="ghost"
                        tone="critical"
                        fontSize={1}
                        onClick={() => startFieldOp('removeCategory')}
                      />
                    </Flex>

                    <Text size={1} weight="semibold">
                      Author
                    </Text>
                    <Flex gap={2} wrap="wrap" align="center">
                      <Select value={authorId} onChange={(e) => setAuthorId(e.currentTarget.value)} style={{minWidth: 160}}>
                        <option value="">Change author to…</option>
                        {authors.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name}
                          </option>
                        ))}
                      </Select>
                      <Button text="Apply to selected" mode="ghost" fontSize={1} onClick={() => startFieldOp('changeAuthor')} />
                    </Flex>

                    {editError && <Text tone="critical">{editError}</Text>}
                  </Stack>
                </Card>
              </Stack>
            )}
          </TabPanel>
        )}

        {view === 'search' && (
          <TabPanel id="search-panel" aria-labelledby="search-tab">
            <Stack space={4} marginTop={3}>
              <Card padding={3} radius={2} border>
                <Stack space={3}>
                  <Text size={1} muted>
                    Finds text across every post&rsquo;s title, excerpt, and body paragraphs (not image
                    captions, callouts, or code blocks). Review every match before anything changes.
                  </Text>
                  <Flex gap={2}>
                    <TextInput
                      placeholder="Find…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.currentTarget.value)}
                      style={{flex: 1}}
                    />
                    <Button text={searchBusy ? 'Searching…' : 'Search'} tone="primary" disabled={searchBusy || !searchTerm.trim()} onClick={runSearch} />
                  </Flex>
                </Stack>
              </Card>

              {searchResults && (
                <Card padding={3} radius={2} border>
                  <Stack space={3}>
                    <Text size={1} weight="semibold">
                      {searchResults.length} post{searchResults.length === 1 ? '' : 's'} match
                    </Text>
                    {searchResults.length > 0 && (
                      <>
                        <Box style={{maxHeight: 260, overflowY: 'auto'}}>
                          <Stack space={3}>
                            {searchResults.map((post) => (
                              <Flex key={post._id} align="flex-start" gap={2}>
                                <Checkbox
                                  checked={includedIds.has(post._id)}
                                  onChange={() => toggleIncluded(post._id)}
                                  style={{marginTop: 3}}
                                />
                                <Stack space={1} style={{flex: 1}}>
                                  <Text size={1} weight="medium">
                                    {post.title || 'Untitled'}
                                  </Text>
                                  {findMatchContexts(post, searchTerm.trim(), 2).map((ctx, i) => (
                                    <Text key={i} size={0} muted style={{fontFamily: 'monospace'}}>
                                      {ctx}
                                    </Text>
                                  ))}
                                </Stack>
                              </Flex>
                            ))}
                          </Stack>
                        </Box>
                        <TextInput
                          placeholder="Replace with…"
                          value={replacement}
                          onChange={(e) => setReplacement(e.currentTarget.value)}
                        />
                        <Button
                          text="Preview replacement"
                          tone="primary"
                          disabled={includedIds.size === 0 || !replacement}
                          onClick={startReplace}
                        />
                      </>
                    )}
                  </Stack>
                </Card>
              )}
              {srError && !srPendingChanges && <Text tone="critical">{srError}</Text>}
            </Stack>
          </TabPanel>
        )}

        {view === 'history' && (
          <TabPanel id="history-panel" aria-labelledby="history-tab">
            <Stack space={3} marginTop={3}>
              {!logs ? (
                <Flex align="center" justify="center" padding={6}>
                  <Spinner muted />
                </Flex>
              ) : logs.length === 0 ? (
                <Text size={1} muted>
                  No bulk operations yet.
                </Text>
              ) : (
                logs.map((log) => (
                  <Card key={log._id} padding={3} radius={2} border>
                    <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                      <Stack space={1}>
                        <Text size={1} weight="medium">
                          {log.summary}
                        </Text>
                        <Text size={0} muted>
                          {log.performedAt && new Date(log.performedAt).toLocaleString()}
                        </Text>
                      </Stack>
                      {log.undoneAt ? (
                        <Badge tone="default" fontSize={0}>
                          Undone {new Date(log.undoneAt).toLocaleDateString()}
                        </Badge>
                      ) : (
                        <Button
                          text={undoingId === log._id ? 'Undoing…' : 'Undo'}
                          mode="ghost"
                          tone="critical"
                          fontSize={1}
                          disabled={undoingId !== null}
                          onClick={() => undoLog(log)}
                        />
                      )}
                    </Flex>
                  </Card>
                ))
              )}
              {undoError && <Text tone="critical">{undoError}</Text>}
            </Stack>
          </TabPanel>
        )}
      </Stack>

      {editPhase !== 'idle' && pendingChanges && (
        <Dialog id="bulk-edit-confirm" header="Confirm change" onClose={() => (editPhase === 'confirming' ? setEditPhase('idle') : undefined)}>
          <Box padding={4}>
            <Stack space={4}>
              <Text>{pendingLabel}</Text>
              <Card padding={3} radius={2} border tone="caution">
                <Text size={1}>
                  This writes to {affectedPostCount(pendingChanges)} post
                  {affectedPostCount(pendingChanges) === 1 ? '' : 's'} immediately. It&rsquo;s undoable
                  afterward from the History tab.
                </Text>
              </Card>
              {editError && <Text tone="critical">{editError}</Text>}
              <Flex justify="flex-end" gap={2}>
                <Button text="Cancel" mode="ghost" disabled={editPhase === 'working'} onClick={() => setEditPhase('idle')} />
                <Button
                  text={editPhase === 'working' ? 'Applying…' : 'Confirm'}
                  tone="primary"
                  disabled={editPhase === 'working'}
                  onClick={confirmFieldOp}
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}

      {srPhase !== 'idle' && srPendingChanges && (
        <Dialog id="search-replace-confirm" header="Confirm replacement" onClose={() => (srPhase === 'confirming' ? setSrPhase('idle') : undefined)}>
          <Box padding={4}>
            <Stack space={4}>
              <Text>{srSummary}</Text>
              <Card padding={3} radius={2} border tone="caution">
                <Text size={1}>
                  This writes to {affectedPostCount(srPendingChanges)} post
                  {affectedPostCount(srPendingChanges) === 1 ? '' : 's'} immediately. It&rsquo;s undoable
                  afterward from the History tab.
                </Text>
              </Card>
              {srError && <Text tone="critical">{srError}</Text>}
              <Flex justify="flex-end" gap={2}>
                <Button text="Cancel" mode="ghost" disabled={srPhase === 'working'} onClick={() => setSrPhase('idle')} />
                <Button
                  text={srPhase === 'working' ? 'Replacing…' : 'Confirm'}
                  tone="primary"
                  disabled={srPhase === 'working'}
                  onClick={confirmReplace}
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Box>
  )
}
