use crate::schema::{Author, Comment};

/// List comments for a given article
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The article id
/// # Returns
/// A vector of comments
/// # Errors
/// If the query fails, an error is returned
pub async fn list_comments<'e, E>(con: E, article_id: i32) -> Result<Vec<Comment>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT comments.id, content, created_at, author_id, name
        FROM comments JOIN users ON comments.author_id = users.id
        WHERE article_id = $1
        ORDER BY created_at DESC"#,
    article_id
  )
  .fetch_all(con)
  .await
  .map(|rows| {
    rows
      .into_iter()
      .map(|row| Comment {
        id: row.id,
        content: row.content,
        created_at: row.created_at.to_string(),
        author: Author {
          id: row.author_id,
          name: row.name,
        },
      })
      .collect()
  })
}

/// Create a new comment
/// # Arguments
/// * `con` - The database connection
/// * `article_id` - The article id
/// * `author_id` - The author id
/// * `content` - The comment content
/// # Returns
/// The ID of the newly created comment
/// # Errors
/// If the query fails, an error is returned
pub async fn create_comment<'e, E>(
  con: E,
  article_id: i32,
  author_id: &str,
  content: &str,
) -> Result<i32, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"INSERT INTO comments (article_id, author_id, content)
        VALUES ($1, $2, $3)
        RETURNING id"#,
    article_id,
    author_id,
    content
  )
  .fetch_one(con)
  .await
  .map(|row| row.id)
}

/// Delete a comment
/// # Arguments
/// * `con` - The database connection
/// * `comment_id` - The comment id
/// # Returns
/// The number of rows affected
/// # Errors
/// If the query fails, an error is returned
pub async fn delete_comment<'e, E>(con: E, comment_id: i32) -> Result<u64, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"DELETE FROM comments
        WHERE id = $1"#,
    comment_id,
  )
  .execute(con)
  .await
  .map(|result| result.rows_affected())
}

/// Get the ID of the author of a comment
/// # Arguments
/// * `con` - The database connection
/// * `comment_id` - The comment id
/// # Returns
/// The author ID
/// # Errors
/// If the query fails, an error is returned
pub async fn get_comment_author<'e, E>(
  con: E,
  comment_id: i32,
) -> Result<Option<String>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  sqlx::query!(
    r#"SELECT author_id
        FROM comments
        WHERE id = $1"#,
    comment_id,
  )
  .fetch_optional(con)
  .await
  .map(|row| row.map(|row| row.author_id))
}
