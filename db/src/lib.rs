#[macro_use]
extern crate napi_derive;

type Pool = sqlx::PgPool;

fn init_pool(database_url: &str) -> Result<Pool, sqlx::Error> {
    sqlx::postgres::PgPoolOptions::new()
        .acquire_timeout(std::time::Duration::from_secs(1))
        .connect_lazy(database_url)
}

mod articles;
mod comments;
mod schema;

use articles::{get_article, list_articles, list_popular_articles, get_next_article, get_previous_article};
use comments::list_comments;

#[napi]
pub struct QueryEngine {
    pool: Pool,
}

fn error_to_napi<T>(e: T) -> napi::Error
where T: std::fmt::Display
{
    napi::Error::new(napi::Status::GenericFailure, e.to_string())
}

#[napi]
impl QueryEngine {
    #[napi(factory)]
    pub fn new(database_url: String) -> Result<Self, napi::Error> {
        let pool = init_pool(&database_url).map_err(error_to_napi)?;
        Ok(Self { pool })
    }

    #[napi]
    pub async fn list_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
        list_articles(&self.pool).await.map_err(error_to_napi)
    }

    #[napi]
    pub async fn list_popular_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
        list_popular_articles(&self.pool, 5, Some(14)).await.map_err(error_to_napi)
    }

    #[napi]
    pub async fn get_article(&self, id: i32) -> Result<Option<schema::Article>, napi::Error> {
        let mut tx = self.pool.begin().await.map_err(error_to_napi)?;
        let mut article = get_article(&mut *tx, id).await.map_err(error_to_napi)?;
        if let Some(ref mut article) = article {
            article.comments = list_comments(&mut *tx, id).await.map_err(error_to_napi)?;
            article.next = get_next_article(&mut *tx, id).await.map_err(error_to_napi)?;
            article.prev = get_previous_article(&mut *tx, id).await.map_err(error_to_napi)?;
        }
        tx.commit().await.map_err(error_to_napi)?;
        Ok(article)
    }
}
