/** Types generated for queries found in "src/queries.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type role = 'admin' | 'user';

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

const listPopularArticlesIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM (\n    SELECT \n      a.id,\n      title AS \"title!\",\n      author_id AS \"authorId!\",\n      name AS \"authorName!\",\n      first_published_at AS \"publishedAt!\",\n      comments_count AS \"commentsCount!\",\n      likes_count AS \"likesCount!\",\n      (SELECT COUNT(*) FROM views WHERE views.article_id = a.id\n        AND (now() - views.created_at < '14 days'::interval)) AS \"viewsCount!\"\n    FROM last_editions e\n    JOIN articles a ON e.article_id = a.id\n    JOIN users u ON a.author_id = u.id\n    JOIN article_stats s ON a.id = s.id\n    ORDER BY \"viewsCount!\" DESC LIMIT 5\n) AS t WHERE \"viewsCount!\" > 0"};

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
 *       (SELECT COUNT(*) FROM views WHERE views.article_id = a.id
 *         AND (now() - views.created_at < '14 days'::interval)) AS "viewsCount!"
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

const getArticleIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":544,"b":547}]}],"statement":"SELECT\n    a.id,\n    title AS \"title!\",\n    content AS \"content!\",\n    author_id AS \"authorId!\",\n    name AS \"authorName!\",\n    views_count AS \"viewsCount!\",\n    likes_count AS \"likesCount!\",\n    e.id AS \"editionId!\",\n    first_published_at AS \"firstPublishedAt!\",\n    last_published_at AS \"lastPublishedAt!\",\n    (SELECT COUNT(*) FROM editions WHERE article_id = a.id) AS \"editionsCount!\"\n  FROM last_editions e\n  JOIN articles a ON e.article_id = a.id\n  JOIN users u ON a.author_id = u.id\n  JOIN article_stats s ON a.id = s.id\n  WHERE a.id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     a.id,
 *     title AS "title!",
 *     content AS "content!",
 *     author_id AS "authorId!",
 *     name AS "authorName!",
 *     views_count AS "viewsCount!",
 *     likes_count AS "likesCount!",
 *     e.id AS "editionId!",
 *     first_published_at AS "firstPublishedAt!",
 *     last_published_at AS "lastPublishedAt!",
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

const getArticleCommentsIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":193,"b":196}]}],"statement":"SELECT\n  comments.id,\n  content,\n  created_at AS \"createdAt\",\n  author_id AS \"authorId\",\n  name AS \"authorName\"\n  FROM comments JOIN users ON comments.author_id = users.id\n  WHERE article_id = :id!\n  ORDER BY created_at DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   comments.id,
 *   content,
 *   created_at AS "createdAt",
 *   author_id AS "authorId",
 *   name AS "authorName"
 *   FROM comments JOIN users ON comments.author_id = users.id
 *   WHERE article_id = :id!
 *   ORDER BY created_at DESC
 * ```
 */
export const getArticleComments = new PreparedQuery<IGetArticleCommentsParams,IGetArticleCommentsResult>(getArticleCommentsIR);


/** 'GetUserByNaverId' parameters type */
export interface IGetUserByNaverIdParams {
  naverId: string;
}

/** 'GetUserByNaverId' return type */
export interface IGetUserByNaverIdResult {
  id: string;
  name: string;
  role: role;
}

/** 'GetUserByNaverId' query type */
export interface IGetUserByNaverIdQuery {
  params: IGetUserByNaverIdParams;
  result: IGetUserByNaverIdResult;
}

const getUserByNaverIdIR: any = {"usedParamSet":{"naverId":true},"params":[{"name":"naverId","required":true,"transform":{"type":"scalar"},"locs":[{"a":50,"b":58}]}],"statement":"SELECT id, role, name FROM users WHERE naver_id = :naverId!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, role, name FROM users WHERE naver_id = :naverId!
 * ```
 */
export const getUserByNaverId = new PreparedQuery<IGetUserByNaverIdParams,IGetUserByNaverIdResult>(getUserByNaverIdIR);


/** 'CreateUser' parameters type */
export interface ICreateUserParams {
  id: string;
  name: string;
  naverId: string;
}

/** 'CreateUser' return type */
export type ICreateUserResult = void;

/** 'CreateUser' query type */
export interface ICreateUserQuery {
  params: ICreateUserParams;
  result: ICreateUserResult;
}

const createUserIR: any = {"usedParamSet":{"naverId":true,"id":true,"name":true},"params":[{"name":"naverId","required":true,"transform":{"type":"scalar"},"locs":[{"a":47,"b":55}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":58,"b":61}]},{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":64,"b":69}]}],"statement":"INSERT INTO users (naver_id, id, name) VALUES (:naverId!, :id!, :name!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users (naver_id, id, name) VALUES (:naverId!, :id!, :name!)
 * ```
 */
export const createUser = new PreparedQuery<ICreateUserParams,ICreateUserResult>(createUserIR);


/** 'GetUserById' parameters type */
export interface IGetUserByIdParams {
  userId: string;
}

/** 'GetUserById' return type */
export interface IGetUserByIdResult {
  id: string;
  name: string;
  role: role;
}

/** 'GetUserById' query type */
export interface IGetUserByIdQuery {
  params: IGetUserByIdParams;
  result: IGetUserByIdResult;
}

const getUserByIdIR: any = {"usedParamSet":{"userId":true},"params":[{"name":"userId","required":true,"transform":{"type":"scalar"},"locs":[{"a":44,"b":51}]}],"statement":"SELECT id, role, name FROM users WHERE id = :userId!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, role, name FROM users WHERE id = :userId!
 * ```
 */
export const getUserById = new PreparedQuery<IGetUserByIdParams,IGetUserByIdResult>(getUserByIdIR);


/** 'DeleteDraft' parameters type */
export interface IDeleteDraftParams {
  id: number;
  userId: string;
}

/** 'DeleteDraft' return type */
export interface IDeleteDraftResult {
  articleId: number;
}

/** 'DeleteDraft' query type */
export interface IDeleteDraftQuery {
  params: IDeleteDraftParams;
  result: IDeleteDraftResult;
}

const deleteDraftIR: any = {"usedParamSet":{"id":true,"userId":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":30,"b":33}]},{"name":"userId","required":true,"transform":{"type":"scalar"},"locs":[{"a":108,"b":115}]}],"statement":"DELETE FROM drafts\nWHERE id = :id! \n  AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!\nRETURNING article_id AS \"articleId\""};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM drafts
 * WHERE id = :id! 
 *   AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!
 * RETURNING article_id AS "articleId"
 * ```
 */
export const deleteDraft = new PreparedQuery<IDeleteDraftParams,IDeleteDraftResult>(deleteDraftIR);


/** 'DeleteArticleIfNoEditions' parameters type */
export interface IDeleteArticleIfNoEditionsParams {
  id: number;
}

/** 'DeleteArticleIfNoEditions' return type */
export type IDeleteArticleIfNoEditionsResult = void;

/** 'DeleteArticleIfNoEditions' query type */
export interface IDeleteArticleIfNoEditionsQuery {
  params: IDeleteArticleIfNoEditionsParams;
  result: IDeleteArticleIfNoEditionsResult;
}

const deleteArticleIfNoEditionsIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":32,"b":35}]}],"statement":"DELETE FROM articles WHERE id = :id! AND id NOT IN (SELECT article_id FROM editions)"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM articles WHERE id = :id! AND id NOT IN (SELECT article_id FROM editions)
 * ```
 */
export const deleteArticleIfNoEditions = new PreparedQuery<IDeleteArticleIfNoEditionsParams,IDeleteArticleIfNoEditionsResult>(deleteArticleIfNoEditionsIR);


/** 'CreateDraft' parameters type */
export interface ICreateDraftParams {
  authorId: string;
}

/** 'CreateDraft' return type */
export interface ICreateDraftResult {
  created_at: string;
  id: number;
  title: string;
  updated_at: string;
}

/** 'CreateDraft' query type */
export interface ICreateDraftQuery {
  params: ICreateDraftParams;
  result: ICreateDraftResult;
}

const createDraftIR: any = {"usedParamSet":{"authorId":true},"params":[{"name":"authorId","required":true,"transform":{"type":"scalar"},"locs":[{"a":65,"b":74}]}],"statement":"WITH new_article AS (\n  INSERT INTO articles (author_id) VALUES (:authorId!) RETURNING id\n)\nINSERT INTO drafts (article_id) SELECT id FROM new_article\nRETURNING id, title, created_at, updated_at"};

/**
 * Query generated from SQL:
 * ```
 * WITH new_article AS (
 *   INSERT INTO articles (author_id) VALUES (:authorId!) RETURNING id
 * )
 * INSERT INTO drafts (article_id) SELECT id FROM new_article
 * RETURNING id, title, created_at, updated_at
 * ```
 */
export const createDraft = new PreparedQuery<ICreateDraftParams,ICreateDraftResult>(createDraftIR);


