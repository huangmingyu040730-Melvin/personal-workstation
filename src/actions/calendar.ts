"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import { calendarEventSchema } from "@/lib/validations/calendar";

function calendarPayloadFromForm(formData: FormData) {
  return calendarEventSchema.safeParse({
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    location: getOptionalString(formData, "location"),
    starts_at: getString(formData, "starts_at"),
    ends_at: getOptionalString(formData, "ends_at"),
    event_type: getString(formData, "event_type"),
    visibility: getString(formData, "visibility"),
    project_id: getOptionalString(formData, "project_id"),
    publication_id: getOptionalString(formData, "publication_id"),
    knowledge_note_id: getOptionalString(formData, "knowledge_note_id"),
    skill_id: getOptionalString(formData, "skill_id")
  });
}

function calendarErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getCalendarErrorMessage(error: { message?: string }) {
  return error.message || "日程保存失败，请稍后重试。";
}

export async function createCalendarEventAction(formData: FormData) {
  const parsed = calendarPayloadFromForm(formData);

  if (!parsed.success) {
    calendarErrorRedirect("/dashboard/calendar/new", parsed.error.issues[0]?.message ?? "请检查日程表单。");
  }

  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    calendarErrorRedirect("/dashboard/calendar/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase
    .from("calendar_events")
    .insert({ ...parsed.data, owner_id: actorId })
    .select("id,title,starts_at")
    .single();

  if (insertError) {
    calendarErrorRedirect("/dashboard/calendar/new", getCalendarErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "calendar.create",
    entityType: "calendar_event",
    entityId: data.id,
    metadata: { title: data.title, starts_at: data.starts_at }
  });

  revalidateCalendarPaths(data.id);
  redirect(`/dashboard/calendar/${data.id}`);
}

export async function updateCalendarEventAction(id: string, formData: FormData) {
  const editPath = `/dashboard/calendar/${id}/edit`;
  const parsed = calendarPayloadFromForm(formData);

  if (!parsed.success) {
    calendarErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查日程表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    calendarErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase
    .from("calendar_events")
    .update(parsed.data)
    .eq("id", id)
    .select("id,title,starts_at")
    .single();

  if (updateError) {
    calendarErrorRedirect(editPath, getCalendarErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "calendar.update",
    entityType: "calendar_event",
    entityId: data.id,
    metadata: { title: data.title, starts_at: data.starts_at }
  });

  revalidateCalendarPaths(id);
  redirect(`/dashboard/calendar/${id}`);
}

export async function deleteCalendarEventAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/calendar/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing } = await supabase.from("calendar_events").select("title,starts_at").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("calendar_events").delete().eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/calendar/${id}?error=${encodeFormError(deleteError.message || "删除日程失败。")}`);
  }

  await writeActivityLog({
    action: "calendar.delete",
    entityType: "calendar_event",
    entityId: id,
    metadata: { title: existing?.title ?? "已删除日程", starts_at: existing?.starts_at ?? null }
  });

  revalidateCalendarPaths(id);
  redirect("/dashboard/calendar");
}

function revalidateCalendarPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  if (id) {
    revalidatePath(`/dashboard/calendar/${id}`);
  }
}
