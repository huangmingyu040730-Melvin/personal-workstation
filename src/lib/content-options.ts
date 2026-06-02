import type { ProjectStatus, SkillStatus } from "./content-types";
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
