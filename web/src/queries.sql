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
