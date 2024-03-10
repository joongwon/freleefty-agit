use crate::schema::{User, UserConflict};

pub async fn get_user_by_naver_id<'e, E>(
  con: E,
  naver_id: &str,
) -> Result<Option<User>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let user = sqlx::query_as!(
    User,
    r#"SELECT id, name, role as "role: _" FROM users WHERE naver_id = $1"#,
    naver_id
  )
  .fetch_optional(con)
  .await?;
  Ok(user)
}

pub async fn create_user<'e, E>(
  con: E,
  naver_id: &str,
  user_id: &str,
  user_name: &str,
) -> Result<Option<UserConflict>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let result = sqlx::query!(
    r#"INSERT INTO users (naver_id, id, name) VALUES ($1, $2, $3)"#,
    naver_id,
    user_id,
    user_name
  )
  .execute(con)
  .await;
  match result {
    Ok(_) => Ok(None),
    Err(sqlx::Error::Database(err)) => match err.constraint() {
      Some("users_naver_id_key") => Ok(Some(UserConflict::NaverId)),
      Some("users_pkey") => Ok(Some(UserConflict::Id)),
      Some("users_name_key") => Ok(Some(UserConflict::Name)),
      _ => Err(sqlx::Error::Database(err)),
    },
    Err(err) => Err(err),
  }
}

pub async fn get_user_by_id<'e, E>(con: E, user_id: &str) -> Result<Option<User>, sqlx::Error>
where
  E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
  let user = sqlx::query_as!(
    User,
    r#"SELECT id, name, role as "role: _" FROM users WHERE id = $1"#,
    user_id
  )
  .fetch_optional(con)
  .await?;
  Ok(user)
}
