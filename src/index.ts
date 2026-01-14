import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { HashnodeClient } from './hashnode';
import { parseFrontmatter, findMarkdownFiles } from './parser';
import { ProcessResult, ActionOutputs, Frontmatter } from './types';

async function processFile(
  client: HashnodeClient,
  filePath: string
): Promise<ProcessResult> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    return { status: 'skipped', reason: 'No frontmatter found' };
  }

  const { frontmatter, content: markdown } = parsed;

  // Validate required fields
  if (!frontmatter.title || !frontmatter.slug) {
    return { status: 'skipped', reason: 'Missing title or slug' };
  }

  // Handle deletion
  if (frontmatter.delete === true) {
    const existingPost = await client.getPostBySlug(frontmatter.slug);
    if (existingPost) {
      await client.removePost(existingPost.id);
      return { status: 'deleted', title: frontmatter.title };
    }
    return { status: 'skipped', reason: 'Post not found for deletion' };
  }

  // Handle draft
  if (frontmatter.saveAsDraft === true) {
    const existingDraft = await client.getDraftBySlug(frontmatter.slug);

    if (existingDraft) {
      const draft = await client.updateDraft(
        existingDraft.id,
        frontmatter,
        markdown
      );
      return { status: 'draft_updated', title: draft.title };
    } else {
      const draft = await client.createDraft(frontmatter, markdown);
      return { status: 'draft_created', title: draft.title };
    }
  }

  // Handle series
  let seriesId: string | undefined;
  if (frontmatter.seriesSlug) {
    const series = await client.getOrCreateSeries(
      frontmatter.seriesSlug,
      frontmatter.seriesName
    );
    if (series) {
      seriesId = series.id;
      core.info(`  Using series: ${series.name}`);
    }
  }

  // Check if post exists
  const existingPost = await client.getPostBySlug(frontmatter.slug);

  if (existingPost) {
    // Update existing post
    const post = await client.updatePost(
      existingPost.id,
      frontmatter,
      markdown,
      seriesId
    );
    return { status: 'updated', title: post.title, url: post.url };
  } else {
    // Check if there's a draft to publish
    const existingDraft = await client.getDraftBySlug(frontmatter.slug);

    if (existingDraft) {
      await client.updateDraft(existingDraft.id, frontmatter, markdown);
      const post = await client.publishDraft(existingDraft.id);
      return {
        status: 'published_from_draft',
        title: post.title,
        url: post.url,
      };
    }

    // Create new post
    const post = await client.publishPost(frontmatter, markdown, seriesId);
    return { status: 'published', title: post.title, url: post.url };
  }
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const accessToken = core.getInput('access-token', { required: true });
    const publicationId = core.getInput('publication-id', { required: true });
    const publicationHost = core.getInput('publication-host');
    const postsDirectory = core.getInput('posts-directory') || 'posts';

    // Validate inputs
    if (!accessToken) {
      throw new Error('access-token is required');
    }

    if (!publicationId) {
      throw new Error('publication-id is required');
    }

    // Determine publication host
    let host = publicationHost;
    if (!host) {
      // Try to infer from publication ID or require explicit input
      core.warning(
        'publication-host not provided. Will attempt to fetch from publication.'
      );
      host = `${publicationId}.hashnode.dev`;
    }

    core.info('Hashnode Publish Action v1.1.0');
    core.info(`Publication host: ${host}`);
    core.info(`Posts directory: ${postsDirectory}`);

    // Initialize client
    const client = new HashnodeClient(accessToken, publicationId, host);

    // Find markdown files
    const files = findMarkdownFiles(postsDirectory);
    core.info(`Found ${files.length} markdown files`);

    if (files.length === 0) {
      core.warning('No markdown files found in the specified directory');
      return;
    }

    // Process each file
    const results: ActionOutputs = {
      published: 0,
      updated: 0,
      deleted: 0,
      drafts_created: 0,
      drafts_updated: 0,
      published_from_draft: 0,
      unchanged: 0,
      skipped: 0,
      failed: 0,
    };

    const processedPosts: Array<{
      file: string;
      result: ProcessResult;
    }> = [];

    for (const file of files) {
      const relativePath = path.relative(process.cwd(), file);

      try {
        const result = await processFile(client, file);
        processedPosts.push({ file: relativePath, result });

        switch (result.status) {
          case 'published':
            core.info(`✓ Published: ${result.title}`);
            core.info(`  URL: ${result.url}`);
            results.published++;
            break;
          case 'updated':
            core.info(`✓ Updated: ${result.title}`);
            core.info(`  URL: ${result.url}`);
            results.updated++;
            break;
          case 'deleted':
            core.info(`✓ Deleted: ${result.title}`);
            results.deleted++;
            break;
          case 'draft_created':
            core.info(`✓ Draft created: ${result.title}`);
            results.drafts_created++;
            break;
          case 'draft_updated':
            core.info(`✓ Draft updated: ${result.title}`);
            results.drafts_updated++;
            break;
          case 'published_from_draft':
            core.info(`✓ Published from draft: ${result.title}`);
            core.info(`  URL: ${result.url}`);
            results.published_from_draft++;
            break;
          case 'unchanged':
            core.info(`- Unchanged: ${relativePath}`);
            results.unchanged++;
            break;
          case 'skipped':
            core.info(`- Skipped: ${relativePath} (${result.reason})`);
            results.skipped++;
            break;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        core.error(`✗ Failed: ${relativePath}`);
        core.error(`  Error: ${errorMessage}`);
        processedPosts.push({
          file: relativePath,
          result: { status: 'failed', error: errorMessage },
        });
        results.failed++;
      }
    }

    // Set outputs
    core.setOutput('published', results.published.toString());
    core.setOutput('updated', results.updated.toString());
    core.setOutput('deleted', results.deleted.toString());
    core.setOutput('failed', results.failed.toString());
    core.setOutput('summary', JSON.stringify(results));

    // Print summary
    core.info('');
    core.info('='.repeat(50));
    core.info('Summary:');
    core.info(`  Published: ${results.published}`);
    core.info(`  Updated: ${results.updated}`);
    core.info(`  Deleted: ${results.deleted}`);
    core.info(`  Drafts created: ${results.drafts_created}`);
    core.info(`  Drafts updated: ${results.drafts_updated}`);
    core.info(`  Published from draft: ${results.published_from_draft}`);
    core.info(`  Unchanged: ${results.unchanged}`);
    core.info(`  Skipped: ${results.skipped}`);
    core.info(`  Failed: ${results.failed}`);

    // Fail the action if there were failures
    if (results.failed > 0) {
      core.setFailed(`${results.failed} post(s) failed to process`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

run();
