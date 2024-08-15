import * as Queries from "./queries_sql";

export type ArticleSummary = Queries.IListArticlesResult;
export type Comment = Queries.IGetArticleCommentsResult;
export type Article = Queries.IGetArticleResult & {
  next: ArticleSummary | null;
  prev: ArticleSummary | null;
  files: Queries.IGetArticleFilesResult[];
  comments: Comment[];
};
export type Role = Queries.role;
export type User = Queries.IGetUserByIdResult;
export type DraftSummary = Queries.IListDraftsResult;
export type EditionSummary = Queries.IListEditionsResult;
export type FileInfo = Queries.IGetArticleFilesResult;
