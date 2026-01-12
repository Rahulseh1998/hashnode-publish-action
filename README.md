# Hashnode Publish Action

A GitHub Action to publish markdown posts to Hashnode with full CRUD support. Create, update, and delete posts directly from your GitHub repository.

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Hashnode%20Publish-blue?logo=github)](https://github.com/marketplace/actions/hashnode-publish)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why This Action?

Other Hashnode publishing actions are broken:
- `OmenApps/publish-github-to-hashnode` - has a `steps` context bug
- `prettyirrelevant/hashnode-posts-publisher` - backend is down
- `raunakgurud09/hashnode-publish` - glob pattern handling broken

This action works reliably with:
- **Create** new posts
- **Update** existing posts (detects by slug)
- **Delete** posts
- **Draft** support
- **Series** auto-creation
- Proper error handling

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
| `title` | string | ✅ | Post title |
| `slug` | string | ✅ | URL slug (must be unique) |
| `tags` | string | | Comma-separated tags (max 5) |
| `subtitle` | string | | Subtitle shown below title |
| `cover` | string | | Cover image URL |
| `seriesSlug` | string | | Add to series (auto-creates if needed) |
| `enableToc` | boolean | | Enable table of contents |
| `saveAsDraft` | boolean | | Save as draft instead of publishing |
| `delete` | boolean | | Delete the post from Hashnode |
| `canonicalUrl` | string | | Original article URL (for cross-posting) |
| `disableComments` | boolean | | Disable comments on the post |
| `publishedAt` | string | | Custom publish date (ISO 8601) |

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
enableToc: true
---

Content...
```

The series will be automatically created if it doesn't exist.

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

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `access-token` | ✅ | | Hashnode Personal Access Token |
| `publication-id` | ✅ | | Hashnode Publication ID |
| `publication-host` | | | Your blog host (e.g., `myblog.hashnode.dev`) |
| `posts-directory` | | `posts` | Directory containing markdown files |

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Created by [Rahul Sehrawat](https://github.com/Rahulseh1998)

---

If this action helps you, consider giving it a ⭐ on GitHub!
