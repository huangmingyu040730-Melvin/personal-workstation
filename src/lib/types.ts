export type Visibility = "public" | "private" | "unlisted";

export type Status =
  | "进行中"
  | "规划中"
  | "可用"
  | "开发中"
  | "已发布"
  | "草稿"
  | "planning"
  | "in_progress"
  | "completed"
  | "archived"
  | "idea"
  | "developing"
  | "testing"
  | "available";

export type Project = {
  id: string;
  name: string;
  summary: string;
  status: Status;
  progress: number;
  visibility: Visibility;
  updatedAt: string;
  tags: string[];
  milestones: string[];
};

export type Publication = {
  id: string;
  title: string;
  type: string;
  summary: string;
  date: string;
  visibility: Visibility;
  tags: string[];
};

export type KnowledgeNote = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  updatedAt: string;
  visibility: Visibility;
  tags: string[];
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  category: string;
  platforms: string[];
  status: Status;
  version: string;
  updatedAt: string;
  visibility: Visibility;
};

export type CalendarItem = {
  id: string;
  title: string;
  time: string;
  type: string;
  visibility: Visibility;
};

export type DocumentItem = {
  id: string;
  name: string;
  category: string;
  size: string;
  updatedAt: string;
  visibility: Visibility;
};
