import { redirect } from "next/navigation";

export default async function DocumentCompatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/documents/${id}`);
}
