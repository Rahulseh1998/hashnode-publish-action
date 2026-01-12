export interface Frontmatter {
  title: string;
  slug: string;
  tags?: string;
  subtitle?: string;
  cover?: string;
  seriesSlug?: string;
  enableToc?: boolean;
  saveAsDraft?: boolean;
  delete?: boolean;
  canonicalUrl?: string;
  disableComments?: boolean;
  publishedAt?: string;
}

export interface ParsedFile {
  frontmatter: Frontmatter;
  content: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  url?: string;
  series?: {
    id: string;
    slug: string;
  };
}

export interface Draft {
  id: string;
  title: string;
  slug: string;
}

export interface Series {
  id: string;
  name: string;
  slug: string;
}

export interface Publication {
  id: string;
  title: string;
  posts?: {
    edges: Array<{ node: Post }>;
  };
  seriesList?: {
    edges: Array<{ node: Series }>;
  };
  drafts?: {
    edges: Array<{ node: Draft }>;
  };
}

export interface TagInput {
  slug: string;
  name: string;
}

export interface ProcessResult {
  status:
    | 'published'
    | 'updated'
    | 'deleted'
    | 'draft_created'
    | 'draft_updated'
    | 'published_from_draft'
    | 'unchanged'
    | 'skipped'
    | 'failed';
  title?: string;
  url?: string;
  reason?: string;
  error?: string;
}

export interface ActionOutputs {
  published: number;
  updated: number;
  deleted: number;
  drafts_created: number;
  drafts_updated: number;
  published_from_draft: number;
  unchanged: number;
  skipped: number;
  failed: number;
}
