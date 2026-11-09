# [Planseq](https://wattox00.github.io/planseq) - Roadmap Creator and Viewer

[![Website](https://img.shields.io/badge/website-online-success?style=for-the-badge&logo=github)](https://wattox00.github.io/planseq)
[![Prompt](https://img.shields.io/badge/help-ai_prompt-blue?style=for-the-badge)](#ai-prompt)
![Status](https://img.shields.io/badge/status-stable-blue?style=for-the-badge)
[![License](https://img.shields.io/github/license/wattox00/todol?style=for-the-badge)](https://github.com/WattoX00/planseq/blob/main/LICENSE)

[demo](https://github.com/user-attachments/assets/5448a532-423c-4ffa-b9d9-d312d83c925d)

# [Try the app](https://wattox00.github.io/planseq)

## 🔑 JSON

<details>
<summary>Click to expand</summary>

This document describes the structure of a JSON export representing a roadmap with hierarchical nodes, tasks, and visual layout metadata.

## Typical use cases:

- Learning roadmaps
- Skill trees
- Progress tracking
- Visual knowledge maps

## Root Object

The root object contains global metadata and all nodes in the map.

| Field        | Type                | Description                                |
| ------------ | ------------------- | ------------------------------------------ |
| `exportedAt` | `string` (ISO 8601) | Timestamp of when the export was generated |
| `scale`      | `number`            | Zoom level of the map                      |
| `translate`  | `object`            | Global pan/offset of the map               |
| `nodes`      | `object`            | Collection of all nodes, keyed by node ID  |


## Translate Object

Defines the global viewport translation.

| Field | Type     | Description       |
| ----- | -------- | ----------------- |
| `x`   | `number` | Horizontal offset |
| `y`   | `number` | Vertical offset   |

## Nodes Collection

`nodes` is an object acting as a dictionary of node definitions.

- Keys are string IDs
- Values are Node objects
- Hierarchy is defined via `parent` and `childs`

```
nodes: {
  [id: string]: Node
}
```

## Node Object

A node represents a topic, level, or milestone in the learning path.

| Field      | Type             | Description                            |
| ---------- | ---------------- | -------------------------------------- |
| `id`       | `string`         | Unique identifier                      |
| `name`     | `string`         | Display name                           |
| `desc`     | `string`         | Optional description                   |
| `parent`   | `string \| null` | Parent node ID (`null` for root nodes) |
| `tasks`    | `Task[]`         | Tasks associated with the node         |
| `childs`   | `string[]`       | IDs of direct child nodes              |
| `position` | `object`         | Visual position on the canvas          |

## Notes

- Nodes may have multiple children

- Multiple root nodes are supported

- `parent` and `childs` together define the hierarchy

## Position Object

Controls where the node appears in the visual layout.

| Field | Type     | Description         |
| ----- | -------- | ------------------- |
| `x`   | `number` | Horizontal position |
| `y`   | `number` | Vertical position   |

## Tasks Array

Tasks represent actionable learning items within a node.

| Field       | Type      | Description                        |
| ----------- | --------- | ---------------------------------- |
| `name`      | `string`  | Task title                         |
| `link`      | `string`  | Optional reference or resource URL |
| `desc`      | `string`  | Optional task description          |
| `completed` | `boolean` | Completion status                  |

## Structural Characteristics

- Supports tree-like learning paths

- Allows progress tracking at the task level

- Visual state is embedded alongside content

- Suitable for persistence and rehydration of a visual roadmap

## Conceptual Model

```
Export
 ├─ Viewport
 │   ├─ scale
 │   └─ translate (x, y)
 └─ Nodes
     ├─ Hierarchy (parent / childs)
     ├─ Metadata (name, desc)
     ├─ Tasks (progress)
     └─ Layout (position)
```

</details>

## AI prompt
### (if you don't want to mess with the editor)

> [!CAUTION]
> This will give you a generally fine roadmap, which you can later still edit on the [`EDITOR`](https://wattox00.github.io/planseq/menus/Editor/editor.html) page.
> JUST DON'T FORGET TO CHANGE THE `PLACEHOLDER` AT THE START!

```
Create a useful, well-structured `PLACEHOLDER` roadmap for Planseq. Cover the important concepts in a sensible learning or progression order, with enough detail to be actionable.

OUTPUT FORMAT
- Output ONLY one valid JSON object. Do not include markdown, comments, or explanations.
- Match this exact root schema, with no extra fields:
  - `exportedAt`: ISO 8601 timestamp string
  - `scale`: number; use 1
  - `translate`: object with numeric `x` and `y`; use 0 for both
  - `nodes`: object containing the nodes

NODE SCHEMA
- Use sequential numeric string keys starting at `"0"` with no gaps. Each key must equal that node's `id`.
- Each node must have exactly these fields:
  - `id`: numeric string matching its key
  - `name`: concise node title
  - `desc`: brief, specific explanation of the topic or milestone
  - `parent`: parent node ID, or `null` for the root
  - `tasks`: array of tasks
  - `childs`: array of direct child node IDs
  - `position`: object with numeric `x` and `y`
- Each task must have exactly these fields:
  - `name`: clear, actionable task
  - `link`: relevant, known URL, or `""` if you cannot provide a reliable one
  - `desc`: brief detail, or `""` if unnecessary
  - `completed`: `false`

ROADMAP STRUCTURE
- Create exactly one root node. Make the roadmap a connected tree, not a list of unrelated categories.
- Organize it as a clear progression, but use branches to show parallel topics, alternatives, or related subskills where appropriate. Do not force everything into one long chain, and do not create branches just for decoration.
- Use a sensible depth: group related tasks under focused nodes, and split a node when its scope becomes too broad.
- Every child ID in `childs` must exist, and each child's `parent` must point back to that node. Each non-root node must appear exactly once as a child.
- Give each node a small set of useful tasks (usually 2-5); avoid vague or duplicate tasks. Keep titles and descriptions concise enough to scan in the UI.

SCREEN LAYOUT
- `position.x` and `position.y` are the node's top-left coordinates in canvas pixels, not its center.
- Lay out the tree in a clear, consistent direction (top-to-bottom or left-to-right). Put the root at the beginning, descendants in later rows or columns, and sibling branches side by side.
- Plan for nodes to be about 220 px wide. Leave at least 40 px between neighboring nodes and enough vertical space for clear separation; keep nodes and connector lines from overlapping.
- Align positions to a consistent 20 px grid. Keep spacing between levels consistent, align related siblings, and balance branches around their parent instead of stacking every node on one straight line.
- Keep the full roadmap reasonably compact and within positive canvas coordinates. Start around x=60, y=60; do not rely on zoom or pan to make nodes visible.

Check the JSON syntax, schema, references, hierarchy, and layout before responding. Never invent fields or IDs; do not return `{}` as a fallback.
```

## ❤️ Support

If this project saved you time, taught you something, or made your day a little easier,
you can support its development here:

👉 **[Buy me a coffee via PayPal](https://www.paypal.com/paypalme/wattox)**

Your support helps keep the project:
- Actively maintained
- Continuously improved
- Free and open source

Thanks for being part of the community 🤝

## 📄 License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for full details.
