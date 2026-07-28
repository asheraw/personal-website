import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

// Lets a "Exit preview" link on the frontend turn draft mode back off.
export async function GET() {
  (await draftMode()).disable();
  redirect("/blog");
}
