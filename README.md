
# Roadmap Creator - [Planseq](https://wattox00.github.io/planseq)

A brief description of what this project does and who it's for

<video src="assets/demo.mp4" autoplay loop muted playsinline></video>

🔗 [Try the app](https://wattox00.github.io/planseq)

## JSON

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

# AI prompt (if you don't want to mess with the editor)
```
Generate a  `PLACEHOLDER` roadmap serialized in the exact same JSON schema and structural conventions as planseq's app's existing roadmap exports.

ABSOLUTE RULES (DO NOT VIOLATE):
Output
Output ONLY valid JSON
No markdown, comments, or explanations
Root object
Must contain exactly:
exportedAt (ISO timestamp string)
scale (number)
translate (object with numeric x and y)
nodes (object)
Nodes dictionary
Keys MUST be numeric strings: "0", "1", "2", …
Keys MUST be sequential with no gaps
Each key MUST match the node’s id
Node object (NO EXTRA FIELDS)
Each node MUST contain exactly:
id (string, numeric, matches its key)
name (string)
desc (string)
parent (string ID or null)
tasks (array)
childs (array of string IDs)
position (object with numeric x and y)
Tree structure rules
There MUST be exactly one root node with "parent": null
The roadmap MUST be primarily linear/progressive, not a flat category tree
Each node should usually have one child, branching only when necessary
All childs IDs MUST exist in nodes
Each child’s parent MUST correctly reference its parent node
Tasks
Each task MUST contain:
name (string)
link (string, may be empty)
desc (string, may be empty)
completed (boolean, default false)
Layout rules
Positions must be compact and incremental, similar to manually arranged nodes
Avoid extreme coordinate values
Safety rule
If any rule cannot be satisfied, output {} instead of guessing
Treat this as a strict serialization format matching real exports, not a conceptual roadmap.
```

This will give you a generaly fine roadmap, which you can later still edit on the [`EDITOR`](https://wattox00.github.io/planseq) page.
JUST DON'T FORGET TO CHANGE THE `PLACEHOLDER` AT THE START!

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.