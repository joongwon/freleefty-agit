use crate::schema::{Article, ArticleSummary, Author};

/// List articles sorted by publication date
///
/// # Arguments
/// * `con` - The database connection
/// # Returns
/// A vector of `ArticleSummary` containing the most recent articles
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_articles<'e, E>(con: E) -> Result<Vec<ArticleSummary>, anyhow::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let rows = sqlx::query!(
    r#"SELECT a.id, title, author_id, name, first_published_at, comments_count, views_count, likes_count
        FROM last_editions e
        JOIN articles a ON e.article_id = a.id
        JOIN users u ON a.author_id = u.id
        JOIN article_stats s ON a.id = s.id
        ORDER BY first_published_at DESC"#,
  )
  .fetch_all(con)
  .await?;
  rows
    .into_iter()
    .map(|r| {
      Ok(ArticleSummary {
        id: r.id,
        title: r
          .title
          .ok_or(crate::Error::UnexpectedNone("ArticleSummary.title"))?,
        published_at: r
          .first_published_at
          .ok_or(crate::Error::UnexpectedNone("ArticleSummary.published_at"))?
          .to_string(),
        author: Author {
          id: r.author_id,
          name: r.name,
        },
        comments_count: r.comments_count.unwrap_or(0),
        views_count: r.views_count.unwrap_or(0),
        likes_count: r.likes_count.unwrap_or(0),
      })
    })
    .collect()
}

/// List articles sorted by views count
///
/// # Arguments
/// * `con` - The database connection
/// * `n` - The number of articles to return
/// * `days` - The number of days to consider for the views count
///           If `None`, all views are considered
///           If `Some(days)`, only views in the last `days` days are considered
/// # Returns
/// A vector of `ArticleSummary` containing the most popular articles
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_popular_articles<'e, E>(
  con: E,
  n: i64,
  days: i32,
) -> Result<Vec<ArticleSummary>, anyhow::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let rows = sqlx::query!(
    r#"SELECT * FROM (
            SELECT a.id, title, author_id, name, first_published_at, comments_count, likes_count,
            (SELECT COUNT(*) FROM views WHERE views.article_id = a.id
                AND (now() - views.created_at < $2)) AS views_count
            FROM last_editions e
            JOIN articles a ON e.article_id = a.id
            JOIN users u ON a.author_id = u.id
            JOIN article_stats s ON a.id = s.id
            ORDER BY views_count DESC LIMIT $1
        ) AS t WHERE views_count > 0"#,
    n,
    sqlx::postgres::types::PgInterval {
      days,
      months: 0,
      microseconds: 0
    },
  )
  .fetch_all(con)
  .await?;
  rows
    .into_iter()
    .map(|r| {
      Ok(ArticleSummary {
        id: r.id,
        title: r
          .title
          .ok_or(crate::Error::UnexpectedNone("ArticleSummary.title"))?,
        published_at: r
          .first_published_at
          .ok_or(crate::Error::UnexpectedNone("ArticleSummary.published_at"))?
          .to_string(),
        author: Author {
          id: r.author_id,
          name: r.name,
        },
        comments_count: r.comments_count.unwrap_or(0),
        views_count: r.views_count.unwrap_or(0),
        likes_count: r.likes_count.unwrap_or(0),
      })
    })
    .collect()
}

/// Get an article by its ID
///
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// An `Article` containing the article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_article<'e, E>(con: E, id: i32) -> Result<Option<Article>, anyhow::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let r = sqlx::query!(
    r#"SELECT a.id, title, content, author_id, name, views_count, likes_count, e.id AS edition_id,
        first_published_at, last_published_at,
        (SELECT COUNT(*) FROM editions WHERE article_id = a.id) AS editions_count
        FROM last_editions e
        JOIN articles a ON e.article_id = a.id
        JOIN users u ON a.author_id = u.id
        JOIN article_stats s ON a.id = s.id
        WHERE a.id = $1"#,
    id,
  )
  .fetch_optional(con)
  .await?;
  match r {
    None => Ok(None),
    Some(r) => Ok(Some(Article {
      id: r.id,
      last_published_at: r
        .last_published_at
        .ok_or(crate::Error::UnexpectedNone("Article.first_published_at"))?
        .to_string(),
      edition_id: r
        .edition_id
        .ok_or(crate::Error::UnexpectedNone("Article.edition_id"))?,
      title: r
        .title
        .ok_or(crate::Error::UnexpectedNone("Article.title"))?,
      content: r
        .content
        .ok_or(crate::Error::UnexpectedNone("Article.content"))?,
      published_at: r
        .first_published_at
        .ok_or(crate::Error::UnexpectedNone("Article.published_at"))?
        .to_string(),
      author: Author {
        id: r.author_id,
        name: r.name,
      },
      views_count: r
        .views_count
        .ok_or(crate::Error::UnexpectedNone("Article.views_count"))?,
      likes_count: r
        .likes_count
        .ok_or(crate::Error::UnexpectedNone("Article.likes_count"))?,
      editions_count: r
        .editions_count
        .ok_or(crate::Error::UnexpectedNone("Article.editions_count"))?,
      /* these fields will be filled by following queries */
      comments: vec![],
      next: None,
      prev: None,
    })),
  }
}

/// Get next article ordered by publication date
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// An `Option<ArticleSummary>` containing the next article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_next_article<'e, E>(
  con: E,
  id: i32,
) -> Result<Option<ArticleSummary>, anyhow::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let r = sqlx::query!(
    r#"SELECT a.id, title, author_id, name, first_published_at, comments_count, views_count, likes_count
        FROM last_editions e
        JOIN articles a ON e.article_id = a.id
        JOIN users u ON a.author_id = u.id
        JOIN article_stats s ON a.id = s.id
        WHERE first_published_at > (SELECT first_published_at FROM last_editions WHERE article_id = $1)
        ORDER BY first_published_at ASC LIMIT 1"#,
    id,
  )
  .fetch_optional(con)
  .await?;
  match r {
    None => Ok(None),
    Some(r) => Ok(Some(ArticleSummary {
      id: r.id,
      title: r
        .title
        .ok_or(crate::Error::UnexpectedNone("ArticleSummary.title"))?,
      published_at: r
        .first_published_at
        .ok_or(crate::Error::UnexpectedNone("ArticleSummary.published_at"))?
        .to_string(),
      author: Author {
        id: r.author_id,
        name: r.name,
      },
      comments_count: r.comments_count.unwrap_or(0),
      views_count: r.views_count.unwrap_or(0),
      likes_count: r.likes_count.unwrap_or(0),
    })),
  }
}

/// Get previous article ordered by publication date
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// An `Option<ArticleSummary>` containing the previous article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_previous_article<'e, E>(
  con: E,
  id: i32,
) -> Result<Option<ArticleSummary>, anyhow::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let r = sqlx::query!(
    r#"SELECT a.id, title, author_id, name, first_published_at, comments_count, views_count, likes_count
        FROM last_editions e
        JOIN articles a ON e.article_id = a.id
        JOIN users u ON a.author_id = u.id
        JOIN article_stats s ON a.id = s.id
        WHERE first_published_at < (SELECT first_published_at FROM last_editions WHERE article_id = $1)
        ORDER BY first_published_at DESC LIMIT 1"#,
    id,
  )
  .fetch_optional(con)
  .await?;
  match r {
    None => Ok(None),
    Some(r) => Ok(Some(ArticleSummary {
      id: r.id,
      title: r
        .title
        .ok_or(crate::Error::UnexpectedNone("ArticleSummary.title"))?,
      published_at: r
        .first_published_at
        .ok_or(crate::Error::UnexpectedNone("ArticleSummary.published_at"))?
        .to_string(),
      author: Author {
        id: r.author_id,
        name: r.name,
      },
      comments_count: r.comments_count.unwrap_or(0),
      views_count: r.views_count.unwrap_or(0),
      likes_count: r.likes_count.unwrap_or(0),
    })),
  }
}

/// Delete an article by its ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// None
/// # Errors
/// Returns a `sqlx::Error` if the query fails or if the article does not exist
pub async fn delete_article<'e, E>(con: E, id: i32) -> Result<(), sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let res = sqlx::query!(r#"DELETE FROM articles WHERE id = $1"#, id,)
    .execute(con)
    .await?;
  if res.rows_affected() == 0 {
    Err(sqlx::Error::RowNotFound)
  } else {
    Ok(())
  }
}

/// Delete an article if it has no editions
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// The number of rows affected
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn delete_article_if_no_editions<'e, E>(con: E, id: i32) -> Result<u64, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"DELETE FROM articles WHERE id = $1 AND id NOT IN (SELECT article_id FROM editions)"#,
    id,
  )
  .execute(con)
  .await
  .map(|r| r.rows_affected())
}

/// Get author of an article by its ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// Author's id
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_article_author_id<'e, E>(con: E, id: i32) -> Result<Option<String>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(r#"SELECT author_id FROM articles WHERE id = $1"#, id,)
    .fetch_optional(con)
    .await
    .map(|r| r.map(|r| r.author_id))
}

/// Get the draft for an article if it exists
/// # Arguments
/// * `con` - The database connection
/// * `author_id` - The author ID
/// * `id` - The article ID
/// # Returns
/// Draft's id
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_article_draft_id<'e, E>(
  con: E,
  author_id: &str,
  id: i32,
) -> Result<Option<i32>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(r#"SELECT id FROM drafts WHERE article_id = $1 AND (SELECT author_id FROM articles WHERE articles.id = article_id) = $2"#,
    id, author_id)
    .fetch_optional(con)
    .await
    .map(|r| r.map(|r| r.id))
}
