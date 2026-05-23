import { redirect } from "next/navigation";

/** Legacy route — applications use investor/mentor offer pages. */
export default function ApplyPage() {
  redirect("/startup/discover");
}
