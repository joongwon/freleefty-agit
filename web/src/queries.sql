/* @name ListArticles */
SELECT
  a.id,
  title AS "title!",
  author_id AS "authorId!",
  name AS "authorName!",
  first_published_at AS "publishedAt!",
  comments_count AS "commentsCount!",
  views_count AS "viewsCount!",
  likes_count AS "likesCount!"
FROM last_editions e
  JOIN articles a ON e.article_id = a.id
  JOIN users u ON a.author_id = u.id
  JOIN article_stats s ON a.id = s.id
ORDER BY first_published_at DESC;

/* @name ListPopularArticles */
SELECT * FROM (
    SELECT 
      a.id,
      title AS "title!",
      author_id AS "authorId!",
      name AS "authorName!",
      first_published_at AS "publishedAt!",
      comments_count AS "commentsCount!",
      likes_count AS "likesCount!",
      (SELECT COUNT(*) FROM views WHERE views.article_id = a.id
        AND (now() - views.created_at < '14 days'::interval)) AS "viewsCount!"
    FROM last_editions e
    JOIN articles a ON e.article_id = a.id
    JOIN users u ON a.author_id = u.id
    JOIN article_stats s ON a.id = s.id
    ORDER BY "viewsCount!" DESC LIMIT 5
) AS t WHERE "viewsCount!" > 0;

/* @name GetArticle */
SELECT
    a.id,
    title AS "title!",
    content AS "content!",
    author_id AS "authorId!",
    name AS "authorName!",
    views_count AS "viewsCount!",
    likes_count AS "likesCount!",
    e.id AS "editionId!",
    first_published_at AS "firstPublishedAt!",
    last_published_at AS "lastPublishedAt!",
    (SELECT COUNT(*) FROM editions WHERE article_id = a.id) AS "editionsCount!"
  FROM last_editions e
  JOIN articles a ON e.article_id = a.id
  JOIN users u ON a.author_id = u.id
  JOIN article_stats s ON a.id = s.id
  WHERE a.id = :id!;

/* @name GetNextArticle */
SELECT
  a.id,
  title AS "title!",
  author_id AS "authorId!",
  name AS "authorName!",
  first_published_at AS "publishedAt!",
  comments_count AS "commentsCount!",
  views_count AS "viewsCount!",
  likes_count AS "likesCount!"
FROM last_editions e
JOIN articles a ON e.article_id = a.id
JOIN users u ON a.author_id = u.id
JOIN article_stats s ON a.id = s.id
WHERE first_published_at > (SELECT first_published_at FROM last_editions WHERE article_id = :id!)
ORDER BY first_published_at ASC LIMIT 1;

/* @name GetPrevArticle */
SELECT
  a.id,
  title AS "title!",
  author_id AS "authorId!",
  name AS "authorName!",
  first_published_at AS "publishedAt!",
  comments_count AS "commentsCount!",
  views_count AS "viewsCount!",
  likes_count AS "likesCount!"
FROM last_editions e
JOIN articles a ON e.article_id = a.id
JOIN users u ON a.author_id = u.id
JOIN article_stats s ON a.id = s.id
WHERE first_published_at < (SELECT first_published_at FROM last_editions WHERE article_id = :id!)
ORDER BY first_published_at DESC LIMIT 1;

/* @name GetArticleFiles */
SELECT id, name
  FROM files
  WHERE edition_id = (SELECT id FROM last_editions WHERE article_id = :id!);

/* @name GetArticleComments */
SELECT
  comments.id,
  content,
  created_at AS "createdAt",
  author_id AS "authorId",
  name AS "authorName"
  FROM comments JOIN users ON comments.author_id = users.id
  WHERE article_id = :id!
  ORDER BY created_at DESC;

/* @name GetUserByNaverId */
SELECT id, role, name FROM users WHERE naver_id = :naverId!;

/* @name CreateUser */
INSERT INTO users (naver_id, id, name) VALUES (:naverId!, :id!, :name!);

/* @name GetUserById */
SELECT id, role, name FROM users WHERE id = :userId!;

/* @name DeleteDraft */
DELETE FROM drafts
WHERE id = :id! 
  AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!
RETURNING article_id AS "articleId";

/* @name DeleteArticleIfNoEditions */
DELETE FROM articles WHERE id = :id! AND id NOT IN (SELECT article_id FROM editions);

/* @name CreateDraft */
WITH new_article AS (
  INSERT INTO articles (author_id) VALUES (:authorId!) RETURNING id
)
INSERT INTO drafts (article_id) SELECT id FROM new_article
RETURNING id, title, created_at, updated_at;

/* @name GetArticleAuthorId */
SELECT author_id AS "authorId" FROM articles WHERE id = :id!;

/* @name ListEditionIds */
SELECT id FROM editions WHERE article_id = :id!;

/* @name GetDraftIdOfArticle */
SELECT id FROM drafts
WHERE article_id = :id! 
  AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!;

/* @name DeleteArticle */
DELETE FROM articles WHERE id = :id!;

/* @name CreateComment */
INSERT INTO comments (article_id, author_id, content)
  VALUES (:articleId!, :authorId!, :content!)
  RETURNING id;

/* @name DraftHasTitle */
SELECT title <> '' AS "hasTitle!" FROM drafts
WHERE id = :id! AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!;

/* @name CreateEditionFromDraft */
INSERT INTO editions (article_id, title, content, notes)
  SELECT article_id, title, content, :notes!
  FROM drafts
  WHERE id = :draftId!
  RETURNING article_id AS "articleId", id AS "editionId";

/* @name MoveDraftFilesToEdition */
UPDATE files
  SET edition_id = :editionId!, draft_id = NULL
  WHERE draft_id = :draftId!;

/* @name GetCommentAuthorId */
SELECT author_id AS "authorId" FROM comments WHERE id = :id!;

/* @name DeleteComment */
DELETE FROM comments WHERE id = :id!;

/* @name CreateViewLog */
INSERT INTO views (article_id) VALUES (:articleId!);

/* @name CreateLike */
INSERT INTO likes (article_id, user_id) VALUES (:articleId!, :userId!);

/* @name DeleteLike */
DELETE FROM likes WHERE article_id = :articleId! AND user_id = :userId!
RETURNING TRUE AS "deleted!";

/* @name ListLikes */
SELECT user_id AS "userId", name AS "userName", created_at AS "createdAt"
  FROM likes
  JOIN users ON likes.user_id = users.id
  WHERE article_id = :articleId!
  ORDER BY created_at ASC;

/* @name CreateDraftFromArticle */
INSERT INTO drafts (article_id, title, content)
SELECT article_id, title, content FROM last_editions WHERE article_id = :articleId!
RETURNING drafts.id;

/* @name GetLastEditionId */
SELECT id AS "id!" FROM last_editions WHERE article_id = :id!;

/* @name CopyEditionFilesToDraft */
WITH new_files as (
  INSERT INTO files (draft_id, name, mime_type)
    SELECT :draftId!, name, mime_type
    FROM files
    WHERE edition_id = :editionId!
  RETURNING id, name)
SELECT files.id as "oldId", new_files.id as "newId", files.name
FROM files JOIN new_files ON files.name = new_files.name
WHERE edition_id = :editionId!;

/* @name GetDraftAuthorId */
SELECT author_id AS "authorId"
FROM drafts
JOIN articles ON drafts.article_id = articles.id
WHERE drafts.id = :id!;

/* @name CreateFile */
INSERT INTO files (draft_id, name, mime_type)
  VALUES (:draftId!, :name!, :mimeType!)
  RETURNING id;

/* @name GetFileInfo */
SELECT
  author_id AS "authorId",
  name,
  draft_id AS "draftId!",
  mime_type AS "mimeType"
FROM files
JOIN drafts ON files.draft_id = drafts.id
JOIN articles ON drafts.article_id = articles.id
WHERE files.id = :id! AND draft_id IS NOT NULL;

/* @name DeleteFile */
DELETE FROM files WHERE id = :id!;

/* @name UpdateDraft */
UPDATE drafts
SET title = :title!, content = :content!, updated_at = now()
WHERE id = :id! AND (SELECT author_id FROM articles WHERE articles.id = article_id) = :userId!
RETURNING TRUE as "ok!";

/* @name ListDrafts */
SELECT drafts.id, title, created_at AS "createdAt", updated_at AS "updatedAt",
  article_id AS "articleId",
  EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS "published!"
FROM drafts
JOIN articles ON drafts.article_id = articles.id
WHERE author_id = :authorId!
ORDER BY updated_at DESC;

/* @name GetDraft */
SELECT drafts.id, title, content,
  created_at AS "createdAt", updated_at AS "updatedAt", article_id AS "articleId",
  EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS published
FROM drafts
JOIN articles ON drafts.article_id = articles.id
WHERE drafts.id = :id! AND author_id = :authorId!;

/* @name ListDraftFiles */
SELECT id, name
FROM files
WHERE draft_id = :id!;

/* @name CountDraftFiles */
SELECT COUNT(*) AS "count!" FROM files WHERE draft_id = :id!;

/* @name GetEdition */
SELECT id, article_id AS "articleId", title, content, notes, published_at AS "publishedAt"
FROM editions
WHERE id = :id!;

/* @name ListEditions */
SELECT id, title, notes, published_at AS "publishedAt"
FROM editions
WHERE article_id = :articleId!
ORDER BY published_at DESC;

/* @name ListEditionFiles */
SELECT id, name
FROM files
WHERE edition_id = :id!;
