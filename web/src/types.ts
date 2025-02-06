import Role from "./nndb/public/Role";
import type * as ArticleActions from "@/actions/articles";
import { UsersId } from "./nndb/public/Users";

export type User = {
  id: UsersId;
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

export type Comment = {
  id: number;
  content: string;
  created_at: string;
} & ({ author_name: string; author_id: string } | object) &
    (
      | {
          article_title: string;
          article_id: number;
        } & (
          {
          article_author_name: string;
          articleAuthorId: string;
          } | object
        )
      | object
    );

export interface Category {
  id: number;
  name: string;
  is_group: boolean;
  parent_id: number | null;
  children: Category[];
};
