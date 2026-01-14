import * as https from 'https';
import {
  Post,
  Draft,
  Series,
  Publication,
  Frontmatter,
  TagInput,
} from './types';

const HASHNODE_API = 'gql.hashnode.com';

export class HashnodeClient {
  private accessToken: string;
  private publicationId: string;
  private publicationHost: string;

  constructor(
    accessToken: string,
    publicationId: string,
    publicationHost: string
  ) {
    this.accessToken = accessToken;
    this.publicationId = publicationId;
    this.publicationHost = publicationHost;
  }

  private async graphqlRequest<T>(
    query: string,
    variables: Record<string, unknown>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ query, variables });

      const options = {
        hostname: HASHNODE_API,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.accessToken,
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.errors) {
              reject(new Error(JSON.stringify(result.errors, null, 2)));
            } else {
              resolve(result.data as T);
            }
          } catch {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private buildTagsInput(tagsString?: string): TagInput[] {
    if (!tagsString) return [];

    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    return tags.slice(0, 5).map((tag) => ({
      slug: tag.toLowerCase().replace(/\s+/g, '-'),
      name: tag,
    }));
  }

  private buildCoAuthorsInput(coAuthorsString?: string): string[] {
    if (!coAuthorsString) return [];

    return coAuthorsString
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
  }

  async getPublication(): Promise<Publication | null> {
    const query = `
      query GetPublication($host: String!) {
        publication(host: $host) {
          id
          title
          posts(first: 50) {
            edges {
              node {
                id
                slug
                title
              }
            }
          }
          seriesList(first: 20) {
            edges {
              node {
                id
                slug
                name
              }
            }
          }
          drafts(first: 50) {
            edges {
              node {
                id
                slug
                title
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest<{ publication: Publication }>(
      query,
      { host: this.publicationHost }
    );
    return data?.publication || null;
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const query = `
      query GetPost($host: String!, $slug: String!) {
        publication(host: $host) {
          post(slug: $slug) {
            id
            title
            slug
            url
            series {
              id
              slug
            }
          }
        }
      }
    `;

    try {
      const data = await this.graphqlRequest<{
        publication: { post: Post | null };
      }>(query, { host: this.publicationHost, slug });
      return data?.publication?.post || null;
    } catch {
      return null;
    }
  }

  async getSeriesBySlug(slug: string): Promise<Series | null> {
    const query = `
      query GetSeries($host: String!, $slug: String!) {
        publication(host: $host) {
          series(slug: $slug) {
            id
            name
            slug
          }
        }
      }
    `;

    try {
      const data = await this.graphqlRequest<{
        publication: { series: Series | null };
      }>(query, { host: this.publicationHost, slug });
      return data?.publication?.series || null;
    } catch {
      return null;
    }
  }

  async getDraftBySlug(slug: string): Promise<Draft | null> {
    const publication = await this.getPublication();
    if (!publication?.drafts?.edges) return null;

    const draft = publication.drafts.edges.find((e) => e.node.slug === slug);
    return draft?.node || null;
  }

  async publishPost(
    frontmatter: Frontmatter,
    content: string,
    seriesId?: string
  ): Promise<Post> {
    const input: Record<string, unknown> = {
      title: frontmatter.title,
      slug: frontmatter.slug,
      contentMarkdown: content,
      publicationId: this.publicationId,
      tags: this.buildTagsInput(frontmatter.tags),
      subtitle: frontmatter.subtitle || undefined,
      settings: {
        enableTableOfContent: frontmatter.enableToc === true,
        disableComments: frontmatter.disableComments === true,
      },
    };

    if (frontmatter.cover) {
      input.coverImageOptions = { coverImageURL: frontmatter.cover };
    }

    if (frontmatter.canonicalUrl) {
      input.originalArticleURL = frontmatter.canonicalUrl;
    }

    if (seriesId) {
      input.seriesId = seriesId;
    }

    if (frontmatter.publishedAt) {
      input.publishedAt = frontmatter.publishedAt;
    }

    // Add co-authors if specified
    const coAuthors = this.buildCoAuthorsInput(frontmatter.coAuthors);
    if (coAuthors.length > 0) {
      input.coAuthors = coAuthors;
    }

    // Add SEO metadata if specified
    if (frontmatter.metaTitle || frontmatter.metaDescription) {
      input.metaTags = {
        title: frontmatter.metaTitle || undefined,
        description: frontmatter.metaDescription || undefined,
      };
    }

    const mutation = `
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post {
            id
            slug
            url
            title
          }
        }
      }
    `;

    const result = await this.graphqlRequest<{ publishPost: { post: Post } }>(
      mutation,
      { input }
    );
    return result.publishPost.post;
  }

  async updatePost(
    postId: string,
    frontmatter: Frontmatter,
    content: string,
    seriesId?: string
  ): Promise<Post> {
    const input: Record<string, unknown> = {
      id: postId,
      title: frontmatter.title,
      slug: frontmatter.slug,
      contentMarkdown: content,
      tags: this.buildTagsInput(frontmatter.tags),
      subtitle: frontmatter.subtitle || undefined,
      settings: {
        enableTableOfContent: frontmatter.enableToc === true,
        disableComments: frontmatter.disableComments === true,
      },
    };

    if (frontmatter.cover) {
      input.coverImageOptions = { coverImageURL: frontmatter.cover };
    }

    if (frontmatter.canonicalUrl) {
      input.originalArticleURL = frontmatter.canonicalUrl;
    }

    if (seriesId) {
      input.seriesId = seriesId;
    }

    // Add co-authors if specified
    const coAuthors = this.buildCoAuthorsInput(frontmatter.coAuthors);
    if (coAuthors.length > 0) {
      input.coAuthors = coAuthors;
    }

    // Add SEO metadata if specified
    if (frontmatter.metaTitle || frontmatter.metaDescription) {
      input.metaTags = {
        title: frontmatter.metaTitle || undefined,
        description: frontmatter.metaDescription || undefined,
      };
    }

    const mutation = `
      mutation UpdatePost($input: UpdatePostInput!) {
        updatePost(input: $input) {
          post {
            id
            slug
            url
            title
          }
        }
      }
    `;

    const result = await this.graphqlRequest<{ updatePost: { post: Post } }>(
      mutation,
      { input }
    );
    return result.updatePost.post;
  }

  async removePost(postId: string): Promise<Post> {
    const mutation = `
      mutation RemovePost($id: ID!) {
        removePost(input: { id: $id }) {
          post {
            id
            title
          }
        }
      }
    `;

    const result = await this.graphqlRequest<{ removePost: { post: Post } }>(
      mutation,
      { id: postId }
    );
    return result.removePost.post;
  }

  async createDraft(frontmatter: Frontmatter, content: string): Promise<Draft> {
    const input: Record<string, unknown> = {
      title: frontmatter.title,
      slug: frontmatter.slug,
      contentMarkdown: content,
      publicationId: this.publicationId,
      tags: this.buildTagsInput(frontmatter.tags),
      subtitle: frontmatter.subtitle || undefined,
      settings: {
        enableTableOfContent: frontmatter.enableToc === true,
      },
    };

    if (frontmatter.cover) {
      input.coverImageOptions = { coverImageURL: frontmatter.cover };
    }

    const mutation = `
      mutation CreateDraft($input: CreateDraftInput!) {
        createDraft(input: $input) {
          draft {
            id
            slug
            title
          }
        }
      }
    `;

    const result = await this.graphqlRequest<{
      createDraft: { draft: Draft };
    }>(mutation, { input });
    return result.createDraft.draft;
  }

  async updateDraft(
    draftId: string,
    frontmatter: Frontmatter,
    content: string
  ): Promise<Draft> {
    const input: Record<string, unknown> = {
      id: draftId,
      title: frontmatter.title,
      slug: frontmatter.slug,
      contentMarkdown: content,
      tags: this.buildTagsInput(frontmatter.tags),
      subtitle: frontmatter.subtitle || undefined,
      settings: {
        enableTableOfContent: frontmatter.enableToc === true,
      },
    };

    if (frontmatter.cover) {
      input.coverImageOptions = { coverImageURL: frontmatter.cover };
    }

    const mutation = `
      mutation UpdateDraft($input: UpdateDraftInput!) {
        updateDraft(input: $input) {
          draft {
            id
            slug
            title
          }
        }
      }
    `;

    const result = await this.graphqlRequest<{
      updateDraft: { draft: Draft };
    }>(mutation, { input });
    return result.updateDraft.draft;
  }

  async publishDraft(draftId: string): Promise<Post> {
    const mutation = `
      mutation PublishDraft($input: PublishDraftInput!) {
        publishDraft(input: $input) {
          post {
            id
            slug
            url
            title
          }
        }
      }
    `;

    const result = await this.graphqlRequest<{ publishDraft: { post: Post } }>(
      mutation,
      { input: { draftId } }
    );
    return result.publishDraft.post;
  }

  async createSeries(name: string, slug: string): Promise<Series> {
    const input: Record<string, unknown> = {
      name,
      slug,
      publicationId: this.publicationId,
      sortOrder: 'asc',
    };

    const mutation = `
      mutation CreateSeries($input: CreateSeriesInput!) {
        createSeries(input: $input) {
          series {
            id
            name
            slug
          }
        }
      }
    `;

    const result = await this.graphqlRequest<{
      createSeries: { series: Series };
    }>(mutation, { input });
    return result.createSeries.series;
  }

  async getOrCreateSeries(
    seriesSlug: string,
    seriesName?: string
  ): Promise<Series | null> {
    if (!seriesSlug) return null;

    // First try to find existing series
    let series = await this.getSeriesBySlug(seriesSlug);
    if (series) {
      return series;
    }

    // Use provided name or generate from slug
    const name =
      seriesName ||
      seriesSlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    try {
      series = await this.createSeries(name, seriesSlug);
      return series;
    } catch (error) {
      // If series already exists, try to fetch it
      if (
        error instanceof Error &&
        error.message.includes('already exists')
      ) {
        const publication = await this.getPublication();
        if (publication?.seriesList?.edges) {
          const found = publication.seriesList.edges.find(
            (e) => e.node.slug === seriesSlug
          );
          if (found) {
            return found.node;
          }
        }
      }
      throw error;
    }
  }
}
