/** Types generated for queries found in "src/queries.sql" */
import { PreparedQuery } from "@pgtyped/runtime";

export type role = "admin" | "user";

/** 'ListArticles' parameters type */
export interface IListArticlesParams {
  before: string;
  limit: number;
  prevId?: number | null | void;
}

/** 'ListArticles' return type */
export interface IListArticlesResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  editionId: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  thumbnailId: number;
  thumbnailName: string;
  title: string;
  viewsCount: number;
}

/** 'ListArticles' query type */
export interface IListArticlesQuery {
  params: IListArticlesParams;
  result: IListArticlesResult;
}

const listArticlesIR: any = {
  usedParamSet: { before: true, prevId: true, limit: true },
  params: [
    {
      name: "before",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 499, b: 506 }],
    },
    {
      name: "prevId",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 518, b: 524 }],
    },
    {
      name: "limit",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 578, b: 584 }],
    },
  ],
  statement:
    'SELECT\n  a.id,\n  e.id AS "editionId!",\n  title AS "title!",\n  author_id AS "authorId!",\n  name AS "authorName!",\n  first_published_at AS "publishedAt!",\n  comments_count AS "commentsCount!",\n  views_count AS "viewsCount!",\n  likes_count AS "likesCount!",\n  thumbnail_id AS "thumbnailId!",\n  thumbnail_name AS "thumbnailName!"\nFROM last_editions e\n  JOIN articles a ON e.article_id = a.id\n  JOIN users u ON a.author_id = u.id\n  JOIN article_stats s ON a.id = s.id\nWHERE (first_published_at, a.id) < (:before!, COALESCE(:prevId, 0))\nORDER BY (first_published_at, a.id) DESC\nLIMIT :limit!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   a.id,
 *   e.id AS "editionId!",
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!",
 *   first_published_at AS "publishedAt!",
 *   comments_count AS "commentsCount!",
 *   views_count AS "viewsCount!",
 *   likes_count AS "likesCount!",
 *   thumbnail_id AS "thumbnailId!",
 *   thumbnail_name AS "thumbnailName!"
 * FROM last_editions e
 *   JOIN articles a ON e.article_id = a.id
 *   JOIN users u ON a.author_id = u.id
 *   JOIN article_stats s ON a.id = s.id
 * WHERE (first_published_at, a.id) < (:before!, COALESCE(:prevId, 0))
 * ORDER BY (first_published_at, a.id) DESC
 * LIMIT :limit!
 * ```
 */
export const listArticles = new PreparedQuery<
  IListArticlesParams,
  IListArticlesResult
>(listArticlesIR);

/** 'ListArticlesByAuthor' parameters type */
export interface IListArticlesByAuthorParams {
  authorId: string;
  before: string;
  limit: number;
  prevId?: number | null | void;
}

/** 'ListArticlesByAuthor' return type */
export interface IListArticlesByAuthorResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  editionId: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  thumbnailId: number;
  thumbnailName: string;
  title: string;
  viewsCount: number;
}

/** 'ListArticlesByAuthor' query type */
export interface IListArticlesByAuthorQuery {
  params: IListArticlesByAuthorParams;
  result: IListArticlesByAuthorResult;
}

const listArticlesByAuthorIR: any = {
  usedParamSet: { authorId: true, before: true, prevId: true, limit: true },
  params: [
    {
      name: "authorId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 483, b: 492 }],
    },
    {
      name: "before",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 530, b: 537 }],
    },
    {
      name: "prevId",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 549, b: 555 }],
    },
    {
      name: "limit",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 609, b: 615 }],
    },
  ],
  statement:
    'SELECT\n  a.id,\n  e.id AS "editionId!",\n  title AS "title!",\n  author_id AS "authorId!",\n  name AS "authorName!",\n  first_published_at AS "publishedAt!",\n  comments_count AS "commentsCount!",\n  views_count AS "viewsCount!",\n  likes_count AS "likesCount!",\n  thumbnail_id AS "thumbnailId!",\n  thumbnail_name AS "thumbnailName!"\nFROM last_editions e\n  JOIN articles a ON e.article_id = a.id\n  JOIN users u ON a.author_id = u.id\n  JOIN article_stats s ON a.id = s.id\nWHERE a.author_id = :authorId!\n  AND (first_published_at, a.id) < (:before!, COALESCE(:prevId, 0))\nORDER BY (first_published_at, a.id) DESC\nLIMIT :limit!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   a.id,
 *   e.id AS "editionId!",
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!",
 *   first_published_at AS "publishedAt!",
 *   comments_count AS "commentsCount!",
 *   views_count AS "viewsCount!",
 *   likes_count AS "likesCount!",
 *   thumbnail_id AS "thumbnailId!",
 *   thumbnail_name AS "thumbnailName!"
 * FROM last_editions e
 *   JOIN articles a ON e.article_id = a.id
 *   JOIN users u ON a.author_id = u.id
 *   JOIN article_stats s ON a.id = s.id
 * WHERE a.author_id = :authorId!
 *   AND (first_published_at, a.id) < (:before!, COALESCE(:prevId, 0))
 * ORDER BY (first_published_at, a.id) DESC
 * LIMIT :limit!
 * ```
 */
export const listArticlesByAuthor = new PreparedQuery<
  IListArticlesByAuthorParams,
  IListArticlesByAuthorResult
>(listArticlesByAuthorIR);

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

const listPopularArticlesIR: any = {
  usedParamSet: {},
  params: [],
  statement:
    'SELECT * FROM (\n    SELECT \n      a.id,\n      title AS "title!",\n      author_id AS "authorId!",\n      name AS "authorName!",\n      first_published_at AS "publishedAt!",\n      comments_count AS "commentsCount!",\n      likes_count AS "likesCount!",\n      (SELECT COUNT(*) FROM views WHERE views.article_id = a.id\n        AND (now() - views.created_at < \'14 days\'::interval)) AS "viewsCount!"\n    FROM last_editions e\n    JOIN articles a ON e.article_id = a.id\n    JOIN users u ON a.author_id = u.id\n    JOIN article_stats s ON a.id = s.id\n    ORDER BY "viewsCount!" DESC LIMIT 5\n) AS t WHERE "viewsCount!" > 0',
};

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
export const listPopularArticles = new PreparedQuery<
  IListPopularArticlesParams,
  IListPopularArticlesResult
>(listPopularArticlesIR);

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

const getArticleIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 544, b: 547 }],
    },
  ],
  statement:
    'SELECT\n    a.id,\n    title AS "title!",\n    content AS "content!",\n    author_id AS "authorId!",\n    name AS "authorName!",\n    views_count AS "viewsCount!",\n    likes_count AS "likesCount!",\n    e.id AS "editionId!",\n    first_published_at AS "firstPublishedAt!",\n    last_published_at AS "lastPublishedAt!",\n    (SELECT COUNT(*) FROM editions WHERE article_id = a.id) AS "editionsCount!"\n  FROM last_editions e\n  JOIN articles a ON e.article_id = a.id\n  JOIN users u ON a.author_id = u.id\n  JOIN article_stats s ON a.id = s.id\n  WHERE a.id = :id!',
};

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
export const getArticle = new PreparedQuery<
  IGetArticleParams,
  IGetArticleResult
>(getArticleIR);

/** 'GetNextArticle' parameters type */
export interface IGetNextArticleParams {
  id: number;
}

/** 'GetNextArticle' return type */
export interface IGetNextArticleResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  editionId: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  thumbnailId: number;
  thumbnailName: string;
  title: string;
  viewsCount: number;
}

/** 'GetNextArticle' query type */
export interface IGetNextArticleQuery {
  params: IGetNextArticleParams;
  result: IGetNextArticleResult;
}

const getNextArticleIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [
        { a: 558, b: 561 },
        { a: 565, b: 568 },
      ],
    },
  ],
  statement:
    'SELECT\n  a.id,\n  e.id AS "editionId!",\n  title AS "title!",\n  author_id AS "authorId!",\n  name AS "authorName!",\n  first_published_at AS "publishedAt!",\n  comments_count AS "commentsCount!",\n  views_count AS "viewsCount!",\n  likes_count AS "likesCount!",\n  thumbnail_id AS "thumbnailId!",\n  thumbnail_name AS "thumbnailName!"\nFROM last_editions e\nJOIN articles a ON e.article_id = a.id\nJOIN users u ON a.author_id = u.id\nJOIN article_stats s ON a.id = s.id\nWHERE (first_published_at, a.id) > ((SELECT first_published_at FROM last_editions WHERE article_id = :id!), :id!)\nORDER BY (first_published_at, a.id) ASC LIMIT 1',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   a.id,
 *   e.id AS "editionId!",
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!",
 *   first_published_at AS "publishedAt!",
 *   comments_count AS "commentsCount!",
 *   views_count AS "viewsCount!",
 *   likes_count AS "likesCount!",
 *   thumbnail_id AS "thumbnailId!",
 *   thumbnail_name AS "thumbnailName!"
 * FROM last_editions e
 * JOIN articles a ON e.article_id = a.id
 * JOIN users u ON a.author_id = u.id
 * JOIN article_stats s ON a.id = s.id
 * WHERE (first_published_at, a.id) > ((SELECT first_published_at FROM last_editions WHERE article_id = :id!), :id!)
 * ORDER BY (first_published_at, a.id) ASC LIMIT 1
 * ```
 */
export const getNextArticle = new PreparedQuery<
  IGetNextArticleParams,
  IGetNextArticleResult
>(getNextArticleIR);

/** 'GetPrevArticle' parameters type */
export interface IGetPrevArticleParams {
  id: number;
}

/** 'GetPrevArticle' return type */
export interface IGetPrevArticleResult {
  authorId: string;
  authorName: string;
  commentsCount: number;
  editionId: number;
  id: number;
  likesCount: number;
  publishedAt: string;
  thumbnailId: number;
  thumbnailName: string;
  title: string;
  viewsCount: number;
}

/** 'GetPrevArticle' query type */
export interface IGetPrevArticleQuery {
  params: IGetPrevArticleParams;
  result: IGetPrevArticleResult;
}

const getPrevArticleIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [
        { a: 558, b: 561 },
        { a: 565, b: 568 },
      ],
    },
  ],
  statement:
    'SELECT\n  a.id,\n  e.id AS "editionId!",\n  title AS "title!",\n  author_id AS "authorId!",\n  name AS "authorName!",\n  first_published_at AS "publishedAt!",\n  comments_count AS "commentsCount!",\n  views_count AS "viewsCount!",\n  likes_count AS "likesCount!",\n  thumbnail_id AS "thumbnailId!",\n  thumbnail_name AS "thumbnailName!"\nFROM last_editions e\nJOIN articles a ON e.article_id = a.id\nJOIN users u ON a.author_id = u.id\nJOIN article_stats s ON a.id = s.id\nWHERE (first_published_at, a.id) < ((SELECT first_published_at FROM last_editions WHERE article_id = :id!), :id!)\nORDER BY (first_published_at, a.id) DESC LIMIT 1',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   a.id,
 *   e.id AS "editionId!",
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!",
 *   first_published_at AS "publishedAt!",
 *   comments_count AS "commentsCount!",
 *   views_count AS "viewsCount!",
 *   likes_count AS "likesCount!",
 *   thumbnail_id AS "thumbnailId!",
 *   thumbnail_name AS "thumbnailName!"
 * FROM last_editions e
 * JOIN articles a ON e.article_id = a.id
 * JOIN users u ON a.author_id = u.id
 * JOIN article_stats s ON a.id = s.id
 * WHERE (first_published_at, a.id) < ((SELECT first_published_at FROM last_editions WHERE article_id = :id!), :id!)
 * ORDER BY (first_published_at, a.id) DESC LIMIT 1
 * ```
 */
export const getPrevArticle = new PreparedQuery<
  IGetPrevArticleParams,
  IGetPrevArticleResult
>(getPrevArticleIR);

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

const getArticleFilesIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 99, b: 102 }],
    },
  ],
  statement:
    "SELECT id, name\n  FROM files\n  WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = :id!)",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, name
 *   FROM files
 *   WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = :id!)
 * ```
 */
export const getArticleFiles = new PreparedQuery<
  IGetArticleFilesParams,
  IGetArticleFilesResult
>(getArticleFilesIR);

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

const getArticleCommentsIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 193, b: 196 }],
    },
  ],
  statement:
    'SELECT\n  comments.id,\n  content,\n  created_at AS "createdAt",\n  author_id AS "authorId",\n  name AS "authorName"\n  FROM comments JOIN users ON comments.author_id = users.id\n  WHERE article_id = :id!\n  ORDER BY (created_at, comments.id) ASC',
};

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
 *   ORDER BY (created_at, comments.id) ASC
 * ```
 */
export const getArticleComments = new PreparedQuery<
  IGetArticleCommentsParams,
  IGetArticleCommentsResult
>(getArticleCommentsIR);

/** 'ListUserComments' parameters type */
export interface IListUserCommentsParams {
  authorId: string;
  before: string;
  limit: number;
  prevId?: number | null | void;
}

/** 'ListUserComments' return type */
export interface IListUserCommentsResult {
  articleAuthorId: string;
  articleAuthorName: string;
  articleId: number;
  articleTitle: string | null;
  content: string;
  createdAt: string;
  id: number;
}

/** 'ListUserComments' query type */
export interface IListUserCommentsQuery {
  params: IListUserCommentsParams;
  result: IListUserCommentsResult;
}

const listUserCommentsIR: any = {
  usedParamSet: { authorId: true, before: true, prevId: true, limit: true },
  params: [
    {
      name: "authorId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 435, b: 444 }],
    },
    {
      name: "before",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 483, b: 490 }],
    },
    {
      name: "prevId",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 502, b: 508 }],
    },
    {
      name: "limit",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 565, b: 571 }],
    },
  ],
  statement:
    'SELECT\n  comments.id,\n  comments.content,\n  created_at AS "createdAt",\n  articles.id AS "articleId",\n  title AS "articleTitle",\n  articles.author_id AS "articleAuthorId",\n  art_author.name AS "articleAuthorName"\n  FROM comments\n  JOIN articles ON comments.article_id = articles.id\n  JOIN last_editions ON articles.id = last_editions.article_id\n  JOIN users art_author ON articles.author_id = art_author.id\n  WHERE comments.author_id = :authorId!\n    AND (created_at, comments.id) < (:before!, COALESCE(:prevId, 0))\n  ORDER BY (created_at, comments.id) DESC\n  LIMIT :limit!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   comments.id,
 *   comments.content,
 *   created_at AS "createdAt",
 *   articles.id AS "articleId",
 *   title AS "articleTitle",
 *   articles.author_id AS "articleAuthorId",
 *   art_author.name AS "articleAuthorName"
 *   FROM comments
 *   JOIN articles ON comments.article_id = articles.id
 *   JOIN last_editions ON articles.id = last_editions.article_id
 *   JOIN users art_author ON articles.author_id = art_author.id
 *   WHERE comments.author_id = :authorId!
 *     AND (created_at, comments.id) < (:before!, COALESCE(:prevId, 0))
 *   ORDER BY (created_at, comments.id) DESC
 *   LIMIT :limit!
 * ```
 */
export const listUserComments = new PreparedQuery<
  IListUserCommentsParams,
  IListUserCommentsResult
>(listUserCommentsIR);

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

const getUserByNaverIdIR: any = {
  usedParamSet: { naverId: true },
  params: [
    {
      name: "naverId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 50, b: 58 }],
    },
  ],
  statement: "SELECT id, role, name FROM users WHERE naver_id = :naverId!",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, role, name FROM users WHERE naver_id = :naverId!
 * ```
 */
export const getUserByNaverId = new PreparedQuery<
  IGetUserByNaverIdParams,
  IGetUserByNaverIdResult
>(getUserByNaverIdIR);

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

const createUserIR: any = {
  usedParamSet: { naverId: true, id: true, name: true },
  params: [
    {
      name: "naverId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 47, b: 55 }],
    },
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 58, b: 61 }],
    },
    {
      name: "name",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 64, b: 69 }],
    },
  ],
  statement:
    "INSERT INTO users (naver_id, id, name) VALUES (:naverId!, :id!, :name!)",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users (naver_id, id, name) VALUES (:naverId!, :id!, :name!)
 * ```
 */
export const createUser = new PreparedQuery<
  ICreateUserParams,
  ICreateUserResult
>(createUserIR);

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

const getUserByIdIR: any = {
  usedParamSet: { userId: true },
  params: [
    {
      name: "userId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 44, b: 51 }],
    },
  ],
  statement: "SELECT id, role, name FROM users WHERE id = :userId!",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, role, name FROM users WHERE id = :userId!
 * ```
 */
export const getUserById = new PreparedQuery<
  IGetUserByIdParams,
  IGetUserByIdResult
>(getUserByIdIR);

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

const deleteDraftIR: any = {
  usedParamSet: { id: true, userId: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 30, b: 33 }],
    },
    {
      name: "userId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 108, b: 115 }],
    },
  ],
  statement:
    'DELETE FROM drafts\nWHERE id = :id! \n  AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!\nRETURNING article_id AS "articleId"',
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM drafts
 * WHERE id = :id!
 *   AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!
 * RETURNING article_id AS "articleId"
 * ```
 */
export const deleteDraft = new PreparedQuery<
  IDeleteDraftParams,
  IDeleteDraftResult
>(deleteDraftIR);

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

const deleteArticleIfNoEditionsIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 32, b: 35 }],
    },
  ],
  statement:
    "DELETE FROM articles WHERE id = :id! AND id NOT IN (SELECT article_id FROM editions)",
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM articles WHERE id = :id! AND id NOT IN (SELECT article_id FROM editions)
 * ```
 */
export const deleteArticleIfNoEditions = new PreparedQuery<
  IDeleteArticleIfNoEditionsParams,
  IDeleteArticleIfNoEditionsResult
>(deleteArticleIfNoEditionsIR);

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

const createDraftIR: any = {
  usedParamSet: { authorId: true },
  params: [
    {
      name: "authorId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 65, b: 74 }],
    },
  ],
  statement:
    "WITH new_article AS (\n  INSERT INTO articles (author_id) VALUES (:authorId!) RETURNING id\n)\nINSERT INTO drafts (article_id) SELECT id FROM new_article\nRETURNING id, title, created_at, updated_at",
};

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
export const createDraft = new PreparedQuery<
  ICreateDraftParams,
  ICreateDraftResult
>(createDraftIR);

/** 'GetArticleAuthorId' parameters type */
export interface IGetArticleAuthorIdParams {
  id: number;
}

/** 'GetArticleAuthorId' return type */
export interface IGetArticleAuthorIdResult {
  authorId: string;
}

/** 'GetArticleAuthorId' query type */
export interface IGetArticleAuthorIdQuery {
  params: IGetArticleAuthorIdParams;
  result: IGetArticleAuthorIdResult;
}

const getArticleAuthorIdIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 56, b: 59 }],
    },
  ],
  statement: 'SELECT author_id AS "authorId" FROM articles WHERE id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT author_id AS "authorId" FROM articles WHERE id = :id!
 * ```
 */
export const getArticleAuthorId = new PreparedQuery<
  IGetArticleAuthorIdParams,
  IGetArticleAuthorIdResult
>(getArticleAuthorIdIR);

/** 'ListEditionIds' parameters type */
export interface IListEditionIdsParams {
  id: number;
}

/** 'ListEditionIds' return type */
export interface IListEditionIdsResult {
  id: number;
}

/** 'ListEditionIds' query type */
export interface IListEditionIdsQuery {
  params: IListEditionIdsParams;
  result: IListEditionIdsResult;
}

const listEditionIdsIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 43, b: 46 }],
    },
  ],
  statement: "SELECT id FROM editions WHERE article_id = :id!",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id FROM editions WHERE article_id = :id!
 * ```
 */
export const listEditionIds = new PreparedQuery<
  IListEditionIdsParams,
  IListEditionIdsResult
>(listEditionIdsIR);

/** 'GetDraftIdOfArticle' parameters type */
export interface IGetDraftIdOfArticleParams {
  id: number;
  userId: string;
}

/** 'GetDraftIdOfArticle' return type */
export interface IGetDraftIdOfArticleResult {
  id: number;
}

/** 'GetDraftIdOfArticle' query type */
export interface IGetDraftIdOfArticleQuery {
  params: IGetDraftIdOfArticleParams;
  result: IGetDraftIdOfArticleResult;
}

const getDraftIdOfArticleIR: any = {
  usedParamSet: { id: true, userId: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 41, b: 44 }],
    },
    {
      name: "userId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 119, b: 126 }],
    },
  ],
  statement:
    "SELECT id FROM drafts\nWHERE article_id = :id! \n  AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id FROM drafts
 * WHERE article_id = :id!
 *   AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!
 * ```
 */
export const getDraftIdOfArticle = new PreparedQuery<
  IGetDraftIdOfArticleParams,
  IGetDraftIdOfArticleResult
>(getDraftIdOfArticleIR);

/** 'DeleteArticle' parameters type */
export interface IDeleteArticleParams {
  id: number;
}

/** 'DeleteArticle' return type */
export type IDeleteArticleResult = void;

/** 'DeleteArticle' query type */
export interface IDeleteArticleQuery {
  params: IDeleteArticleParams;
  result: IDeleteArticleResult;
}

const deleteArticleIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 32, b: 35 }],
    },
  ],
  statement: "DELETE FROM articles WHERE id = :id!",
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM articles WHERE id = :id!
 * ```
 */
export const deleteArticle = new PreparedQuery<
  IDeleteArticleParams,
  IDeleteArticleResult
>(deleteArticleIR);

/** 'CreateComment' parameters type */
export interface ICreateCommentParams {
  articleId: number;
  authorId: string;
  content: string;
}

/** 'CreateComment' return type */
export interface ICreateCommentResult {
  id: number;
}

/** 'CreateComment' query type */
export interface ICreateCommentQuery {
  params: ICreateCommentParams;
  result: ICreateCommentResult;
}

const createCommentIR: any = {
  usedParamSet: { articleId: true, authorId: true, content: true },
  params: [
    {
      name: "articleId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 64, b: 74 }],
    },
    {
      name: "authorId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 77, b: 86 }],
    },
    {
      name: "content",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 89, b: 97 }],
    },
  ],
  statement:
    "INSERT INTO comments (article_id, author_id, content)\n  VALUES (:articleId!, :authorId!, :content!)\n  RETURNING id",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO comments (article_id, author_id, content)
 *   VALUES (:articleId!, :authorId!, :content!)
 *   RETURNING id
 * ```
 */
export const createComment = new PreparedQuery<
  ICreateCommentParams,
  ICreateCommentResult
>(createCommentIR);

/** 'DraftHasTitle' parameters type */
export interface IDraftHasTitleParams {
  id: number;
  userId: string;
}

/** 'DraftHasTitle' return type */
export interface IDraftHasTitleResult {
  hasTitle: boolean;
}

/** 'DraftHasTitle' query type */
export interface IDraftHasTitleQuery {
  params: IDraftHasTitleParams;
  result: IDraftHasTitleResult;
}

const draftHasTitleIR: any = {
  usedParamSet: { id: true, userId: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 57, b: 60 }],
    },
    {
      name: "userId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 132, b: 139 }],
    },
  ],
  statement:
    "SELECT title <> '' AS \"hasTitle!\" FROM drafts\nWHERE id = :id! AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT title <> '' AS "hasTitle!" FROM drafts
 * WHERE id = :id! AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!
 * ```
 */
export const draftHasTitle = new PreparedQuery<
  IDraftHasTitleParams,
  IDraftHasTitleResult
>(draftHasTitleIR);

/** 'CreateEditionFromDraft' parameters type */
export interface ICreateEditionFromDraftParams {
  draftId: number;
  notes: string;
  thumbnail?: number | null | void;
}

/** 'CreateEditionFromDraft' return type */
export interface ICreateEditionFromDraftResult {
  articleId: number;
  editionId: number;
}

/** 'CreateEditionFromDraft' query type */
export interface ICreateEditionFromDraftQuery {
  params: ICreateEditionFromDraftParams;
  result: ICreateEditionFromDraftResult;
}

const createEditionFromDraftIR: any = {
  usedParamSet: { notes: true, thumbnail: true, draftId: true },
  params: [
    {
      name: "notes",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 103, b: 109 }],
    },
    {
      name: "thumbnail",
      required: false,
      transform: { type: "scalar" },
      locs: [{ a: 112, b: 121 }],
    },
    {
      name: "draftId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 150, b: 158 }],
    },
  ],
  statement:
    'INSERT INTO editions (article_id, title, content, notes, thumbnail)\nSELECT article_id, title, content, :notes!, :thumbnail\n  FROM drafts\n  WHERE id = :draftId!\nRETURNING article_id AS "articleId", id AS "editionId"',
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO editions (article_id, title, content, notes, thumbnail)
 * SELECT article_id, title, content, :notes!, :thumbnail
 *   FROM drafts
 *   WHERE id = :draftId!
 * RETURNING article_id AS "articleId", id AS "editionId"
 * ```
 */
export const createEditionFromDraft = new PreparedQuery<
  ICreateEditionFromDraftParams,
  ICreateEditionFromDraftResult
>(createEditionFromDraftIR);

/** 'MoveDraftFilesToEdition' parameters type */
export interface IMoveDraftFilesToEditionParams {
  draftId: number;
  editionId: number;
}

/** 'MoveDraftFilesToEdition' return type */
export type IMoveDraftFilesToEditionResult = void;

/** 'MoveDraftFilesToEdition' query type */
export interface IMoveDraftFilesToEditionQuery {
  params: IMoveDraftFilesToEditionParams;
  result: IMoveDraftFilesToEditionResult;
}

const moveDraftFilesToEditionIR: any = {
  usedParamSet: { editionId: true, draftId: true },
  params: [
    {
      name: "editionId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 32, b: 42 }],
    },
    {
      name: "draftId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 80, b: 88 }],
    },
  ],
  statement:
    "UPDATE files\n  SET edition_id = :editionId!, draft_id = NULL\n  WHERE draft_id = :draftId!",
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE files
 *   SET edition_id = :editionId!, draft_id = NULL
 *   WHERE draft_id = :draftId!
 * ```
 */
export const moveDraftFilesToEdition = new PreparedQuery<
  IMoveDraftFilesToEditionParams,
  IMoveDraftFilesToEditionResult
>(moveDraftFilesToEditionIR);

/** 'GetCommentAuthorId' parameters type */
export interface IGetCommentAuthorIdParams {
  id: number;
}

/** 'GetCommentAuthorId' return type */
export interface IGetCommentAuthorIdResult {
  authorId: string;
}

/** 'GetCommentAuthorId' query type */
export interface IGetCommentAuthorIdQuery {
  params: IGetCommentAuthorIdParams;
  result: IGetCommentAuthorIdResult;
}

const getCommentAuthorIdIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 56, b: 59 }],
    },
  ],
  statement: 'SELECT author_id AS "authorId" FROM comments WHERE id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT author_id AS "authorId" FROM comments WHERE id = :id!
 * ```
 */
export const getCommentAuthorId = new PreparedQuery<
  IGetCommentAuthorIdParams,
  IGetCommentAuthorIdResult
>(getCommentAuthorIdIR);

/** 'DeleteComment' parameters type */
export interface IDeleteCommentParams {
  id: number;
}

/** 'DeleteComment' return type */
export type IDeleteCommentResult = void;

/** 'DeleteComment' query type */
export interface IDeleteCommentQuery {
  params: IDeleteCommentParams;
  result: IDeleteCommentResult;
}

const deleteCommentIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 32, b: 35 }],
    },
  ],
  statement: "DELETE FROM comments WHERE id = :id!",
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM comments WHERE id = :id!
 * ```
 */
export const deleteComment = new PreparedQuery<
  IDeleteCommentParams,
  IDeleteCommentResult
>(deleteCommentIR);

/** 'CreateViewLog' parameters type */
export interface ICreateViewLogParams {
  articleId: number;
}

/** 'CreateViewLog' return type */
export type ICreateViewLogResult = void;

/** 'CreateViewLog' query type */
export interface ICreateViewLogQuery {
  params: ICreateViewLogParams;
  result: ICreateViewLogResult;
}

const createViewLogIR: any = {
  usedParamSet: { articleId: true },
  params: [
    {
      name: "articleId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 39, b: 49 }],
    },
  ],
  statement: "INSERT INTO views (article_id) VALUES (:articleId!)",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO views (article_id) VALUES (:articleId!)
 * ```
 */
export const createViewLog = new PreparedQuery<
  ICreateViewLogParams,
  ICreateViewLogResult
>(createViewLogIR);

/** 'CreateLike' parameters type */
export interface ICreateLikeParams {
  articleId: number;
  userId: string;
}

/** 'CreateLike' return type */
export type ICreateLikeResult = void;

/** 'CreateLike' query type */
export interface ICreateLikeQuery {
  params: ICreateLikeParams;
  result: ICreateLikeResult;
}

const createLikeIR: any = {
  usedParamSet: { articleId: true, userId: true },
  params: [
    {
      name: "articleId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 48, b: 58 }],
    },
    {
      name: "userId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 61, b: 68 }],
    },
  ],
  statement:
    "INSERT INTO likes (article_id, user_id) VALUES (:articleId!, :userId!)",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO likes (article_id, user_id) VALUES (:articleId!, :userId!)
 * ```
 */
export const createLike = new PreparedQuery<
  ICreateLikeParams,
  ICreateLikeResult
>(createLikeIR);

/** 'DeleteLike' parameters type */
export interface IDeleteLikeParams {
  articleId: number;
  userId: string;
}

/** 'DeleteLike' return type */
export interface IDeleteLikeResult {
  deleted: boolean;
}

/** 'DeleteLike' query type */
export interface IDeleteLikeQuery {
  params: IDeleteLikeParams;
  result: IDeleteLikeResult;
}

const deleteLikeIR: any = {
  usedParamSet: { articleId: true, userId: true },
  params: [
    {
      name: "articleId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 37, b: 47 }],
    },
    {
      name: "userId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 63, b: 70 }],
    },
  ],
  statement:
    'DELETE FROM likes WHERE article_id = :articleId! AND user_id = :userId!\nRETURNING TRUE AS "deleted!"',
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM likes WHERE article_id = :articleId! AND user_id = :userId!
 * RETURNING TRUE AS "deleted!"
 * ```
 */
export const deleteLike = new PreparedQuery<
  IDeleteLikeParams,
  IDeleteLikeResult
>(deleteLikeIR);

/** 'ListLikes' parameters type */
export interface IListLikesParams {
  articleId: number;
}

/** 'ListLikes' return type */
export interface IListLikesResult {
  createdAt: string;
  userId: string;
  userName: string;
}

/** 'ListLikes' query type */
export interface IListLikesQuery {
  params: IListLikesParams;
  result: IListLikesResult;
}

const listLikesIR: any = {
  usedParamSet: { articleId: true },
  params: [
    {
      name: "articleId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 149, b: 159 }],
    },
  ],
  statement:
    'SELECT user_id AS "userId", name AS "userName", created_at AS "createdAt"\n  FROM likes\n  JOIN users ON likes.user_id = users.id\n  WHERE article_id = :articleId!\n  ORDER BY (created_at, user_id) ASC',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT user_id AS "userId", name AS "userName", created_at AS "createdAt"
 *   FROM likes
 *   JOIN users ON likes.user_id = users.id
 *   WHERE article_id = :articleId!
 *   ORDER BY (created_at, user_id) ASC
 * ```
 */
export const listLikes = new PreparedQuery<IListLikesParams, IListLikesResult>(
  listLikesIR,
);

/** 'CreateDraftFromArticle' parameters type */
export interface ICreateDraftFromArticleParams {
  articleId: number;
}

/** 'CreateDraftFromArticle' return type */
export interface ICreateDraftFromArticleResult {
  id: number;
}

/** 'CreateDraftFromArticle' query type */
export interface ICreateDraftFromArticleQuery {
  params: ICreateDraftFromArticleParams;
  result: ICreateDraftFromArticleResult;
}

const createDraftFromArticleIR: any = {
  usedParamSet: { articleId: true },
  params: [
    {
      name: "articleId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 120, b: 130 }],
    },
  ],
  statement:
    "INSERT INTO drafts (article_id, title, content)\nSELECT article_id, title, content FROM last_editions WHERE article_id = :articleId!\nRETURNING drafts.id",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO drafts (article_id, title, content)
 * SELECT article_id, title, content FROM last_editions WHERE article_id = :articleId!
 * RETURNING drafts.id
 * ```
 */
export const createDraftFromArticle = new PreparedQuery<
  ICreateDraftFromArticleParams,
  ICreateDraftFromArticleResult
>(createDraftFromArticleIR);

/** 'GetLastEditionId' parameters type */
export interface IGetLastEditionIdParams {
  id: number;
}

/** 'GetLastEditionId' return type */
export interface IGetLastEditionIdResult {
  id: number;
}

/** 'GetLastEditionId' query type */
export interface IGetLastEditionIdQuery {
  params: IGetLastEditionIdParams;
  result: IGetLastEditionIdResult;
}

const getLastEditionIdIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 57, b: 60 }],
    },
  ],
  statement: 'SELECT id AS "id!" FROM last_editions WHERE article_id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id AS "id!" FROM last_editions WHERE article_id = :id!
 * ```
 */
export const getLastEditionId = new PreparedQuery<
  IGetLastEditionIdParams,
  IGetLastEditionIdResult
>(getLastEditionIdIR);

/** 'CopyEditionFilesToDraft' parameters type */
export interface ICopyEditionFilesToDraftParams {
  draftId: number;
  editionId: number;
}

/** 'CopyEditionFilesToDraft' return type */
export interface ICopyEditionFilesToDraftResult {
  name: string;
  newId: number;
  oldId: number;
}

/** 'CopyEditionFilesToDraft' query type */
export interface ICopyEditionFilesToDraftQuery {
  params: ICopyEditionFilesToDraftParams;
  result: ICopyEditionFilesToDraftResult;
}

const copyEditionFilesToDraftIR: any = {
  usedParamSet: { draftId: true, editionId: true },
  params: [
    {
      name: "draftId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 79, b: 87 }],
    },
    {
      name: "editionId",
      required: true,
      transform: { type: "scalar" },
      locs: [
        { a: 144, b: 154 },
        { a: 318, b: 328 },
      ],
    },
  ],
  statement:
    'WITH new_files as (\n  INSERT INTO files (draft_id, name, mime_type)\n    SELECT :draftId!, name, mime_type\n    FROM files\n    WHERE edition_id = :editionId!\n  RETURNING id, name)\nSELECT files.id as "oldId", new_files.id as "newId", files.name\nFROM files JOIN new_files ON files.name = new_files.name\nWHERE edition_id = :editionId!',
};

/**
 * Query generated from SQL:
 * ```
 * WITH new_files as (
 *   INSERT INTO files (draft_id, name, mime_type)
 *     SELECT :draftId!, name, mime_type
 *     FROM files
 *     WHERE edition_id = :editionId!
 *   RETURNING id, name)
 * SELECT files.id as "oldId", new_files.id as "newId", files.name
 * FROM files JOIN new_files ON files.name = new_files.name
 * WHERE edition_id = :editionId!
 * ```
 */
export const copyEditionFilesToDraft = new PreparedQuery<
  ICopyEditionFilesToDraftParams,
  ICopyEditionFilesToDraftResult
>(copyEditionFilesToDraftIR);

/** 'GetDraftAuthorId' parameters type */
export interface IGetDraftAuthorIdParams {
  id: number;
}

/** 'GetDraftAuthorId' return type */
export interface IGetDraftAuthorIdResult {
  authorId: string;
}

/** 'GetDraftAuthorId' query type */
export interface IGetDraftAuthorIdQuery {
  params: IGetDraftAuthorIdParams;
  result: IGetDraftAuthorIdResult;
}

const getDraftAuthorIdIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 110, b: 113 }],
    },
  ],
  statement:
    'SELECT author_id AS "authorId"\nFROM drafts\nJOIN articles ON drafts.article_id = articles.id\nWHERE drafts.id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT author_id AS "authorId"
 * FROM drafts
 * JOIN articles ON drafts.article_id = articles.id
 * WHERE drafts.id = :id!
 * ```
 */
export const getDraftAuthorId = new PreparedQuery<
  IGetDraftAuthorIdParams,
  IGetDraftAuthorIdResult
>(getDraftAuthorIdIR);

/** 'CreateFile' parameters type */
export interface ICreateFileParams {
  draftId: number;
  mimeType: string;
  name: string;
}

/** 'CreateFile' return type */
export interface ICreateFileResult {
  id: number;
}

/** 'CreateFile' query type */
export interface ICreateFileQuery {
  params: ICreateFileParams;
  result: ICreateFileResult;
}

const createFileIR: any = {
  usedParamSet: { draftId: true, name: true, mimeType: true },
  params: [
    {
      name: "draftId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 56, b: 64 }],
    },
    {
      name: "name",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 67, b: 72 }],
    },
    {
      name: "mimeType",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 75, b: 84 }],
    },
  ],
  statement:
    "INSERT INTO files (draft_id, name, mime_type)\n  VALUES (:draftId!, :name!, :mimeType!)\n  RETURNING id",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO files (draft_id, name, mime_type)
 *   VALUES (:draftId!, :name!, :mimeType!)
 *   RETURNING id
 * ```
 */
export const createFile = new PreparedQuery<
  ICreateFileParams,
  ICreateFileResult
>(createFileIR);

/** 'GetFileInfo' parameters type */
export interface IGetFileInfoParams {
  id: number;
}

/** 'GetFileInfo' return type */
export interface IGetFileInfoResult {
  authorId: string;
  draftId: number;
  mimeType: string;
  name: string;
}

/** 'GetFileInfo' query type */
export interface IGetFileInfoQuery {
  params: IGetFileInfoParams;
  result: IGetFileInfoResult;
}

const getFileInfoIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 213, b: 216 }],
    },
  ],
  statement:
    'SELECT\n  author_id AS "authorId",\n  name,\n  draft_id AS "draftId!",\n  mime_type AS "mimeType"\nFROM files\nJOIN drafts ON files.draft_id = drafts.id\nJOIN articles ON drafts.article_id = articles.id\nWHERE files.id = :id! AND draft_id IS NOT NULL',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   author_id AS "authorId",
 *   name,
 *   draft_id AS "draftId!",
 *   mime_type AS "mimeType"
 * FROM files
 * JOIN drafts ON files.draft_id = drafts.id
 * JOIN articles ON drafts.article_id = articles.id
 * WHERE files.id = :id! AND draft_id IS NOT NULL
 * ```
 */
export const getFileInfo = new PreparedQuery<
  IGetFileInfoParams,
  IGetFileInfoResult
>(getFileInfoIR);

/** 'DeleteFile' parameters type */
export interface IDeleteFileParams {
  id: number;
}

/** 'DeleteFile' return type */
export type IDeleteFileResult = void;

/** 'DeleteFile' query type */
export interface IDeleteFileQuery {
  params: IDeleteFileParams;
  result: IDeleteFileResult;
}

const deleteFileIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 29, b: 32 }],
    },
  ],
  statement: "DELETE FROM files WHERE id = :id!",
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM files WHERE id = :id!
 * ```
 */
export const deleteFile = new PreparedQuery<
  IDeleteFileParams,
  IDeleteFileResult
>(deleteFileIR);

/** 'UpdateDraft' parameters type */
export interface IUpdateDraftParams {
  content: string;
  id: number;
  title: string;
  userId: string;
}

/** 'UpdateDraft' return type */
export interface IUpdateDraftResult {
  ok: boolean;
}

/** 'UpdateDraft' query type */
export interface IUpdateDraftQuery {
  params: IUpdateDraftParams;
  result: IUpdateDraftResult;
}

const updateDraftIR: any = {
  usedParamSet: { title: true, content: true, id: true, userId: true },
  params: [
    {
      name: "title",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 26, b: 32 }],
    },
    {
      name: "content",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 45, b: 53 }],
    },
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 86, b: 89 }],
    },
    {
      name: "userId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 161, b: 168 }],
    },
  ],
  statement:
    'UPDATE drafts\nSET title = :title!, content = :content!, updated_at = now()\nWHERE id = :id! AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!\nRETURNING TRUE as "ok!"',
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE drafts
 * SET title = :title!, content = :content!, updated_at = now()
 * WHERE id = :id! AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!
 * RETURNING TRUE as "ok!"
 * ```
 */
export const updateDraft = new PreparedQuery<
  IUpdateDraftParams,
  IUpdateDraftResult
>(updateDraftIR);

/** 'ListDrafts' parameters type */
export interface IListDraftsParams {
  authorId: string;
}

/** 'ListDrafts' return type */
export interface IListDraftsResult {
  articleId: number;
  createdAt: string;
  id: number;
  published: boolean;
  title: string;
  updatedAt: string;
}

/** 'ListDrafts' query type */
export interface IListDraftsQuery {
  params: IListDraftsParams;
  result: IListDraftsResult;
}

const listDraftsIR: any = {
  usedParamSet: { authorId: true },
  params: [
    {
      name: "authorId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 274, b: 283 }],
    },
  ],
  statement:
    'SELECT drafts.id, title, created_at AS "createdAt", updated_at AS "updatedAt",\n  article_id AS "articleId",\n  EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS "published!"\nFROM drafts\nJOIN articles ON drafts.article_id = articles.id\nWHERE author_id = :authorId!\nORDER BY (updated_at, drafts.id) DESC',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT drafts.id, title, created_at AS "createdAt", updated_at AS "updatedAt",
 *   article_id AS "articleId",
 *   EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS "published!"
 * FROM drafts
 * JOIN articles ON drafts.article_id = articles.id
 * WHERE author_id = :authorId!
 * ORDER BY (updated_at, drafts.id) DESC
 * ```
 */
export const listDrafts = new PreparedQuery<
  IListDraftsParams,
  IListDraftsResult
>(listDraftsIR);

/** 'GetDraft' parameters type */
export interface IGetDraftParams {
  authorId: string;
  id: number;
}

/** 'GetDraft' return type */
export interface IGetDraftResult {
  articleId: number;
  content: string;
  createdAt: string;
  id: number;
  published: boolean | null;
  title: string;
  updatedAt: string;
}

/** 'GetDraft' query type */
export interface IGetDraftQuery {
  params: IGetDraftParams;
  result: IGetDraftResult;
}

const getDraftIR: any = {
  usedParamSet: { id: true, authorId: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 280, b: 283 }],
    },
    {
      name: "authorId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 301, b: 310 }],
    },
  ],
  statement:
    'SELECT drafts.id, title, content,\n  created_at AS "createdAt", updated_at AS "updatedAt", article_id AS "articleId",\n  EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS published\nFROM drafts\nJOIN articles ON drafts.article_id = articles.id\nWHERE drafts.id = :id! AND author_id = :authorId!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT drafts.id, title, content,
 *   created_at AS "createdAt", updated_at AS "updatedAt", article_id AS "articleId",
 *   EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS published
 * FROM drafts
 * JOIN articles ON drafts.article_id = articles.id
 * WHERE drafts.id = :id! AND author_id = :authorId!
 * ```
 */
export const getDraft = new PreparedQuery<IGetDraftParams, IGetDraftResult>(
  getDraftIR,
);

/** 'ListDraftFiles' parameters type */
export interface IListDraftFilesParams {
  id: number;
}

/** 'ListDraftFiles' return type */
export interface IListDraftFilesResult {
  id: number;
  mimeType: string;
  name: string;
}

/** 'ListDraftFiles' query type */
export interface IListDraftFilesQuery {
  params: IListDraftFilesParams;
  result: IListDraftFilesResult;
}

const listDraftFilesIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 69, b: 72 }],
    },
  ],
  statement:
    'SELECT id, name, mime_type AS "mimeType"\nFROM files\nWHERE draft_id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, name, mime_type AS "mimeType"
 * FROM files
 * WHERE draft_id = :id!
 * ```
 */
export const listDraftFiles = new PreparedQuery<
  IListDraftFilesParams,
  IListDraftFilesResult
>(listDraftFilesIR);

/** 'GetEdition' parameters type */
export interface IGetEditionParams {
  id: number;
}

/** 'GetEdition' return type */
export interface IGetEditionResult {
  articleId: number;
  content: string;
  id: number;
  notes: string;
  publishedAt: string;
  title: string;
}

/** 'GetEdition' query type */
export interface IGetEditionQuery {
  params: IGetEditionParams;
  result: IGetEditionResult;
}

const getEditionIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 116, b: 119 }],
    },
  ],
  statement:
    'SELECT id, article_id AS "articleId", title, content, notes, published_at AS "publishedAt"\nFROM editions\nWHERE id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, article_id AS "articleId", title, content, notes, published_at AS "publishedAt"
 * FROM editions
 * WHERE id = :id!
 * ```
 */
export const getEdition = new PreparedQuery<
  IGetEditionParams,
  IGetEditionResult
>(getEditionIR);

/** 'ListEditions' parameters type */
export interface IListEditionsParams {
  articleId: number;
}

/** 'ListEditions' return type */
export interface IListEditionsResult {
  id: number;
  notes: string;
  publishedAt: string;
  title: string;
}

/** 'ListEditions' query type */
export interface IListEditionsQuery {
  params: IListEditionsParams;
  result: IListEditionsResult;
}

const listEditionsIR: any = {
  usedParamSet: { articleId: true },
  params: [
    {
      name: "articleId",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 88, b: 98 }],
    },
  ],
  statement:
    'SELECT id, title, notes, published_at AS "publishedAt"\nFROM editions\nWHERE article_id = :articleId!\nORDER BY (published_at, id) DESC',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, title, notes, published_at AS "publishedAt"
 * FROM editions
 * WHERE article_id = :articleId!
 * ORDER BY (published_at, id) DESC
 * ```
 */
export const listEditions = new PreparedQuery<
  IListEditionsParams,
  IListEditionsResult
>(listEditionsIR);

/** 'ListEditionFiles' parameters type */
export interface IListEditionFilesParams {
  id: number;
}

/** 'ListEditionFiles' return type */
export interface IListEditionFilesResult {
  id: number;
  name: string;
}

/** 'ListEditionFiles' query type */
export interface IListEditionFilesQuery {
  params: IListEditionFilesParams;
  result: IListEditionFilesResult;
}

const listEditionFilesIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 46, b: 49 }],
    },
  ],
  statement: "SELECT id, name\nFROM files\nWHERE edition_id = :id!",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, name
 * FROM files
 * WHERE edition_id = :id!
 * ```
 */
export const listEditionFiles = new PreparedQuery<
  IListEditionFilesParams,
  IListEditionFilesResult
>(listEditionFilesIR);

/** 'UpdateUserName' parameters type */
export interface IUpdateUserNameParams {
  id: string;
  name: string;
}

/** 'UpdateUserName' return type */
export type IUpdateUserNameResult = void;

/** 'UpdateUserName' query type */
export interface IUpdateUserNameQuery {
  params: IUpdateUserNameParams;
  result: IUpdateUserNameResult;
}

const updateUserNameIR: any = {
  usedParamSet: { name: true, id: true },
  params: [
    {
      name: "name",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 24, b: 29 }],
    },
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 67, b: 70 }],
    },
  ],
  statement:
    "UPDATE users SET name = :name!, name_updated_at = NOW() WHERE id = :id!",
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE users SET name = :name!, name_updated_at = NOW() WHERE id = :id!
 * ```
 */
export const updateUserName = new PreparedQuery<
  IUpdateUserNameParams,
  IUpdateUserNameResult
>(updateUserNameIR);

/** 'GetUserNameUpdatedAt' parameters type */
export interface IGetUserNameUpdatedAtParams {
  id: string;
}

/** 'GetUserNameUpdatedAt' return type */
export interface IGetUserNameUpdatedAtResult {
  nameUpdatedAt: string;
}

/** 'GetUserNameUpdatedAt' query type */
export interface IGetUserNameUpdatedAtQuery {
  params: IGetUserNameUpdatedAtParams;
  result: IGetUserNameUpdatedAtResult;
}

const getUserNameUpdatedAtIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 64, b: 67 }],
    },
  ],
  statement:
    'SELECT name_updated_at AS "nameUpdatedAt" FROM users WHERE id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT name_updated_at AS "nameUpdatedAt" FROM users WHERE id = :id!
 * ```
 */
export const getUserNameUpdatedAt = new PreparedQuery<
  IGetUserNameUpdatedAtParams,
  IGetUserNameUpdatedAtResult
>(getUserNameUpdatedAtIR);

/** 'GetUserNewArticleNotifySetting' parameters type */
export interface IGetUserNewArticleNotifySettingParams {
  id: string;
}

/** 'GetUserNewArticleNotifySetting' return type */
export interface IGetUserNewArticleNotifySettingResult {
  newArticleNotify: boolean;
}

/** 'GetUserNewArticleNotifySetting' query type */
export interface IGetUserNewArticleNotifySettingQuery {
  params: IGetUserNewArticleNotifySettingParams;
  result: IGetUserNewArticleNotifySettingResult;
}

const getUserNewArticleNotifySettingIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 70, b: 73 }],
    },
  ],
  statement:
    'SELECT new_article_notify AS "newArticleNotify" FROM users WHERE id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT new_article_notify AS "newArticleNotify" FROM users WHERE id = :id!
 * ```
 */
export const getUserNewArticleNotifySetting = new PreparedQuery<
  IGetUserNewArticleNotifySettingParams,
  IGetUserNewArticleNotifySettingResult
>(getUserNewArticleNotifySettingIR);

/** 'SetUserNewArticleNotifySetting' parameters type */
export interface ISetUserNewArticleNotifySettingParams {
  id: string;
  newArticleNotify: boolean;
}

/** 'SetUserNewArticleNotifySetting' return type */
export type ISetUserNewArticleNotifySettingResult = void;

/** 'SetUserNewArticleNotifySetting' query type */
export interface ISetUserNewArticleNotifySettingQuery {
  params: ISetUserNewArticleNotifySettingParams;
  result: ISetUserNewArticleNotifySettingResult;
}

const setUserNewArticleNotifySettingIR: any = {
  usedParamSet: { newArticleNotify: true, id: true },
  params: [
    {
      name: "newArticleNotify",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 38, b: 55 }],
    },
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 68, b: 71 }],
    },
  ],
  statement:
    "UPDATE users SET new_article_notify = :newArticleNotify! WHERE id = :id!",
};

/**
 * Query generated from SQL:
 * ```
 * UPDATE users SET new_article_notify = :newArticleNotify! WHERE id = :id!
 * ```
 */
export const setUserNewArticleNotifySetting = new PreparedQuery<
  ISetUserNewArticleNotifySettingParams,
  ISetUserNewArticleNotifySettingResult
>(setUserNewArticleNotifySettingIR);

/** 'ListWebhooks' parameters type */
export type IListWebhooksParams = void;

/** 'ListWebhooks' return type */
export interface IListWebhooksResult {
  id: number;
  name: string;
  url: string;
}

/** 'ListWebhooks' query type */
export interface IListWebhooksQuery {
  params: IListWebhooksParams;
  result: IListWebhooksResult;
}

const listWebhooksIR: any = {
  usedParamSet: {},
  params: [],
  statement: "SELECT id, name, url FROM webhooks",
};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, name, url FROM webhooks
 * ```
 */
export const listWebhooks = new PreparedQuery<
  IListWebhooksParams,
  IListWebhooksResult
>(listWebhooksIR);

/** 'CreateWebhook' parameters type */
export interface ICreateWebhookParams {
  name: string;
  url: string;
}

/** 'CreateWebhook' return type */
export type ICreateWebhookResult = void;

/** 'CreateWebhook' query type */
export interface ICreateWebhookQuery {
  params: ICreateWebhookParams;
  result: ICreateWebhookResult;
}

const createWebhookIR: any = {
  usedParamSet: { name: true, url: true },
  params: [
    {
      name: "name",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 41, b: 46 }],
    },
    {
      name: "url",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 49, b: 53 }],
    },
  ],
  statement: "INSERT INTO webhooks (name, url) VALUES (:name!, :url!)",
};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO webhooks (name, url) VALUES (:name!, :url!)
 * ```
 */
export const createWebhook = new PreparedQuery<
  ICreateWebhookParams,
  ICreateWebhookResult
>(createWebhookIR);

/** 'DeleteWebhook' parameters type */
export interface IDeleteWebhookParams {
  id: number;
}

/** 'DeleteWebhook' return type */
export interface IDeleteWebhookResult {
  url: string;
}

/** 'DeleteWebhook' query type */
export interface IDeleteWebhookQuery {
  params: IDeleteWebhookParams;
  result: IDeleteWebhookResult;
}

const deleteWebhookIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 32, b: 35 }],
    },
  ],
  statement: "DELETE FROM webhooks WHERE id = :id! RETURNING url",
};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM webhooks WHERE id = :id! RETURNING url
 * ```
 */
export const deleteWebhook = new PreparedQuery<
  IDeleteWebhookParams,
  IDeleteWebhookResult
>(deleteWebhookIR);

/** 'GetArticleForWebhook' parameters type */
export interface IGetArticleForWebhookParams {
  id: number;
}

/** 'GetArticleForWebhook' return type */
export interface IGetArticleForWebhookResult {
  authorId: string;
  authorName: string;
  title: string;
}

/** 'GetArticleForWebhook' query type */
export interface IGetArticleForWebhookQuery {
  params: IGetArticleForWebhookParams;
  result: IGetArticleForWebhookResult;
}

const getArticleForWebhookIR: any = {
  usedParamSet: { id: true },
  params: [
    {
      name: "id",
      required: true,
      transform: { type: "scalar" },
      locs: [{ a: 188, b: 191 }],
    },
  ],
  statement:
    'SELECT\n  title AS "title!",\n  author_id AS "authorId!",\n  name AS "authorName!"\nFROM last_editions e\nJOIN articles a ON e.article_id = a.id\nJOIN users u ON a.author_id = u.id\nWHERE a.id = :id!',
};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   title AS "title!",
 *   author_id AS "authorId!",
 *   name AS "authorName!"
 * FROM last_editions e
 * JOIN articles a ON e.article_id = a.id
 * JOIN users u ON a.author_id = u.id
 * WHERE a.id = :id!
 * ```
 */
export const getArticleForWebhook = new PreparedQuery<
  IGetArticleForWebhookParams,
  IGetArticleForWebhookResult
>(getArticleForWebhookIR);
