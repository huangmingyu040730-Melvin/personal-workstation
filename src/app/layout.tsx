import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "黄铭语个人数字工作站",
  description: "用于个人展示、学术研究项目管理、知识积累和 AI Skill 工作流管理。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
