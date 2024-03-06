use crate::schema::{Author, Comment};

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
