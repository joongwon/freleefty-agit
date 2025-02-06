import type { default as UsersTable } from './Users';
import type { default as ArticlesTable } from './Articles';
import type { default as CommentsTable } from './Comments';
import type { default as ViewsTable } from './Views';
import type { default as LikesTable } from './Likes';
import type { default as DraftsTable } from './Drafts';
import type { default as EditionsTable } from './Editions';
import type { default as FilesTable } from './Files';
import type { default as PgmigrationsTable } from './Pgmigrations';
import type { default as WebhooksTable } from './Webhooks';
import type { default as CategoriesTable } from './Categories';
import type { default as ArticleCategoriesTable } from './ArticleCategories';
import type { default as ArticleStatsTable } from './ArticleStats';
import type { default as LastEditionsTable } from './LastEditions';

export default interface PublicSchema {
  users: UsersTable;

  articles: ArticlesTable;

  comments: CommentsTable;

  views: ViewsTable;

  likes: LikesTable;

  drafts: DraftsTable;

  editions: EditionsTable;

  files: FilesTable;

  pgmigrations: PgmigrationsTable;

  webhooks: WebhooksTable;

  categories: CategoriesTable;

  article_categories: ArticleCategoriesTable;

  article_stats: ArticleStatsTable;

  last_editions: LastEditionsTable;
}