import {useState} from 'react'
import {Box, Stack, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import {ContentAuditTool} from './ContentAuditTool'
import {LinkCheckerTool} from './LinkCheckerTool'

type View = 'audit' | 'links'

// Content Audit and Link Checker merged into one tool (2026-08-05) -- top
// nav was getting long, and these two genuinely overlap in purpose: both
// are "which posts need a look" checks, just on different things (missing
// metadata vs. broken links). Each tab renders the original, otherwise
// unchanged component -- no logic moved, just a shared page shell.
export function ContentHealthTool() {
  const [view, setView] = useState<View>('audit')

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Content Health
          </Text>
          <Text size={1} muted>
            Two checks across every post: missing metadata, and broken or affiliate links.
          </Text>
        </Stack>

        <TabList space={2}>
          <Tab id="audit-tab" aria-controls="audit-panel" label="Missing Metadata" selected={view === 'audit'} onClick={() => setView('audit')} />
          <Tab id="links-tab" aria-controls="links-panel" label="Link Checker" selected={view === 'links'} onClick={() => setView('links')} />
        </TabList>

        {view === 'audit' && (
          <TabPanel id="audit-panel" aria-labelledby="audit-tab">
            <Box marginTop={3}>
              <ContentAuditTool />
            </Box>
          </TabPanel>
        )}
        {view === 'links' && (
          <TabPanel id="links-panel" aria-labelledby="links-tab">
            <Box marginTop={3}>
              <LinkCheckerTool />
            </Box>
          </TabPanel>
        )}
      </Stack>
    </Box>
  )
}
