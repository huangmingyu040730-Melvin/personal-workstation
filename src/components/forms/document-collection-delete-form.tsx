import { Trash2 } from "lucide-react";
import { AdminDangerZone } from "@/components/admin-ui";
import { Field, TextInput } from "./form-fields";
import { SubmitButton } from "./submit-button";

export function DocumentCollectionDeleteForm({
  action,
  documentCount
}: {
  action: (formData: FormData) => void | Promise<void>;
  documentCount: number;
}) {
  return (
    <form action={action}>
      <AdminDangerZone description="删除整个文档包会同时删除包内文件记录和对应 Storage object。">
        <div className="space-y-4">
          <div className="space-y-2 text-sm leading-6 text-rose-700">
            <p>
              将删除该文档包记录、包内 {documentCount} 个文件记录，以及这些文件对应的 Supabase Storage object。
            </p>
            <p>此操作不可撤销，但不会删除或修改关联的 Project、Publication、Knowledge 或 Skill 对象。</p>
          </div>
          <Field label="输入 DELETE 或 删除 以确认" hint="确认文本不匹配时不会执行删除。">
            <TextInput name="confirmation_text" autoComplete="off" required />
          </Field>
          <SubmitButton variant="danger" pendingLabel="删除文档包中..." className="gap-2 px-4 py-2.5">
            <Trash2 size={16} />
            删除整个文档包及文件
          </SubmitButton>
        </div>
      </AdminDangerZone>
    </form>
  );
}
