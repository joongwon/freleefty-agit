use crate::schema::{Draft, DraftSummary};

/// Create an empty draft with new article
/// # Arguments
/// * `con` - The database connection
/// * `author_id` - The author ID
/// # Returns
/// The created draft
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn create_draft<'e, E>(con: E, author_id: &str) -> Result<DraftSummary, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"WITH new_article AS (
      INSERT INTO articles (author_id) VALUES ($1) RETURNING id
    )
    INSERT INTO drafts (article_id) SELECT id FROM new_article
    RETURNING id, title, created_at, updated_at"#,
    author_id,
  )
  .fetch_one(con)
  .await
  .map(|r| DraftSummary {
    id: r.id,
    article_id: None, // filled in by the caller
    title: r.title,
    created_at: r.created_at.to_string(),
    updated_at: r.updated_at.to_string(),
  })
}

/// Create a draft with its title and content from an existing article
/// # Arguments
/// * `con` - The database connection
/// * `author_id` - The author ID
/// * `article_id` - The article ID
/// # Returns
/// The created draft's id
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn create_draft_from_article<'e, E>(con: E, article_id: i32) -> Result<i32, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"INSERT INTO drafts (article_id, title, content)
    SELECT article_id, title, content FROM last_editions WHERE article_id = $1
    RETURNING drafts.id"#,
    article_id,
  )
  .fetch_one(con)
  .await
  .map(|r| r.id)
}

/// List drafts sorted by last update date
/// # Arguments
/// * `con` - The database connection
/// * `author_id` - The author ID
/// # Returns
/// A vector of `DraftSummary` containing the most recent drafts
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn list_drafts<'e, E>(con: E, author_id: &str) -> Result<Vec<DraftSummary>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT drafts.id, title, created_at, updated_at, article_id, EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS published
    FROM drafts
    JOIN articles ON drafts.article_id = articles.id
    WHERE author_id = $1
    ORDER BY updated_at DESC"#,
    author_id,
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|r| DraftSummary {
        id: r.id,
        article_id: match r.published {
          Some(true) => Some(r.article_id),
          _ => None,
        },
        title: r.title,
        created_at: r.created_at.to_string(),
        updated_at: r.updated_at.to_string(),
      })
      .collect()
  })
}

/// Get draft by its ID and author ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// An `Option<Draft>` containing the draft
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_draft<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
) -> Result<Option<Draft>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT drafts.id, title, content, created_at, updated_at, article_id,
      EXISTS (SELECT 1 FROM editions WHERE article_id = drafts.article_id) AS published
    FROM drafts
    JOIN articles ON drafts.article_id = articles.id
    WHERE drafts.id = $1 AND author_id = $2"#,
    id,
    author_id,
  )
  .fetch_optional(con)
  .await
  .map(|r| {
    r.map(|r| Draft {
      id: r.id,
      article_id: match r.published {
        Some(true) => Some(r.article_id),
        _ => None,
      },
      title: r.title,
      content: r.content,
      created_at: r.created_at.to_string(),
      updated_at: r.updated_at.to_string(),
      files: vec![],
    })
  })
}

/// Update a draft by its ID and author ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// * `title` - The new title
/// * `content` - The new content
/// # Returns
/// The number of rows affected
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn update_draft<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
  title: &str,
  content: &str,
) -> Result<i64, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"UPDATE drafts SET title = $1, content = $2, updated_at = now()
    WHERE id = $3 AND (SELECT author_id FROM articles WHERE articles.id = article_id) = $4"#,
    title,
    content,
    id,
    author_id,
  )
  .execute(con)
  .await
  .map(|r| r.rows_affected() as i64)
}

/// Delete a draft by its ID and author ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// * Some: The id of the article the draft was for
/// * None: If the draft was not found
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn delete_draft<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
) -> Result<Option<i32>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"DELETE FROM drafts WHERE id = $1 AND (SELECT author_id FROM articles WHERE articles.id = article_id) = $2
    RETURNING article_id"#,
    id,
    author_id,
  )
  .fetch_optional(con)
  .await
  .map(|r| r.map(|r| r.article_id))
}

/// Get the length of a draft title by its ID and author ID (used for validation before publishing)
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// The length of the draft title
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_draft_title_length<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
) -> Result<i32, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT LENGTH(title) FROM drafts WHERE id = $1 AND (SELECT author_id FROM articles WHERE articles.id = article_id) = $2"#,
    id,
    author_id,
  )
  .fetch_one(con)
  .await
  .map(|r| r.length.unwrap_or(0))
}

/// Get the author of a draft by its ID
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// # Returns
/// The author ID
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn get_draft_author<'e, E>(con: E, id: i32) -> Result<Option<String>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT author_id
    FROM drafts
    JOIN articles ON drafts.article_id = articles.id
    WHERE drafts.id = $1"#,
    id,
  )
  .fetch_optional(con)
  .await
  .map(|r| r.map(|r| r.author_id))
}
