import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

// Used only when Draft Mode is on (i.e. someone clicked "Preview" in
// Studio). Reads unpublished draft content directly from Sanity, so it
// needs a token -- unlike the public `client`, which only ever reads
// already-published content anyone can see.
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: "previewDrafts",
  // Lets the Presentation tool's click-to-edit overlays know which
  // field/document a piece of text on the page came from. `enabled`
  // defaults to false in Sanity's client -- without it, nothing gets
  // encoded and there's nothing for the overlays to attach to, even
  // with VisualEditing mounted correctly. Safe to always leave on here
  // since this client is only ever used inside Draft Mode / preview,
  // never for regular public page views.
  stega: {
    enabled: true,
    studioUrl: "/studio",
  },
});
