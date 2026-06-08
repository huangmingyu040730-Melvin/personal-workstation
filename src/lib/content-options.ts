import type { AccessGrantContentType, AccessGrantStatus, AccessRequestContentType, AccessRequestStatus, CalendarEventType, DocumentCategory, DocumentRelatedType, ProjectStatus, PublicationType, SkillStatus } from "./content-types";
import type { Visibility } from "./types";

export const projectStatuses: Array<{ value: ProjectStatus; label: string }> = [
  { value: "planning", label: "规划中" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "archived", label: "已归档" }
];

export const skillStatuses: Array<{ value: SkillStatus; label: string }> = [
  { value: "idea", label: "构想中" },
  { value: "developing", label: "开发中" },
  { value: "testing", label: "测试中" },
  { value: "available", label: "可用" },
  { value: "archived", label: "已归档" }
];

export const visibilityOptions: Array<{ value: Visibility; label: string }> = [
  { value: "private", label: "私密" },
  { value: "restricted", label: "授权可见" },
  { value: "public", label: "公开" },
  { value: "unlisted", label: "链接可见" }
];

export const knowledgeCategories = [
  "金融与投资研究",
  "量化与数据分析",
  "AI 与工具方法",
  "学术研究方法",
  "阅读笔记",
  "工作会议纪要"
];

export const skillCategories = ["研究", "投资", "写作", "自动化", "数据分析", "知识管理"];

export const skillPlatforms = ["ChatGPT", "Codex", "GitHub Actions", "Notion", "n8n"];

export const publicationTypes: Array<{ value: PublicationType; label: string }> = [
  { value: "research_report", label: "研究报告" },
  { value: "academic_paper", label: "学术论文" },
  { value: "strategy_report", label: "策略报告" },
  { value: "market_analysis", label: "市场分析" },
  { value: "data_analysis", label: "数据分析" },
  { value: "meeting_notes", label: "会议纪要" },
  { value: "reading_review", label: "阅读综述" },
  { value: "other", label: "其他" }
];

export const documentCategories: Array<{ value: DocumentCategory; label: string }> = [
  { value: "research_material", label: "研究资料" },
  { value: "publication_attachment", label: "学术成果附件" },
  { value: "data_file", label: "数据文件" },
  { value: "final_report", label: "报告成稿" },
  { value: "meeting_material", label: "会议资料" },
  { value: "skill_attachment", label: "Skill 附件" },
  { value: "other", label: "其他" }
];

export const documentRelatedTypes: Array<{ value: DocumentRelatedType; label: string }> = [
  { value: "publication", label: "学术成果" },
  { value: "project", label: "研究项目" },
  { value: "skill", label: "Skill" }
];

export const accessRequestContentTypes: Array<{ value: AccessRequestContentType; label: string }> = [
  { value: "project", label: "研究项目" },
  { value: "publication", label: "学术成果" },
  { value: "skill", label: "Skill" },
  { value: "knowledge", label: "知识文章" },
  { value: "other", label: "其他" }
];

export const accessRequestStatuses: Array<{ value: AccessRequestStatus; label: string }> = [
  { value: "pending", label: "待处理" },
  { value: "approved", label: "已同意" },
  { value: "rejected", label: "已拒绝" }
];

export const accessGrantContentTypes: Array<{ value: AccessGrantContentType; label: string }> = [
  { value: "project", label: "研究项目" },
  { value: "publication", label: "学术成果" },
  { value: "skill", label: "Skill" },
  { value: "knowledge", label: "知识文章" }
];

export const accessGrantStatuses: Array<{ value: AccessGrantStatus; label: string }> = [
  { value: "active", label: "有效" },
  { value: "revoked", label: "已撤销" }
];

export const calendarEventTypes: Array<{ value: CalendarEventType; label: string }> = [
  { value: "general", label: "普通事项" },
  { value: "meeting", label: "会议" },
  { value: "research", label: "研究" },
  { value: "deadline", label: "截止日期" },
  { value: "review", label: "复盘" },
  { value: "reminder", label: "提醒" }
];

export function getPublicationTypeLabel(value: string | null | undefined) {
  return publicationTypes.find((item) => item.value === value)?.label ?? "其他";
}

export function getDocumentCategoryLabel(value: string | null | undefined) {
  return documentCategories.find((item) => item.value === value)?.label ?? "其他";
}

export function getDocumentRelatedTypeLabel(value: string | null | undefined) {
  return documentRelatedTypes.find((item) => item.value === value)?.label ?? "未关联";
}

export function getAccessRequestContentTypeLabel(value: string | null | undefined) {
  return accessRequestContentTypes.find((item) => item.value === value)?.label ?? "未指定";
}

export function getAccessRequestStatusLabel(value: string | null | undefined) {
  return accessRequestStatuses.find((item) => item.value === value)?.label ?? "待处理";
}

export function getAccessGrantContentTypeLabel(value: string | null | undefined) {
  return accessGrantContentTypes.find((item) => item.value === value)?.label ?? "未知内容";
}

export function getAccessGrantStatusLabel(value: string | null | undefined) {
  return accessGrantStatuses.find((item) => item.value === value)?.label ?? "未知状态";
}

export function getCalendarEventTypeLabel(value: string | null | undefined) {
  return calendarEventTypes.find((item) => item.value === value)?.label ?? "普通事项";
}
