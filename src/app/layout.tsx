import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "黄铭语的公开研究工作站",
  description: "黄铭语关于投资研究、量化分析、知识文章与 AI Skill 的公开研究工作站。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
