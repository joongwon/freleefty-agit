#[macro_use]
extern crate napi_derive;

type DbPool = sqlx::PgPool;

fn init_dbpool(database_url: &str) -> Result<DbPool, sqlx::Error> {
  sqlx::postgres::PgPoolOptions::new()
    .acquire_timeout(std::time::Duration::from_secs(1))
    .connect_lazy(database_url)
}

mod articles;
mod comments;
mod schema;
mod users;

use articles::{
  get_article, get_next_article, get_previous_article, list_articles, list_popular_articles,
};
use comments::list_comments;
use users::{create_user, get_user_by_naver_id, UserConflict, get_user_by_id};

#[napi]
pub struct QueryEngine {
  pool: DbPool,
}

fn error_to_napi<T>(e: T) -> napi::Error
where
  T: std::fmt::Display,
{
  napi::Error::new(napi::Status::GenericFailure, e.to_string())
}

#[napi]
impl QueryEngine {
  #[napi(factory)]
  pub fn new(database_url: String) -> Result<Self, napi::Error> {
    let pool = init_dbpool(&database_url).map_err(error_to_napi)?;
    Ok(Self { pool })
  }

  #[napi]
  pub async fn list_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    list_articles(&self.pool).await.map_err(error_to_napi)
  }

  #[napi]
  pub async fn list_popular_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    list_popular_articles(&self.pool, 5, Some(14))
      .await
      .map_err(error_to_napi)
  }

  #[napi]
  pub async fn get_article(&self, id: i32) -> Result<Option<schema::Article>, napi::Error> {
    let mut tx = self.pool.begin().await.map_err(error_to_napi)?;
    let mut article = get_article(&mut *tx, id).await.map_err(error_to_napi)?;
    if let Some(ref mut article) = article {
      article.comments = list_comments(&mut *tx, id).await.map_err(error_to_napi)?;
      article.next = get_next_article(&mut *tx, id)
        .await
        .map_err(error_to_napi)?;
      article.prev = get_previous_article(&mut *tx, id)
        .await
        .map_err(error_to_napi)?;
    }
    tx.commit().await.map_err(error_to_napi)?;
    Ok(article)
  }

  #[napi]
  pub async fn get_user_by_naver_id(
    &self,
    naver_id: String,
  ) -> Result<Option<schema::User>, napi::Error> {
    get_user_by_naver_id(&self.pool, &naver_id)
      .await
      .map_err(error_to_napi)
  }

  #[napi]
  pub async fn get_user_by_id(
    &self,
    user_id: String,
  ) -> Result<Option<schema::User>, napi::Error> {
    get_user_by_id(&self.pool, &user_id)
      .await
      .map_err(error_to_napi)
  }

  #[napi]
  pub async fn create_user(
    &self,
    naver_id: String,
    user_id: String,
    user_name: String,
  ) -> Result<Option<UserConflict>, napi::Error> {
    create_user(&self.pool, &naver_id, &user_id, &user_name)
      .await
      .map_err(error_to_napi)
  }
}
