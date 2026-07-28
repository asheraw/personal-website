import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/lib/client";

// Called by Sanity Studio's "Preview" button. Requires SANITY_API_READ_TOKEN
// to be set -- see BACKUP_AND_RECOVERY_GUIDE.md-style setup notes in
// RUNBOOK.md for how to create and add it.
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
});
