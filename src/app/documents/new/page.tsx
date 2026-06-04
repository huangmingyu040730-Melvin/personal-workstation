import { redirect } from "next/navigation";

export default function NewDocumentCompatPage() {
  redirect("/dashboard/documents/upload");
}
