# Hashnode Publish Action

A GitHub Action to publish markdown posts to Hashnode with full CRUD support. Create, update, and delete posts directly from your GitHub repository.

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Hashnode%20Auto%20Publisher-blue?logo=github)](https://github.com/marketplace/actions/hashnode-auto-publisher)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Create** new posts from markdown files
- **Update** existing posts (detects by slug)
- **Delete** posts when needed
- **Draft** support - save posts as drafts
- **Series** auto-creation with custom naming
- **Co-authors** support
- **SEO** metadata (custom meta title/description)
- Proper error handling and detailed logging

## Quick Start

### 1. Get Your Hashnode Credentials

1. **Access Token**: Go to [Hashnode Developer Settings](https://hashnode.com/settings/developer) → Generate new token
2. **Publication ID**: Found in your publication dashboard URL: `hashnode.com/<publication-id>/dashboard`

### 2. Add Secrets to Your Repository

Go to your repository → Settings → Secrets and variables → Actions → New repository secret:
- `HASHNODE_ACCESS_TOKEN`: Your personal access token
- `HASHNODE_PUBLICATION_ID`: Your publication ID

### 3. Create Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to Hashnode

on:
  push:
    branches: [main]
    paths:
      - 'posts/**'
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Publish to Hashnode
        uses: Rahulseh1998/hashnode-publish-action@v1
        with:
          access-token: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
          publication-id: ${{ secrets.HASHNODE_PUBLICATION_ID }}
          publication-host: your-blog.hashnode.dev
          posts-directory: posts
```

### 4. Create Your First Post

Create `posts/my-first-post.md`:

```markdown
---
title: "My First Post"
slug: "my-first-post"
tags: javascript, tutorial
subtitle: "A quick introduction"
cover: https://example.com/cover.png
enableToc: true
---

# Hello World

This is my first post published via GitHub!
```

Push to trigger the workflow!

## Frontmatter Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Post title |
| `slug` | string | Yes | URL slug (must be unique) |
| `tags` | string | No | Comma-separated tags (max 5) |
| `subtitle` | string | No | Subtitle shown below title |
| `cover` | string | No | Cover image URL |
| `seriesSlug` | string | No | Add to series (auto-creates if needed) |
| `seriesName` | string | No | Custom series name (otherwise auto-generated from slug) |
| `enableToc` | boolean | No | Enable table of contents |
| `saveAsDraft` | boolean | No | Save as draft instead of publishing |
| `delete` | boolean | No | Delete the post from Hashnode |
| `canonicalUrl` | string | No | Original article URL (for cross-posting) |
| `disableComments` | boolean | No | Disable comments on the post |
| `publishedAt` | string | No | Custom publish date (ISO 8601) |
| `coAuthors` | string | No | Comma-separated Hashnode usernames |
| `metaTitle` | string | No | Custom SEO title |
| `metaDescription` | string | No | Custom SEO description |

## Examples

### Basic Post

```yaml
---
title: "Getting Started with TypeScript"
slug: "getting-started-typescript"
tags: typescript, javascript, tutorial
---

Your content here...
```

### Post with Series

```yaml
---
title: "React Hooks - Part 1"
slug: "react-hooks-part-1"
tags: react, hooks
seriesSlug: "react-hooks-series"
seriesName: "Mastering React Hooks"
enableToc: true
---

Content...
```

The series will be automatically created with your custom name if it doesn't exist.

### Post with SEO and Co-Authors

```yaml
---
title: "Complete Guide to Machine Learning"
slug: "complete-ml-guide"
tags: machine-learning, ai, python
metaTitle: "Machine Learning Guide 2025 - From Zero to Hero"
metaDescription: "Learn machine learning from scratch with practical examples and code."
coAuthors: "johndoe, janesmith"
---

Content...
```

### Draft Post

```yaml
---
title: "Work in Progress"
slug: "work-in-progress"
saveAsDraft: true
---

This won't be published yet...
```

### Delete a Post

```yaml
---
title: "Old Post to Remove"
slug: "old-post-slug"
delete: true
---
```

### Cross-Posted Article

```yaml
---
title: "My Article"
slug: "my-article"
canonicalUrl: "https://myblog.com/original-post"
---

Content...
```

### Full Example with All Options

```yaml
---
title: "Advanced TypeScript Patterns"
slug: "advanced-typescript-patterns"
tags: typescript, patterns, architecture
subtitle: "Level up your TypeScript skills"
cover: https://example.com/cover.png
seriesSlug: "typescript-mastery"
seriesName: "TypeScript Mastery Series"
enableToc: true
saveAsDraft: false
canonicalUrl: "https://original-blog.com/post"
disableComments: false
publishedAt: "2025-01-15T10:00:00Z"
coAuthors: "collaborator1, collaborator2"
metaTitle: "Advanced TypeScript Patterns | Complete Guide"
metaDescription: "Master advanced TypeScript patterns including generics, mapped types, and more."
---

Your markdown content here...
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `access-token` | Yes | - | Hashnode Personal Access Token |
| `publication-id` | Yes | - | Hashnode Publication ID |
| `publication-host` | No | - | Your blog host (e.g., `myblog.hashnode.dev`) |
| `posts-directory` | No | `posts` | Directory containing markdown files |

## Outputs

| Output | Description |
|--------|-------------|
| `published` | Number of posts published |
| `updated` | Number of posts updated |
| `deleted` | Number of posts deleted |
| `failed` | Number of posts that failed |
| `summary` | JSON summary of all operations |

### Using Outputs

```yaml
- name: Publish to Hashnode
  id: publish
  uses: Rahulseh1998/hashnode-publish-action@v1
  with:
    access-token: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
    publication-id: ${{ secrets.HASHNODE_PUBLICATION_ID }}

- name: Check Results
  run: |
    echo "Published: ${{ steps.publish.outputs.published }}"
    echo "Updated: ${{ steps.publish.outputs.updated }}"
    echo "Failed: ${{ steps.publish.outputs.failed }}"
```

## Directory Structure

Recommended structure:

```
your-repo/
├── .github/
│   └── workflows/
│       └── publish.yml
├── posts/
│   ├── getting-started.md
│   ├── advanced-topics/
│   │   ├── topic-1.md
│   │   └── topic-2.md
│   └── tutorials/
│       └── tutorial-1.md
└── images/
    └── covers/
```

The action recursively finds all `.md` files in the posts directory.

## Supported Content

This action supports all markdown content that Hashnode renders, including:

- **Code blocks** with syntax highlighting
- **Mermaid diagrams** (flowcharts, sequence diagrams, etc.)
- **LaTeX/Math** equations
- **Tables**
- **Images** (via URLs)
- **Embeds** (YouTube, GitHub Gist, CodeSandbox, etc.)

### Embed Syntax

Use Hashnode's embed syntax in your markdown:

```markdown
%[https://www.youtube.com/watch?v=VIDEO_ID]
%[https://gist.github.com/username/gist_id]
%[https://codesandbox.io/s/sandbox-id]
```

## How It Works

1. **Finds** all markdown files in the posts directory
2. **Parses** frontmatter from each file
3. **Checks** if a post with the same slug exists on Hashnode
4. **Creates** new posts or **updates** existing ones
5. **Reports** results with URLs

### Update Detection

Posts are matched by their `slug`. If you change the slug in frontmatter, a new post will be created. To rename a post's URL:

1. Set `delete: true` on the old slug
2. Push to delete it
3. Change the slug to the new value
4. Remove `delete: true`
5. Push to create the new post

## Troubleshooting

### "Missing title or slug"

Ensure your frontmatter has both required fields:

```yaml
---
title: "Your Title"
slug: "your-slug"
---
```

### "Post not found for deletion"

The post with that slug doesn't exist on Hashnode. This is not an error - the delete is simply skipped.

### Rate Limiting

Hashnode has API rate limits. If you have many posts, consider batching updates or using the `workflow_dispatch` trigger for manual control.

### Frontmatter Parsing Issues

- Use quotes around values with special characters
- No tabs in YAML, only spaces
- Tags and coAuthors should be comma-separated strings, not YAML lists

## Changelog

### v1.1.0
- Added `seriesName` for custom series naming
- Added `coAuthors` support for collaborative posts
- Added `metaTitle` and `metaDescription` for SEO optimization
- Improved settings sync on post updates
- Better tag parsing with empty value handling

### v1.0.0
- Initial release
- Full CRUD support for posts
- Draft management
- Series auto-creation
- Cover images and canonical URLs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Created by [Rahul Sehrawat](https://github.com/Rahulseh1998)

---

If this action helps you, consider giving it a star on GitHub!
