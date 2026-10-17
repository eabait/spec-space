---
title: Example architecture
status: draft
---

# A local specification workspace

SpecSpace keeps **Markdown files** at the center of your work.

## The flow

```mermaid
flowchart LR
  A[Local folder] --> B[Source editor]
  B --> C[Markdown preview]
  C --> D[Clearer decisions]
```

## Requirements

- [x] Open a local folder
- [x] Edit Markdown source
- [x] Preview diagrams
- [ ] Review with your team using your existing Git workflow

| Concern         | Approach                   |
| --------------- | -------------------------- |
| Storage         | Local UTF-8 Markdown       |
| Version control | Your existing Git workflow |
| Ownership       | Your files, your folders   |

<!-- Comments and frontmatter remain in the source. -->

Read the [requirements](Requirements.md).
