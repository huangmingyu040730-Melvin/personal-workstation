import type { MetadataRoute } from "next";
import { getPublicKnowledgeNotes } from "@/lib/queries/knowledge";
import { getPublicProjects } from "@/lib/queries/projects";
import { getPublicPublications } from "@/lib/queries/publications";
import { getPublicSkills } from "@/lib/queries/skills";
import { absoluteUrl } from "@/lib/site";

function staticEntry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority
  };
}

function datedEntry(path: string, updatedAt: string | null | undefined, priority = 0.7): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: "monthly",
    priority
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, publications, skills, notes] = await Promise.all([
    getPublicProjects(),
    getPublicPublications(),
    getPublicSkills(),
    getPublicKnowledgeNotes()
  ]);

  return [
    staticEntry("/", 1),
    staticEntry("/about", 0.7),
    staticEntry("/projects", 0.8),
    staticEntry("/publications", 0.8),
    staticEntry("/skills", 0.8),
    staticEntry("/knowledge", 0.8),
    ...projects.map((project) => datedEntry(`/projects/${project.slug}`, project.updated_at)),
    ...publications.map((publication) => datedEntry(`/publications/${publication.slug}`, publication.updated_at)),
    ...skills.map((skill) => datedEntry(`/skills/${skill.slug}`, skill.updated_at)),
    ...notes.map((note) => datedEntry(`/knowledge/${note.slug}`, note.updated_at))
  ];
}
