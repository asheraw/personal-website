import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

// Server-only client with write access -- used to save contact form
// submissions into Sanity. Never import this into client-side code;
// the token it uses can create and edit content, unlike every other
// Sanity client in this project which is read-only.
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
