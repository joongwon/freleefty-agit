import * as QueryTypes from "./queries.sql";

export type ArticleSummary = QueryTypes.IListArticlesResult;
export type Comment = QueryTypes.IGetArticleCommentsResult;
export type Article = QueryTypes.IGetArticleResult & {
  next: ArticleSummary | null;
  prev: ArticleSummary | null;
  files: QueryTypes.IGetArticleFilesResult[];
  comments: Comment[];
};
