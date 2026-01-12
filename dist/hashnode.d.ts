import { Post, Draft, Series, Publication, Frontmatter } from './types';
export declare class HashnodeClient {
    private accessToken;
    private publicationId;
    private publicationHost;
    constructor(accessToken: string, publicationId: string, publicationHost: string);
    private graphqlRequest;
    private buildTagsInput;
    getPublication(): Promise<Publication | null>;
    getPostBySlug(slug: string): Promise<Post | null>;
    getSeriesBySlug(slug: string): Promise<Series | null>;
    getDraftBySlug(slug: string): Promise<Draft | null>;
    publishPost(frontmatter: Frontmatter, content: string, seriesId?: string): Promise<Post>;
    updatePost(postId: string, frontmatter: Frontmatter, content: string, seriesId?: string): Promise<Post>;
    removePost(postId: string): Promise<Post>;
    createDraft(frontmatter: Frontmatter, content: string): Promise<Draft>;
    updateDraft(draftId: string, frontmatter: Frontmatter, content: string): Promise<Draft>;
    publishDraft(draftId: string): Promise<Post>;
    createSeries(name: string, slug: string): Promise<Series>;
    getOrCreateSeries(seriesSlug: string): Promise<Series | null>;
}
