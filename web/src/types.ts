import Role from "./nndb/public/Role";
import type * as ArticleActions from "@/actions/articles";

export type User = {
  id: string;
  name: string;
  role: Role;
};

export type ArticleSummary = Awaited<
  ReturnType<typeof ArticleActions.listArticles>
>[number];

export type FileInfo = {
  id: number;
  name: string;
};
