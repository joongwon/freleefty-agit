use crate::schema::{Article, ArticleSummary, Author};

/// List articles sorted by publication date
///
/// # Arguments
/// * `con` - The database connection
/// # Returns
/// A vector of `ArticleSummary` containing the most recent articles
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_articles<'e, E>(con: E) -> Result<Vec<ArticleSummary>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
        r#"SELECT articles.id, title, author_id, name, published_at, comments_count, views_count, likes_count
        FROM articles
        JOIN users ON articles.author_id = users.id
        JOIN article_stats ON articles.id = article_stats.id
        ORDER BY published_at DESC"#,
    )
    .fetch_all(con)
    .await
    .map(|rows| {
        rows.into_iter()
            .map(|r| ArticleSummary {
                id: r.id,
                title: r.title,
                published_at: r.published_at.to_string(),
                author: Author {
                    id: r.author_id,
                    name: r.name,
                },
                comments_count: r.comments_count.unwrap_or(0),
                views_count: r.views_count.unwrap_or(0),
                likes_count: r.likes_count.unwrap_or(0),
            })
            .collect()
    })
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
) -> Result<Vec<ArticleSummary>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT * FROM (
            SELECT articles.id, title, author_id, name, published_at, comments_count, likes_count,
            (SELECT COUNT(*) FROM views WHERE views.article_id = articles.id
                AND (now() - views.created_at < $2)) AS views_count
            FROM articles
            JOIN users ON articles.author_id = users.id
            JOIN article_stats ON articles.id = article_stats.id
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
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|r| ArticleSummary {
        id: r.id,
        title: r.title,
        published_at: r.published_at.to_string(),
        author: Author {
          id: r.author_id,
          name: r.name,
        },
        comments_count: r.comments_count.unwrap_or(0),
        views_count: r.views_count.unwrap_or(0),
        likes_count: r.likes_count.unwrap_or(0),
      })
      .collect()
  })
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
pub async fn get_article<'e, E>(con: E, id: i32) -> Result<Option<Article>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT articles.id, title, content, author_id, name, published_at, views_count, likes_count
        FROM articles
        JOIN users ON articles.author_id = users.id
        JOIN article_stats ON articles.id = article_stats.id
        WHERE articles.id = $1"#,
    id,
  )
  .fetch_optional(con)
  .await
  .map(|r| {
    r.map(|r| Article {
      id: r.id,
      title: r.title,
      content: r.content,
      published_at: r.published_at.to_string(),
      author: Author {
        id: r.author_id,
        name: r.name,
      },
      views_count: r.views_count.unwrap_or(0),
      likes_count: r.likes_count.unwrap_or(0),
      /* these fields will be filled by following queries */
      comments: vec![],
      next: None,
      prev: None,
    })
  })
}

/// Get next article ordered by publication date
/// # Arguments
/// * `con` - The database connection
/// * `id` - The article ID
/// # Returns
/// An `Option<ArticleSummary>` containing the next article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_next_article<'e, E>(con: E, id: i32) -> Result<Option<ArticleSummary>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
        r#"SELECT articles.id, title, author_id, name, published_at, comments_count, views_count, likes_count
        FROM articles
        JOIN users ON articles.author_id = users.id
        JOIN article_stats ON articles.id = article_stats.id
        WHERE published_at > (SELECT published_at FROM articles WHERE id = $1)
        ORDER BY published_at ASC LIMIT 1"#,
        id,
    )
    .fetch_optional(con)
    .await
    .map(|r| {
        r.map(|r| ArticleSummary {
            id: r.id,
            title: r.title,
            published_at: r.published_at.to_string(),
            author: Author {
                id: r.author_id,
                name: r.name,
            },
            comments_count: r.comments_count.unwrap_or(0),
            views_count: r.views_count.unwrap_or(0),
            likes_count: r.likes_count.unwrap_or(0),
        })
    })
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
) -> Result<Option<ArticleSummary>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
        r#"SELECT articles.id, title, author_id, name, published_at, comments_count, views_count, likes_count
        FROM articles
        JOIN users ON articles.author_id = users.id
        JOIN article_stats ON articles.id = article_stats.id
        WHERE published_at < (SELECT published_at FROM articles WHERE id = $1)
        ORDER BY published_at DESC LIMIT 1"#,
        id,
    )
    .fetch_optional(con)
    .await
    .map(|r| {
        r.map(|r| ArticleSummary {
            id: r.id,
            title: r.title,
            published_at: r.published_at.to_string(),
            author: Author {
                id: r.author_id,
                name: r.name,
            },
            comments_count: r.comments_count.unwrap_or(0),
            views_count: r.views_count.unwrap_or(0),
            likes_count: r.likes_count.unwrap_or(0),
        })
    })
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
