import * as Queries from "./queries_sql";
import type * as ArticleActions from "@/actions/articles";

export type ArticleSummary = Awaited<ReturnType<typeof ArticleActions.listArticles>>[number];
export type UserComment = Queries.IListUserCommentsResult;
export type ArticleComment = Queries.IGetArticleCommentsResult;
export type Article = Queries.IGetArticleResult & {
  next: ArticleSummary | null;
  prev: ArticleSummary | null;
  files: Queries.IGetArticleFilesResult[];
  comments: ArticleComment[];
};
export type Role = Queries.role;
export type User = Queries.IGetUserByIdResult;
export type DraftSummary = Queries.IListDraftsResult;
export type EditionSummary = Queries.IListEditionsResult;
export type FileInfo = Queries.IGetArticleFilesResult;
