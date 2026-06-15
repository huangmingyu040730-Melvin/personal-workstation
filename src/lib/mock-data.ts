import {
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  FlaskConical,
  FolderOpen,
  Home,
  Library,
  Settings,
  Search,
  UserRound,
  WandSparkles
} from "lucide-react";
import type { CalendarItem, DocumentItem, KnowledgeNote, Project, Publication, Skill } from "./types";

export const profile = {
  name: "黄铭语",
  role: "学生｜金融研究｜量化策略｜AI 辅助研究",
  avatarInitials: "黄",
  intro: "我关注资产管理、量化投资，以及人工智能在研究与知识工作流中的应用。",
  education: "本科在读，关注金融工程、资产管理与数据驱动研究方法。",
  interests: ["资产管理", "量化投资", "A 股因子", "私募基金", "知识工作流", "AI Agent"],
  skills: ["Python", "数据分析", "金融研究", "Prompt Engineering", "Codex", "Notion"],
  contact: {
    email: "待补充",
    location: "中国"
  }
};

export const sidebarGroups = [
  {
    label: "总览",
    items: [
      { label: "工作台", href: "/dashboard", icon: Home },
      { label: "全局搜索", href: "/dashboard/search", icon: Search }
    ]
  },
  {
    label: "研究中心",
    items: [
      { label: "日历", href: "/dashboard/calendar", icon: CalendarDays },
      { label: "研究项目", href: "/dashboard/projects", icon: FolderOpen },
      { label: "学术成果", href: "/dashboard/publications", icon: BarChart3 },
      { label: "知识库", href: "/dashboard/knowledge", icon: BookOpen }
    ]
  },
  {
    label: "AI 工作空间",
    items: [
      { label: "AI 草稿", href: "/dashboard/ai-drafts", icon: FlaskConical },
      { label: "Skill 库", href: "/dashboard/skills", icon: WandSparkles },
      { label: "自动化", href: "/automations", icon: Bot }
    ]
  },
  {
    label: "资源管理",
    items: [
      { label: "文件中心", href: "/dashboard/documents", icon: FileText }
    ]
  },
  {
    label: "个人发展",
    items: [
      { label: "求职中心", href: "/dashboard/career", icon: BriefcaseBusiness }
    ]
  },
  {
    label: "系统",
    items: [
      { label: "个人信息", href: "/dashboard/profile", icon: UserRound },
      { label: "设置", href: "/settings", icon: Settings }
    ]
  }
];

export const projects: Project[] = [
  {
    id: "index-enhancement-funds",
    name: "中国私募基金全指指增产品比较研究",
    summary: "围绕中证全指增强类私募产品，比较收益、回撤、风格暴露与超额稳定性。",
    status: "进行中",
    progress: 72,
    visibility: "private",
    updatedAt: "2026-05-31",
    tags: ["私募基金", "指增", "产品比较"],
    milestones: ["样本池整理", "收益指标计算", "风格归因", "报告撰写"]
  },
  {
    id: "factor-effectiveness-study",
    name: "量化因子在 A 股中的有效性研究",
    summary: "测试估值、质量、动量与波动率因子在不同市场环境中的稳定性。",
    status: "进行中",
    progress: 48,
    visibility: "unlisted",
    updatedAt: "2026-05-29",
    tags: ["A 股", "多因子", "回测"],
    milestones: ["因子定义", "数据清洗", "分组回测", "稳健性检验"]
  },
  {
    id: "client-profile-model",
    name: "客户画像与投资需求分析模型",
    summary: "建立客户风险偏好、目标期限、产品理解度与沟通记录的结构化分析模型。",
    status: "规划中",
    progress: 20,
    visibility: "private",
    updatedAt: "2026-05-26",
    tags: ["客户画像", "投资需求", "CRM"],
    milestones: ["字段设计", "访谈模板", "评分框架", "可视化看板"]
  }
];

export const publications: Publication[] = [
  {
    id: "annual-index-enhancement-report",
    title: "中国私募基金全指指增产品年度比较报告",
    type: "研究报告",
    summary: "比较全指指增产品年度表现、风险指标、行业暴露与管理人差异。",
    date: "2026-05-18",
    visibility: "unlisted",
    tags: ["私募基金", "年度报告", "指增"]
  },
  {
    id: "multi-factor-stock-selection",
    title: "基于多因子的 A 股选股策略研究",
    type: "论文草稿",
    summary: "以多因子模型为核心，构建选股组合并评估样本内外表现。",
    date: "2026-04-28",
    visibility: "private",
    tags: ["多因子", "A 股", "量化策略"]
  },
  {
    id: "industry-rotation-backtest",
    title: "行业轮动策略回测分析报告",
    type: "分析报告",
    summary: "基于景气度、动量与估值信号构建行业轮动策略并复盘表现。",
    date: "2026-04-15",
    visibility: "public",
    tags: ["行业轮动", "回测", "资产配置"]
  }
];

export const knowledgeNotes: KnowledgeNote[] = [
  {
    id: "market-data-api",
    title: "行情数据接口整理",
    category: "数据工具",
    excerpt: "整理行情、指数、基金与宏观数据接口，记录字段含义和常见异常。",
    updatedAt: "2 天前",
    visibility: "private",
    tags: ["行情数据", "数据接口", "Python"]
  },
  {
    id: "factor-investing",
    title: "因子投资：理论与实践",
    category: "投资研究",
    excerpt: "记录因子定义、因子拥挤、组合构建与风险控制的核心框架。",
    updatedAt: "3 天前",
    visibility: "unlisted",
    tags: ["因子投资", "量化", "组合"]
  },
  {
    id: "meeting-notes-method",
    title: "客户会议纪要整理方法",
    category: "工作流",
    excerpt: "将会议内容拆解为背景、目标、约束、风险承受能力和下一步行动。",
    updatedAt: "5 天前",
    visibility: "private",
    tags: ["会议纪要", "客户沟通", "结构化"]
  }
];

export const skills: Skill[] = [
  {
    id: "research-digest-assistant",
    name: "研究资料摘要助手",
    description: "将公开资料、会议记录和阅读笔记整理为结构化研究摘要草稿。",
    category: "研究工作流",
    platforms: ["Codex", "Notion"],
    status: "开发中",
    version: "v0.1.0",
    updatedAt: "2026-05-31",
    visibility: "private"
  },
  {
    id: "client-meeting-digest",
    name: "客户会议纪要整理器",
    description: "把会议录音或文字整理为客户画像、关键诉求、风险点和后续行动。",
    category: "客户工作流",
    platforms: ["ChatGPT", "Codex"],
    status: "可用",
    version: "v1.0.0",
    updatedAt: "2026-05-28",
    visibility: "unlisted"
  },
  {
    id: "private-fund-competitor",
    name: "私募产品竞品分析器",
    description: "围绕产品收益、风险、风格暴露和管理人特征生成竞品比较框架。",
    category: "产品研究",
    platforms: ["Codex"],
    status: "规划中",
    version: "规划稿",
    updatedAt: "2026-05-24",
    visibility: "private"
  }
];

export const todayItems: CalendarItem[] = [
  { id: "1", title: "整理全指指增产品样本", time: "09:00", type: "研究", visibility: "private" },
  { id: "2", title: "客户会议纪要结构复盘", time: "14:00", type: "会议", visibility: "private" },
  { id: "3", title: "阅读 Factor Investing 文献", time: "20:00", type: "学习", visibility: "unlisted" }
];

export const documents: DocumentItem[] = [
  {
    id: "doc-1",
    name: "全指指增产品比较报告 v1.2.pdf",
    category: "研究报告",
    size: "2.4 MB",
    updatedAt: "昨天",
    visibility: "private"
  },
  {
    id: "doc-2",
    name: "A 股因子回测结果.xlsx",
    category: "数据表格",
    size: "860 KB",
    updatedAt: "2 天前",
    visibility: "private"
  },
  {
    id: "doc-3",
    name: "客户画像访谈模板.docx",
    category: "模板",
    size: "128 KB",
    updatedAt: "5 天前",
    visibility: "unlisted"
  }
];

export const activityFeed = [
  "更新中国私募基金全指指增产品比较研究进度至 72%",
  "新增行情数据接口整理笔记",
  "研究资料摘要助手完成资料整理流程草案",
  "归档行业轮动策略回测分析报告"
];

export const quickActions = [
  { label: "新建项目", icon: FolderOpen, href: "/dashboard/projects/new" },
  { label: "新建日程", icon: CalendarDays, href: "/dashboard/calendar/new" },
  { label: "新增笔记", icon: Library, href: "/dashboard/knowledge/new" },
  { label: "AI 草稿", icon: FlaskConical, href: "/dashboard/ai-drafts" },
  { label: "新建 Skill", icon: WandSparkles, href: "/dashboard/skills/new" },
  { label: "上传文件", icon: FileText, href: "/dashboard/documents/upload" },
  { label: "求职中心", icon: BriefcaseBusiness, href: "/dashboard/career" }
];
