/** Types generated for queries found in "src/queries.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'ListArticles' parameters type */
export type IListArticlesParams = void;

/** 'ListArticles' return type */
export interface IListArticlesResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  title: string;
  viewsCount: number;
}

/** 'ListArticles' query type */
export interface IListArticlesQuery {
  params: IListArticlesParams;
  result: IListArticlesResult;
}

const listArticlesIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT\n  a.id,\n  title AS \"title!\",\n  author_id AS \"authorId!\",\n  name AS \"authorName!\",\n  first_published_at AS \"publishedAt!\",\n  comments_count AS \"commentsCount!\",\n  views_count AS \"viewsCount!\",\n  likes_count AS \"likesCount!\"\nFROM last_editions e\n  JOIN articles a ON e.article_id = a.id\n  JOIN users u ON a.author_id = u.id\n  JOIN article_stats s ON a.id = s.id\nORDER BY first_published_at DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   a.id,
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!",
 *   first_published_at AS "publishedAt!",
 *   comments_count AS "commentsCount!",
 *   views_count AS "viewsCount!",
 *   likes_count AS "likesCount!"
 * FROM last_editions e
 *   JOIN articles a ON e.article_id = a.id
 *   JOIN users u ON a.author_id = u.id
 *   JOIN article_stats s ON a.id = s.id
 * ORDER BY first_published_at DESC
 * ```
 */
export const listArticles = new PreparedQuery<IListArticlesParams,IListArticlesResult>(listArticlesIR);


/** 'ListPopularArticles' parameters type */
export type IListPopularArticlesParams = void;

/** 'ListPopularArticles' return type */
export interface IListPopularArticlesResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  title: string;
  viewsCount: number;
}

/** 'ListPopularArticles' query type */
export interface IListPopularArticlesQuery {
  params: IListPopularArticlesParams;
  result: IListPopularArticlesResult;
}

const listPopularArticlesIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM (\n    SELECT \n      a.id,\n      title AS \"title!\",\n      author_id AS \"authorId!\",\n      name AS \"authorName!\",\n      first_published_at AS \"publishedAt!\",\n      comments_count AS \"commentsCount!\",\n      likes_count AS \"likesCount!\",\n    (SELECT COUNT(*) FROM views WHERE views.article_id = a.id\n      AND (now() - views.created_at < '14 days'::interval)) AS \"viewsCount!\"\n    FROM last_editions e\n    JOIN articles a ON e.article_id = a.id\n    JOIN users u ON a.author_id = u.id\n    JOIN article_stats s ON a.id = s.id\n    ORDER BY \"viewsCount!\" DESC LIMIT 5\n) AS t WHERE \"viewsCount!\" > 0"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM (
 *     SELECT 
 *       a.id,
 *       title AS "title!",
 *       author_id AS "authorId!",
 *       name AS "authorName!",
 *       first_published_at AS "publishedAt!",
 *       comments_count AS "commentsCount!",
 *       likes_count AS "likesCount!",
 *     (SELECT COUNT(*) FROM views WHERE views.article_id = a.id
 *       AND (now() - views.created_at < '14 days'::interval)) AS "viewsCount!"
 *     FROM last_editions e
 *     JOIN articles a ON e.article_id = a.id
 *     JOIN users u ON a.author_id = u.id
 *     JOIN article_stats s ON a.id = s.id
 *     ORDER BY "viewsCount!" DESC LIMIT 5
 * ) AS t WHERE "viewsCount!" > 0
 * ```
 */
export const listPopularArticles = new PreparedQuery<IListPopularArticlesParams,IListPopularArticlesResult>(listPopularArticlesIR);


/** 'GetArticle' parameters type */
export interface IGetArticleParams {
  id: number;
}

/** 'GetArticle' return type */
export interface IGetArticleResult {
  authorId: string;
  authorName: string;
  content: string;
  editionId: number;
  editionsCount: number;
  firstPublishedAt: string;
  id: number;
  lastPublishedAt: string;
  likesCount: number;
  title: string;
  viewsCount: number;
}

/** 'GetArticle' query type */
export interface IGetArticleQuery {
  params: IGetArticleParams;
  result: IGetArticleResult;
}

const getArticleIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":516,"b":519}]}],"statement":"SELECT\n    a.id,\n    title AS \"title!\", content AS \"content!\", author_id AS \"authorId!\", name AS \"authorName!\", views_count AS \"viewsCount!\", likes_count AS \"likesCount!\", e.id AS \"editionId!\",\n    first_published_at AS \"firstPublishedAt!\", last_published_at AS \"lastPublishedAt!\",\n    (SELECT COUNT(*) FROM editions WHERE article_id = a.id) AS \"editionsCount!\"\n  FROM last_editions e\n  JOIN articles a ON e.article_id = a.id\n  JOIN users u ON a.author_id = u.id\n  JOIN article_stats s ON a.id = s.id\n  WHERE a.id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     a.id,
 *     title AS "title!", content AS "content!", author_id AS "authorId!", name AS "authorName!", views_count AS "viewsCount!", likes_count AS "likesCount!", e.id AS "editionId!",
 *     first_published_at AS "firstPublishedAt!", last_published_at AS "lastPublishedAt!",
 *     (SELECT COUNT(*) FROM editions WHERE article_id = a.id) AS "editionsCount!"
 *   FROM last_editions e
 *   JOIN articles a ON e.article_id = a.id
 *   JOIN users u ON a.author_id = u.id
 *   JOIN article_stats s ON a.id = s.id
 *   WHERE a.id = :id!
 * ```
 */
export const getArticle = new PreparedQuery<IGetArticleParams,IGetArticleResult>(getArticleIR);


/** 'GetNextArticle' parameters type */
export interface IGetNextArticleParams {
  id: number;
}

/** 'GetNextArticle' return type */
export interface IGetNextArticleResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  title: string;
  viewsCount: number;
}

/** 'GetNextArticle' query type */
export interface IGetNextArticleQuery {
  params: IGetNextArticleParams;
  result: IGetNextArticleResult;
}

const getNextArticleIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":453,"b":456}]}],"statement":"SELECT\n  a.id,\n  title AS \"title!\",\n  author_id AS \"authorId!\",\n  name AS \"authorName!\",\n  first_published_at AS \"publishedAt!\",\n  comments_count AS \"commentsCount!\",\n  views_count AS \"viewsCount!\",\n  likes_count AS \"likesCount!\"\nFROM last_editions e\nJOIN articles a ON e.article_id = a.id\nJOIN users u ON a.author_id = u.id\nJOIN article_stats s ON a.id = s.id\nWHERE first_published_at > (SELECT first_published_at FROM last_editions WHERE article_id = :id!)\nORDER BY first_published_at ASC LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   a.id,
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!",
 *   first_published_at AS "publishedAt!",
 *   comments_count AS "commentsCount!",
 *   views_count AS "viewsCount!",
 *   likes_count AS "likesCount!"
 * FROM last_editions e
 * JOIN articles a ON e.article_id = a.id
 * JOIN users u ON a.author_id = u.id
 * JOIN article_stats s ON a.id = s.id
 * WHERE first_published_at > (SELECT first_published_at FROM last_editions WHERE article_id = :id!)
 * ORDER BY first_published_at ASC LIMIT 1
 * ```
 */
export const getNextArticle = new PreparedQuery<IGetNextArticleParams,IGetNextArticleResult>(getNextArticleIR);


/** 'GetPrevArticle' parameters type */
export interface IGetPrevArticleParams {
  id: number;
}

/** 'GetPrevArticle' return type */
export interface IGetPrevArticleResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  title: string;
  viewsCount: number;
}

/** 'GetPrevArticle' query type */
export interface IGetPrevArticleQuery {
  params: IGetPrevArticleParams;
  result: IGetPrevArticleResult;
}

const getPrevArticleIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":453,"b":456}]}],"statement":"SELECT\n  a.id,\n  title AS \"title!\",\n  author_id AS \"authorId!\",\n  name AS \"authorName!\",\n  first_published_at AS \"publishedAt!\",\n  comments_count AS \"commentsCount!\",\n  views_count AS \"viewsCount!\",\n  likes_count AS \"likesCount!\"\nFROM last_editions e\nJOIN articles a ON e.article_id = a.id\nJOIN users u ON a.author_id = u.id\nJOIN article_stats s ON a.id = s.id\nWHERE first_published_at < (SELECT first_published_at FROM last_editions WHERE article_id = :id!)\nORDER BY first_published_at DESC LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   a.id,
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!",
 *   first_published_at AS "publishedAt!",
 *   comments_count AS "commentsCount!",
 *   views_count AS "viewsCount!",
 *   likes_count AS "likesCount!"
 * FROM last_editions e
 * JOIN articles a ON e.article_id = a.id
 * JOIN users u ON a.author_id = u.id
 * JOIN article_stats s ON a.id = s.id
 * WHERE first_published_at < (SELECT first_published_at FROM last_editions WHERE article_id = :id!)
 * ORDER BY first_published_at DESC LIMIT 1
 * ```
 */
export const getPrevArticle = new PreparedQuery<IGetPrevArticleParams,IGetPrevArticleResult>(getPrevArticleIR);


/** 'GetArticleFiles' parameters type */
export interface IGetArticleFilesParams {
  id: number;
}

/** 'GetArticleFiles' return type */
export interface IGetArticleFilesResult {
  id: number;
  name: string;
}

/** 'GetArticleFiles' query type */
export interface IGetArticleFilesQuery {
  params: IGetArticleFilesParams;
  result: IGetArticleFilesResult;
}

const getArticleFilesIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":102}]}],"statement":"SELECT id, name\n  FROM files\n  WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = :id!)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, name
 *   FROM files
 *   WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = :id!)
 * ```
 */
export const getArticleFiles = new PreparedQuery<IGetArticleFilesParams,IGetArticleFilesResult>(getArticleFilesIR);


/** 'GetArticleComments' parameters type */
export interface IGetArticleCommentsParams {
  id: number;
}

/** 'GetArticleComments' return type */
export interface IGetArticleCommentsResult {
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  id: number;
}

/** 'GetArticleComments' query type */
export interface IGetArticleCommentsQuery {
  params: IGetArticleCommentsParams;
  result: IGetArticleCommentsResult;
}

const getArticleCommentsIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":187,"b":190}]}],"statement":"SELECT comments.id, content, created_at AS \"createdAt\",\n  author_id AS \"authorId\",\n  name AS \"authorName\"\n  FROM comments JOIN users ON comments.author_id = users.id\n  WHERE article_id = :id!\n  ORDER BY created_at DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT comments.id, content, created_at AS "createdAt",
 *   author_id AS "authorId",
 *   name AS "authorName"
 *   FROM comments JOIN users ON comments.author_id = users.id
 *   WHERE article_id = :id!
 *   ORDER BY created_at DESC
 * ```
 */
export const getArticleComments = new PreparedQuery<IGetArticleCommentsParams,IGetArticleCommentsResult>(getArticleCommentsIR);


