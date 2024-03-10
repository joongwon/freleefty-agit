use crate::schema::{Draft, DraftSummary};

/// Create an empty draft
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
    r#"INSERT INTO drafts (author_id) VALUES ($1) RETURNING id, title, created_at, updated_at"#,
    author_id,
  )
  .fetch_one(con)
  .await
  .map(|r| DraftSummary {
    id: r.id,
    title: r.title,
    created_at: r.created_at.to_string(),
    updated_at: r.updated_at.to_string(),
  })
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
    r#"SELECT id, title, created_at, updated_at FROM drafts WHERE author_id = $1 ORDER BY updated_at DESC"#,
    author_id,
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows.into_iter()
      .map(|r| DraftSummary {
        id: r.id,
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
    r#"SELECT id, title, content, created_at, updated_at FROM drafts WHERE id = $1 AND author_id = $2"#,
    id,
    author_id,
  )
  .fetch_optional(con)
  .await
  .map(|r| {
    r.map(|r| Draft {
      id: r.id,
      title: r.title,
      content: r.content,
      created_at: r.created_at.to_string(),
      updated_at: r.updated_at.to_string(),
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
    WHERE id = $3 AND author_id = $4"#,
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
/// The number of rows affected
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn delete_draft<'e, E>(con: E, id: i32, author_id: &str) -> Result<i64, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"DELETE FROM drafts WHERE id = $1 AND author_id = $2"#,
    id,
    author_id,
  )
  .execute(con)
  .await
  .map(|r| r.rows_affected() as i64)
}

/// Copy a draft to an article (used for publishing)
/// # Arguments
/// * `con` - The database connection
/// * `id` - The draft ID
/// * `author_id` - The author ID
/// # Returns
/// The id of the new article
/// # Errors
/// Returns a `sqlx::Error` if the query fails
pub async fn copy_draft_to_article<'e, E>(
  con: E,
  id: i32,
  author_id: &str,
) -> Result<i32, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"INSERT INTO articles (title, content, author_id)
    SELECT title, content, author_id FROM drafts WHERE id = $1 AND author_id = $2
    RETURNING id"#,
    id,
    author_id,
  )
  .fetch_one(con)
  .await
  .map(|r| r.id)
}
