# Module graph

| Module | Import từ | Được dùng bởi |
|---|---|---|
| `app/` | `shared/composables`, `shared/ui`, `pages` (lazy) | `main.ts`, `App.vue` |
| `pages/SkuAnalysisPage` | mọi `features/*/index.ts`, `shared/ui`, `shared/lib` | router |
| `features/analysis` | `shared/lib/format` | mọi feature |
| `features/import` | `analysis` (type + store), `shared/lib`, `shared/ui` | page |
| `features/settings` | `analysis` (store, type), `shared/lib/parse`, `shared/ui` | page |
| `features/overview` | `analysis`, `shared/composables`, `shared/lib`, `shared/ui` | page |
| `features/contribution` | `analysis`, `shared/charts`, `shared/composables`, `shared/lib`, `shared/ui` | page |
| `features/inventory` | `analysis`, `shared/charts`, `shared/ui` | page |
| `features/actions` | `analysis`, `shared/charts`, `shared/composables`, `shared/lib`, `shared/ui` | page |
| `features/rules` | `analysis` (THRESHOLDS, type), `shared/lib` | page |
| `shared/*` | chỉ `shared/*` + thư viện ngoài | mọi nơi |

## Luật

- Không feature nào import thẳng file nội bộ của feature khác (chỉ qua `index.ts`).
- `shared/` không import `features/`.
- `features/analysis/engine/*` không import Vue.
- Alias `@/` = `src/`.
