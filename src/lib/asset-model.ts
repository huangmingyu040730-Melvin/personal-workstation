export type AssetModelKey = "project" | "publication" | "knowledge" | "skill";

export const assetModelDefinitions: Record<AssetModelKey, {
  label: string;
  title: string;
  definition: string;
  examples: string[];
  aiDraftDescription: string;
  emptyStateDescription: string;
}> = {
  project: {
    label: "Project",
    title: "Project / 研究项目",
    definition: "用于沉淀持续推进的研究、业务、开发或个人项目主题。",
    examples: ["全指指增竞品分析", "个人数字化工作台开发", "每日市场收评自动化", "一个长期研究主题"],
    aiDraftDescription: "持续推进的研究、业务、开发或个人项目主题，适合长期跟踪和补进度。",
    emptyStateDescription: "Project 用于沉淀持续推进的研究、业务、开发或个人项目主题。可以先从一个长期研究主题或开发项目开始，后续再补进度、里程碑和附件。"
  },
  publication: {
    label: "Publication",
    title: "Publication / 学术成果",
    definition: "用于沉淀已经形成阶段性成果的报告、文章、展示材料、公开研究或作品集内容。",
    examples: ["完整研究报告", "市场收评成稿", "学术成果", "对外展示作品"],
    aiDraftDescription: "已经形成阶段性成果的报告、文章、展示材料、公开研究或作品集内容。",
    emptyStateDescription: "Publication 用于沉淀已经形成阶段性成果的报告、文章、展示材料、公开研究或作品集内容。适合放完整研究报告、成稿文章和对外展示作品。"
  },
  knowledge: {
    label: "Knowledge",
    title: "Knowledge / 知识笔记",
    definition: "用于沉淀可复用的笔记、框架、概念解释、方法论和个人学习记录。",
    examples: ["什么是 CTA", "四大股指期货基差说明", "客户会议纪要模板", "因子投资学习笔记"],
    aiDraftDescription: "可复用的笔记、框架、概念解释、方法论和个人学习记录。",
    emptyStateDescription: "Knowledge 用于沉淀可复用的笔记、框架、概念解释、方法论和个人学习记录。适合放概念说明、学习笔记、会议模板和研究框架。"
  },
  skill: {
    label: "Skill",
    title: "Skill / 工作流能力",
    definition: "用于沉淀可复用的流程、Prompt 模板、操作手册、自动化方法和能力包。",
    examples: ["每日市场收评流程", "客户会议纪要整理模板", "Codex PR 审查流程", "Excel 估值表合并流程"],
    aiDraftDescription: "可复用的流程、Prompt 模板、操作手册、自动化方法和能力包。",
    emptyStateDescription: "Skill 用于沉淀可复用的流程、Prompt 模板、操作手册、自动化方法和能力包。适合放可重复执行的工作流和操作手册。"
  }
};

export function formatAssetModelExamples(assetType: AssetModelKey) {
  return `示例：${assetModelDefinitions[assetType].examples.join("、")}。`;
}
