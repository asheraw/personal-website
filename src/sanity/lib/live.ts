// Querying with "sanityFetch" keeps content automatically updated: it serves
// published content normally, but switches to live draft content (and
// pushes updates without a page refresh) when Draft Mode is on. Needs
// SANITY_API_READ_TOKEN to read drafts -- without it this only works for
// already-published content.
// <SanityLive /> is the component that keeps that connection open --
// mounted once in src/app/layout.tsx.
import { defineLive } from "next-sanity/live";
import { client } from './client'

export const { sanityFetch, SanityLive } = defineLive({
  client,
  browserToken: process.env.SANITY_API_READ_TOKEN,
  serverToken: process.env.SANITY_API_READ_TOKEN,
});
