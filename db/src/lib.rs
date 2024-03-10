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
mod drafts;
mod schema;
mod users;
mod views;

use articles::{
  delete_article, get_article, get_article_author_id, get_next_article, get_previous_article,
  list_articles, list_popular_articles,
};
use comments::{list_comments, create_comment, delete_comment, get_comment_author};
use drafts::{
  copy_draft_to_article, create_draft, delete_draft, get_draft, list_drafts, update_draft,
  get_draft_title_length,
};
use users::{create_user, get_user_by_id, get_user_by_naver_id};
use views::{create_view_log};

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
    list_popular_articles(&self.pool, 5, 14)
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
  pub async fn get_user_by_id(&self, user_id: String) -> Result<Option<schema::User>, napi::Error> {
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
  ) -> Result<Option<schema::UserConflict>, napi::Error> {
    create_user(&self.pool, &naver_id, &user_id, &user_name)
      .await
      .map_err(error_to_napi)
  }

  #[napi]
  pub async fn list_or_create_draft(
    &self,
    user_id: String,
  ) -> Result<napi::Either<schema::DraftSummary, Vec<schema::DraftSummary>>, napi::Error> {
    let mut tx = self.pool.begin().await.map_err(error_to_napi)?;
    let drafts = list_drafts(&mut *tx, &user_id)
      .await
      .map_err(error_to_napi)?;
    if drafts.is_empty() {
      let draft = create_draft(&mut *tx, &user_id)
        .await
        .map_err(error_to_napi)?;
      tx.commit().await.map_err(error_to_napi)?;
      Ok(napi::Either::A(draft))
    } else {
      tx.commit().await.map_err(error_to_napi)?;
      Ok(napi::Either::B(drafts))
    }
  }

  #[napi]
  pub async fn get_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<Option<schema::Draft>, napi::Error> {
    get_draft(&self.pool, id, &author_id)
      .await
      .map_err(error_to_napi)
  }

  #[napi]
  pub async fn update_draft(
    &self,
    id: i32,
    author_id: String,
    title: String,
    body: String,
  ) -> Result<MaybeNotFound, napi::Error> {
    let res = update_draft(&self.pool, id, &author_id, &title, &body)
      .await
      .map_err(error_to_napi)?;
    if res == 0 {
      Ok(MaybeNotFound::NotFound)
    } else {
      Ok(MaybeNotFound::Ok)
    }
  }

  #[napi]
  pub async fn delete_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<MaybeNotFound, napi::Error> {
    if delete_draft(&self.pool, id, &author_id)
      .await
      .map_err(error_to_napi)?
      == 0
    {
      Ok(MaybeNotFound::NotFound)
    } else {
      Ok(MaybeNotFound::Ok)
    }
  }

  #[napi]
  pub async fn delete_article(
    &self,
    id: i32,
    user_id: String,
  ) -> Result<MaybeNotFoundForbidden, napi::Error> {
    let mut tx = self.pool.begin().await.map_err(error_to_napi)?;
    match get_article_author_id(&mut *tx, id).await.map_err(error_to_napi)? {
      Some(author_id) if author_id == user_id => {
        delete_article(&mut *tx, id).await.map_err(error_to_napi)?;
        tx.commit().await.map_err(error_to_napi)?;
        Ok(MaybeNotFoundForbidden::Ok)
      }
      Some(_) => {
        tx.commit().await.map_err(error_to_napi)?;
        Ok(MaybeNotFoundForbidden::Forbidden)
      }
      None => {
        tx.commit().await.map_err(error_to_napi)?;
        Ok(MaybeNotFoundForbidden::NotFound)
      }
    }
  }

  #[napi]
  pub async fn publish_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<napi::Either<i32, BadRequest>, napi::Error> {
    let mut tx = self.pool.begin().await.map_err(error_to_napi)?;
    let draft_len = get_draft_title_length(&mut *tx, id, &author_id)
      .await
      .map_err(error_to_napi)?;
    if draft_len > 0 {
      let article_id = copy_draft_to_article(&mut *tx, id, &author_id)
        .await
        .map_err(error_to_napi)?;
      delete_draft(&mut *tx, id, &author_id)
        .await
        .map_err(error_to_napi)?;
      tx.commit().await.map_err(error_to_napi)?;
      Ok(napi::Either::A(article_id))
    } else {
      tx.commit().await.map_err(error_to_napi)?;
      Ok(napi::Either::B(BadRequest::Bad))
    }
  }

  #[napi]
  pub async fn create_comment(
    &self,
    article_id: i32,
    author_id: String,
    body: String,
  ) -> Result<i32, napi::Error> {
    create_comment(&self.pool, article_id, &author_id, &body)
      .await
      .map_err(error_to_napi)
  }

  #[napi]
  pub async fn delete_comment(
    &self,
    id: i32,
    user_id: String,
  ) -> Result<MaybeNotFoundForbidden, napi::Error> {
    let mut tx = self.pool.begin().await.map_err(error_to_napi)?;
    match get_comment_author(&mut *tx, id).await.map_err(error_to_napi)? {
      Some(author_id) if author_id == user_id => {
        delete_comment(&mut *tx, id).await.map_err(error_to_napi)?;
        tx.commit().await.map_err(error_to_napi)?;
        Ok(MaybeNotFoundForbidden::Ok)
      }
      Some(_) => {
        tx.commit().await.map_err(error_to_napi)?;
        Ok(MaybeNotFoundForbidden::Forbidden)
      }
      None => {
        tx.commit().await.map_err(error_to_napi)?;
        Ok(MaybeNotFoundForbidden::NotFound)
      }
    }
  }

  #[napi]
  pub async fn create_view_log(
    &self,
    article_id: i32,
  ) -> Result<(), napi::Error> {
    create_view_log(&self.pool, article_id)
      .await
      .map_err(error_to_napi)
  }
}

#[napi(string_enum)]
pub enum MaybeNotFound {
  Ok,
  NotFound,
}

#[napi(string_enum)]
pub enum MaybeNotFoundForbidden {
  Ok,
  Forbidden,
  NotFound,
}

#[napi(string_enum)]
pub enum BadRequest {
  Bad,
}
