#[macro_use]
extern crate napi_derive;

type DbPool = sqlx::PgPool;

fn init_dbpool(database_url: &str) -> Result<DbPool, sqlx::Error> {
  // logger initialization may fail when called multiple times, but it's okay
  _ = env_logger::try_init();
  sqlx::postgres::PgPoolOptions::new()
    .acquire_timeout(std::time::Duration::from_secs(1))
    .connect_lazy(database_url)
}

mod articles;
mod comments;
mod drafts;
mod editions;
mod files;
mod likes;
mod schema;
mod users;
mod views;

use std::path::{Path, PathBuf};

use articles::{
  delete_article, delete_article_if_no_editions, get_article, get_article_author_id,
  get_article_draft_id, get_next_article, get_previous_article, list_articles,
  list_popular_articles,
};
use comments::{create_comment, delete_comment, get_comment_author, list_comments};
use drafts::{
  create_draft, create_draft_from_article, delete_draft, get_draft, get_draft_author,
  get_draft_title_length, list_drafts, update_draft,
};
use editions::{create_edition_from_draft, get_edition, list_edition_ids, list_editions};
use files::{
  copy_article_files_to_draft, create_file, delete_file, get_file_info, list_article_files,
  list_draft_files, list_edition_files, move_draft_files_to_edition, CreateFileResult,
};
use likes::{like_article, list_likers, unlike_article};
use log::{debug, error};
use napi::bindgen_prelude::Promise;
use schema::FileInfo;
use users::{create_user, get_user_by_id, get_user_by_naver_id};
use views::create_view_log;

#[derive(thiserror::Error, Debug)]
pub enum Error {
  #[error("unexpected None value in column {0:?}")]
  UnexpectedNone(&'static str),
}

#[napi]
pub struct QueryEngine {
  pool: DbPool,
  upload_dir: String,
}

struct ErrHelper {
  scope: &'static str,
}

impl ErrHelper {
  fn imp<E>(&self) -> impl Fn(E) -> napi::Error
  where
    E: std::fmt::Display,
  {
    let scope = self.scope.to_owned();
    move |e| {
      let msg = format!("{}: {}", scope, e);
      error!("{}", msg);
      napi::Error::new(napi::Status::GenericFailure, msg)
    }
  }
}

fn err(scope: &'static str) -> ErrHelper {
  ErrHelper { scope }
}

fn file_path(base: &Path, id: i32, name: &str) -> PathBuf {
  base.join(&id.to_string()).join(name)
}

#[napi]
impl QueryEngine {
  #[napi(factory)]
  pub fn new(database_url: String, upload_dir: String) -> Result<Self, napi::Error> {
    debug!("QueryEngine.new");
    let pool = init_dbpool(&database_url).map_err(err("QueryEngine.new").imp())?;
    Ok(Self { pool, upload_dir })
  }

  fn draft_path(&self, id: i32) -> PathBuf {
    Path::new(&self.upload_dir).join("d").join(&id.to_string())
  }

  fn edition_path(&self, id: i32) -> PathBuf {
    Path::new(&self.upload_dir).join("e").join(&id.to_string())
  }

  #[napi]
  pub async fn list_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    debug!("QueryEngine.list_articles");
    list_articles(&self.pool)
      .await
      .map_err(err("QueryEngine.list_articles").imp())
  }

  #[napi]
  pub async fn list_popular_articles(&self) -> Result<Vec<schema::ArticleSummary>, napi::Error> {
    debug!("QueryEngine.list_popular_articles");
    list_popular_articles(&self.pool, 5, 14)
      .await
      .map_err(err("QueryEngine.list_popular_articles").imp())
  }

  #[napi]
  pub async fn get_article(&self, id: i32) -> Result<Option<schema::Article>, napi::Error> {
    debug!("QueryEngine.get_article");
    let err = err("QueryEngine.get_article");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let mut article = get_article(&mut *tx, id).await.map_err(err.imp())?;
    if let Some(ref mut article) = article {
      debug!("QueryEngine.get_article: exists");
      article.comments = list_comments(&mut *tx, id).await.map_err(err.imp())?;
      article.next = get_next_article(&mut *tx, id).await.map_err(err.imp())?;
      article.prev = get_previous_article(&mut *tx, id)
        .await
        .map_err(err.imp())?;
      article.files = list_article_files(&mut *tx, id).await.map_err(err.imp())?;
    } else {
      debug!("QueryEngine.get_article: not found");
    }
    tx.commit().await.map_err(err.imp())?;
    Ok(article)
  }

  #[napi]
  pub async fn get_user_by_naver_id(
    &self,
    naver_id: String,
  ) -> Result<Option<schema::User>, napi::Error> {
    debug!("QueryEngine.get_user_by_naver_id");
    get_user_by_naver_id(&self.pool, &naver_id)
      .await
      .map_err(err("QueryEngine.get_user_by_naver_id").imp())
  }

  #[napi]
  pub async fn get_user_by_id(&self, user_id: String) -> Result<Option<schema::User>, napi::Error> {
    debug!("QueryEngine.get_user_by_id");
    get_user_by_id(&self.pool, &user_id)
      .await
      .map_err(err("QueryEngine.get_user_by_id").imp())
  }

  #[napi]
  pub async fn create_user(
    &self,
    naver_id: String,
    user_id: String,
    user_name: String,
  ) -> Result<Option<schema::UserConflict>, napi::Error> {
    debug!("QueryEngine.create_user");
    create_user(&self.pool, &naver_id, &user_id, &user_name)
      .await
      .map_err(err("QueryEngine.create_user").imp())
  }

  #[napi]
  pub async fn list_drafts(
    &self,
    user_id: String,
  ) -> Result<Vec<schema::DraftSummary>, napi::Error> {
    debug!("QueryEngine.list_drafts");
    list_drafts(&self.pool, &user_id)
      .await
      .map_err(err("QueryEngine.list_drafts").imp())
  }

  #[napi]
  pub async fn create_draft(&self, user_id: String) -> Result<schema::DraftSummary, napi::Error> {
    debug!("QueryEngine.create_draft");
    create_draft(&self.pool, &user_id)
      .await
      .map_err(err("QueryEngine.create_draft").imp())
  }

  #[napi]
  pub async fn get_article_draft_id(
    &self,
    user_id: String,
    article_id: i32,
  ) -> Result<Option<i32>, napi::Error> {
    debug!("QueryEngine.get_article_draft_id");
    get_article_draft_id(&self.pool, &user_id, article_id)
      .await
      .map_err(err("QueryEngine.get_article_draft_id").imp())
  }

  #[napi]
  pub async fn edit_article(
    &self,
    user_id: String,
    article_id: i32,
  ) -> Result<napi::Either<i32, NotFoundForbidden>, napi::Error> {
    debug!("QueryEngine.edit_article");
    let err = err("QueryEngine.edit_article");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let author_id = get_article_author_id(&mut *tx, article_id)
      .await
      .map_err(err.imp())?;
    match author_id {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.edit_article: create draft");
      }
      Some(_) => {
        debug!("QueryEngine.edit_article: forbidden");
        tx.commit().await.map_err(err.imp())?;
        return Ok(napi::Either::B(NotFoundForbidden::Forbidden));
      }
      None => {
        debug!("QueryEngine.edit_article: not found");
        tx.commit().await.map_err(err.imp())?;
        return Ok(napi::Either::B(NotFoundForbidden::NotFound));
      }
    }
    let draft_id = create_draft_from_article(&mut *tx, article_id)
      .await
      .map_err(err.imp())?;
    let files = copy_article_files_to_draft(&mut *tx, article_id, draft_id)
      .await
      .map_err(err.imp())?;
    for (old_id, new_id, name) in files {
      let old_path = file_path(&self.edition_path(article_id), old_id, &name);
      let new_path = file_path(&self.draft_path(draft_id), new_id, &name);
      std::fs::create_dir_all(new_path.parent().unwrap()).map_err(err.imp())?;
      std::fs::hard_link(&old_path, &new_path).map_err(err.imp())?;
    }
    tx.commit().await.map_err(err.imp())?;
    Ok(napi::Either::A(draft_id))
  }

  #[napi]
  pub async fn get_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<Option<schema::Draft>, napi::Error> {
    debug!("QueryEngine.get_draft");
    let err = err("QueryEngine.get_draft");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let mut draft = get_draft(&mut *tx, id, &author_id)
      .await
      .map_err(err.imp())?;
    if let Some(ref mut draft) = draft {
      draft.files = list_draft_files(&mut *tx, id).await.map_err(err.imp())?;
      debug!("QueryEngine.get_draft: exists");
    } else {
      debug!("QueryEngine.get_draft: not found");
    }
    tx.commit().await.map_err(err.imp())?;
    Ok(draft)
  }

  #[napi]
  pub async fn update_draft(
    &self,
    id: i32,
    author_id: String,
    title: String,
    body: String,
  ) -> Result<MaybeNotFound, napi::Error> {
    debug!("QueryEngine.update_draft");
    let res = update_draft(&self.pool, id, &author_id, &title, &body)
      .await
      .map_err(err("QueryEngine.update_draft").imp())?;
    if res == 0 {
      debug!("QueryEngine.update_draft: not found");
      Ok(MaybeNotFound::NotFound)
    } else {
      debug!("QueryEngine.update_draft: ok");
      Ok(MaybeNotFound::Ok)
    }
  }

  #[napi]
  pub async fn delete_draft(
    &self,
    id: i32,
    author_id: String,
  ) -> Result<MaybeNotFound, napi::Error> {
    debug!("QueryEngine.delete_draft");
    let err = err("QueryEngine.delete_draft");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let article_id = delete_draft(&mut *tx, id, &author_id)
      .await
      .map_err(err.imp())?;
    let article_id = match article_id {
      Some(article_id) => {
        debug!("QueryEngine.delete_draft: ok");
        article_id
      }
      None => {
        debug!("QueryEngine.delete_draft: not found");
        tx.commit().await.map_err(err.imp())?;
        return Ok(MaybeNotFound::NotFound);
      }
    };
    delete_article_if_no_editions(&mut *tx, article_id)
      .await
      .map_err(err.imp())?;

    // delete files
    let path = self.draft_path(id);
    if path.exists() {
      std::fs::remove_dir_all(path).map_err(err.imp())?;
    }

    tx.commit().await.map_err(err.imp())?;
    Ok(MaybeNotFound::Ok)
  }

  #[napi]
  pub async fn delete_article(
    &self,
    id: i32,
    user_id: String,
  ) -> Result<MaybeNotFoundForbidden, napi::Error> {
    debug!("QueryEngine.delete_article");
    let err = err("QueryEngine.delete_article");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    match get_article_author_id(&mut *tx, id)
      .await
      .map_err(err.imp())?
    {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.delete_article: ok");
      }
      Some(_) => {
        debug!("QueryEngine.delete_article: forbidden");
        tx.commit().await.map_err(err.imp())?;
        return Ok(MaybeNotFoundForbidden::Forbidden);
      }
      None => {
        debug!("QueryEngine.delete_article: not found");
        tx.commit().await.map_err(err.imp())?;
        return Ok(MaybeNotFoundForbidden::NotFound);
      }
    }
    delete_article(&mut *tx, id).await.map_err(err.imp())?;

    // delete files
    let editions = list_edition_ids(&mut *tx, id).await.map_err(err.imp())?;
    for edition_id in editions {
      let path = self.edition_path(edition_id);
      if path.exists() {
        std::fs::remove_dir_all(path).map_err(err.imp())?;
      }
    }
    let draft_id = get_article_draft_id(&mut *tx, &user_id, id)
      .await
      .map_err(err.imp())?;
    if let Some(draft_id) = draft_id {
      let path = self.draft_path(draft_id);
      if path.exists() {
        std::fs::remove_dir_all(path).map_err(err.imp())?;
      }
    }

    tx.commit().await.map_err(err.imp())?;
    Ok(MaybeNotFoundForbidden::Ok)
  }

  #[napi]
  pub async fn publish_draft(
    &self,
    id: i32,
    author_id: String,
    notes: Option<String>,
  ) -> Result<napi::Either<i32, BadRequest>, napi::Error> {
    debug!("QueryEngine.publish_draft");
    let err = err("QueryEngine.publish_draft");

    let mut tx = self.pool.begin().await.map_err(err.imp())?;

    let draft_len = get_draft_title_length(&mut *tx, id, &author_id)
      .await
      .map_err(err.imp())?;
    if draft_len == 0 {
      debug!("QueryEngine.publish_draft: bad");
      tx.commit().await.map_err(err.imp())?;
      return Ok(napi::Either::B(BadRequest::Bad));
    }

    let (article_id, edition_id) =
      create_edition_from_draft(&mut *tx, id, &author_id, &notes.unwrap_or_default())
        .await
        .map_err(err.imp())?;
    move_draft_files_to_edition(&mut *tx, id, edition_id)
      .await
      .map_err(err.imp())?;
    delete_draft(&mut *tx, id, &author_id)
      .await
      .map_err(err.imp())?;
    let old_path = self.draft_path(id);
    let new_path = self.edition_path(edition_id);
    std::fs::create_dir_all(new_path.parent().unwrap()).map_err(err.imp())?;
    std::fs::rename(old_path, new_path).map_err(err.imp())?;
    tx.commit().await.map_err(err.imp())?;
    Ok(napi::Either::A(article_id))
  }

  #[napi]
  pub async fn create_comment(
    &self,
    article_id: i32,
    author_id: String,
    body: String,
  ) -> Result<i32, napi::Error> {
    debug!("QueryEngine.create_comment");
    create_comment(&self.pool, article_id, &author_id, &body)
      .await
      .map_err(err("QueryEngine.create_comment").imp())
  }

  #[napi]
  pub async fn delete_comment(
    &self,
    id: i32,
    user_id: String,
  ) -> Result<MaybeNotFoundForbidden, napi::Error> {
    debug!("QueryEngine.delete_comment");
    let err = err("QueryEngine.delete_comment");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    match get_comment_author(&mut *tx, id).await.map_err(err.imp())? {
      Some(author_id) if author_id == user_id => {
        debug!("QueryEngine.delete_comment: ok");
        delete_comment(&mut *tx, id).await.map_err(err.imp())?;
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::Ok)
      }
      Some(_) => {
        debug!("QueryEngine.delete_comment: forbidden");
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::Forbidden)
      }
      None => {
        debug!("QueryEngine.delete_comment: not found");
        tx.commit().await.map_err(err.imp())?;
        Ok(MaybeNotFoundForbidden::NotFound)
      }
    }
  }

  #[napi]
  pub async fn create_view_log(&self, article_id: i32) -> Result<(), napi::Error> {
    debug!("QueryEngine.create_view_log");
    create_view_log(&self.pool, article_id)
      .await
      .map_err(err("QueryEngine.create_view_log").imp())
  }

  #[napi]
  pub async fn like_article(&self, article_id: i32, user_id: String) -> Result<i64, napi::Error> {
    debug!("QueryEngine.like_article");
    like_article(&self.pool, article_id, &user_id)
      .await
      .map_err(err("QueryEngine.like_article").imp())
  }

  #[napi]
  pub async fn unlike_article(&self, article_id: i32, user_id: String) -> Result<i64, napi::Error> {
    debug!("QueryEngine.unlike_article");
    unlike_article(&self.pool, article_id, &user_id)
      .await
      .map_err(err("QueryEngine.unlike_article").imp())
  }

  #[napi]
  pub async fn list_likers(&self, article_id: i32) -> Result<Vec<schema::LikeLog>, napi::Error> {
    debug!("QueryEngine.list_likers");
    list_likers(&self.pool, article_id)
      .await
      .map_err(err("QueryEngine.list_likers").imp())
  }

  #[napi]
  pub async fn get_edition(&self, edition_id: i32) -> Result<Option<schema::Edition>, napi::Error> {
    debug!("QueryEngine.get_edition");
    let err = err("QueryEngine.get_edition");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let mut edition = get_edition(&mut *tx, edition_id).await.map_err(err.imp())?;
    if let Some(ref mut edition) = edition {
      edition.editions = list_editions(&mut *tx, edition.article_id)
        .await
        .map_err(err.imp())?;
      edition.files = list_edition_files(&mut *tx, edition_id)
        .await
        .map_err(err.imp())?;
    }
    Ok(edition)
  }

  #[napi]
  pub async fn create_file(
    &self,
    draft_id: i32,
    name: String,
    user_id: String,
    old_path: Promise<String>,
  ) -> Result<napi::Either<i32, NotFoundBadRequest>, napi::Error> {
    debug!("QueryEngine.create_file");
    let err = err("QueryEngine.create_file");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let author_id = get_draft_author(&mut *tx, draft_id)
      .await
      .map_err(err.imp())?;
    if author_id != Some(user_id) {
      debug!("QueryEngine.create_file: not found");
      tx.commit().await.map_err(err.imp())?;
      return Ok(napi::Either::B(NotFoundBadRequest::NotFound));
    }
    let file = create_file(&mut *tx, draft_id, &name)
      .await
      .map_err(err.imp())?;
    let id = match file {
      CreateFileResult::NameConflict => {
        tx.commit().await.map_err(err.imp())?;
        return Ok(napi::Either::B(NotFoundBadRequest::Bad));
      }
      CreateFileResult::Ok(id) => id,
    };
    let new_path = file_path(&self.draft_path(draft_id), id, &name);
    std::fs::create_dir_all(new_path.parent().unwrap()).map_err(err.imp())?;
    std::fs::rename(&old_path.await?, &new_path).map_err(err.imp())?;
    tx.commit().await.map_err(err.imp())?;
    Ok(napi::Either::A(id))
  }

  #[napi]
  pub async fn delete_file(
    &self,
    file_id: i32,
    user_id: String,
  ) -> Result<MaybeNotFound, napi::Error> {
    debug!("QueryEngine.remove_file");
    let err = err("QueryEngine.remove_file");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let info = get_file_info(&mut *tx, file_id).await.map_err(err.imp())?;
    let info = match info {
      Some(info) if info.author_id == user_id => {
        debug!("QueryEngine.remove_file: ok");
        info
      }
      _ => {
        debug!("QueryEngine.remove_file: not found");
        tx.commit().await.map_err(err.imp())?;
        return Ok(MaybeNotFound::NotFound);
      }
    };
    delete_file(&mut *tx, file_id).await.map_err(err.imp())?;
    let file_path = file_path(&self.draft_path(info.draft_id), file_id, &info.name);
    std::fs::remove_file(&file_path).map_err(err.imp())?;
    tx.commit().await.map_err(err.imp())?;
    Ok(MaybeNotFound::Ok)
  }

  #[napi]
  pub async fn get_file_info(
    &self,
    file_id: i32,
    user_id: String,
  ) -> Result<Option<FileInfo>, napi::Error> {
    debug!("QueryEngine.get_file_info");
    let err = err("QueryEngine.get_file_info");
    let mut tx = self.pool.begin().await.map_err(err.imp())?;
    let info = get_file_info(&mut *tx, file_id).await.map_err(err.imp())?;
    let info = match info {
      Some(info) if info.author_id == user_id => {
        debug!("QueryEngine.get_file_info: ok");
        info
      }
      _ => {
        debug!("QueryEngine.get_file_info: not found");
        tx.commit().await.map_err(err.imp())?;
        return Ok(None);
      }
    };
    tx.commit().await.map_err(err.imp())?;
    Ok(Some(info))
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

#[napi(string_enum)]
pub enum NotFoundForbidden {
  NotFound,
  Forbidden,
}

#[napi(string_enum)]
pub enum NotFoundBadRequest {
  NotFound,
  Bad,
}
