import type { default as WebhooksTable } from './Webhooks';
import type { default as ArticlesTable } from './Articles';
import type { default as CommentsTable } from './Comments';
import type { default as LikesTable } from './Likes';
import type { default as ViewsTable } from './Views';
import type { default as DraftsTable } from './Drafts';
import type { default as EditionsTable } from './Editions';
import type { default as FilesTable } from './Files';
import type { default as PgmigrationsTable } from './Pgmigrations';
import type { default as UsersTable } from './Users';
import type { default as LastEditionsTable } from './LastEditions';
import type { default as ArticleStatsTable } from './ArticleStats';

export default interface PublicSchema {
  webhooks: WebhooksTable;

  articles: ArticlesTable;

  comments: CommentsTable;

  likes: LikesTable;

  views: ViewsTable;

  drafts: DraftsTable;

  editions: EditionsTable;

  files: FilesTable;

  pgmigrations: PgmigrationsTable;

  users: UsersTable;

  last_editions: LastEditionsTable;

  article_stats: ArticleStatsTable;
}