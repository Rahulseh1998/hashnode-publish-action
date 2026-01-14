# Reddit Post Draft

## Title (for r/github, r/webdev, r/javascript, r/blogging)

**I built a GitHub Action to publish markdown posts to Hashnode because all existing ones are broken**

---

## Post Body

I wanted to automate publishing blog posts from my GitHub repo to Hashnode. Simple, right?

**The Problem:**

Every existing GitHub Action for Hashnode is broken:
- `OmenApps/publish-github-to-hashnode` - has a bug in action.yml referencing `steps` context incorrectly
- `prettyirrelevant/hashnode-posts-publisher` - the Heroku backend is completely down
- `raunakgurud09/hashnode-publish` - glob pattern handling is broken

I spent hours debugging these before giving up and building my own.

**The Solution:**

I created [hashnode-publish-action](https://github.com/Rahulseh1998/hashnode-publish-action) - a TypeScript-based GitHub Action that actually works.

**Features:**
- ✅ **Create** new posts from markdown files
- ✅ **Update** existing posts (auto-detects by slug)
- ✅ **Delete** posts via frontmatter flag
- ✅ **Draft** support
- ✅ **Series** auto-creation
- ✅ Proper error handling

**Usage is simple:**

```yaml
- uses: Rahulseh1998/hashnode-publish-action@v1
  with:
    access-token: ${{ secrets.HASHNODE_ACCESS_TOKEN }}
    publication-id: ${{ secrets.HASHNODE_PUBLICATION_ID }}
    publication-host: your-blog.hashnode.dev
```

**Frontmatter example:**

```yaml
---
title: "My Post Title"
slug: "my-post-slug"
tags: javascript, tutorial
seriesSlug: "my-series"
enableToc: true
---

Your markdown content here...
```

**Why it's better:**
1. Written in TypeScript with proper types
2. Uses Hashnode's GraphQL API directly (no intermediary services)
3. Detects existing posts and updates them (no duplicates!)
4. Handles series creation automatically
5. Actually maintained and working in 2026

**Links:**
- GitHub: https://github.com/Rahulseh1998/hashnode-publish-action
- Marketplace: [coming soon]

If you're using Hashnode and want to manage your blog via Git, give it a try! Feedback and contributions welcome.

---

**TL;DR:** Built a working GitHub Action for Hashnode because all existing ones are broken. Supports create/update/delete, drafts, and series.
