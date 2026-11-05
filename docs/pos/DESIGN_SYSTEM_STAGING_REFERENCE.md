# Basic Diet POS — Design System spec (Staging reference)

## Provenance
- Current Dashboard CSS: `src/index.css` on `codex/pos-staging-preview`. All colors below are approximate sRGB conversions of its existing OKLCH theme variables; do not assert they equal an unseen official print brand manual.
- Approved logo source to use after visual validation: Google Drive folder [الشعار](https://drive.google.com/drive/folders/1A6QAwP2xpVA6MKC2WQDjyxn2_NK_IebS); includes `Logo-High-Qualty.png` and `Logo-white.png`. Never replace the official logo with an AI-generated mark.
- Editable Figma design target: https://www.figma.com/design/Bf2Iaf0EzgGrjSHPHLpJ3y
- **Figma source sync blocked**: connected Starter-plan MCP tool quota reached after creating the file. Figma file contains no shipped component library yet; do not mark design-system delivery complete.

## Foundational tokens
| Token | Value | Source |
|---|---|---|
| `color/brand/primary` | `#497D00` | `--primary` |
| `color/brand/dark` | `#3C6300` | dark `--primary` |
| `color/brand/onPrimary` | `#F7FEE7` | `--primary-foreground` |
| `color/text/primary` | `#0C090C` | `--foreground` |
| `color/surface/primary` | `#FFFFFF` | `--card` |
| `color/surface/muted` | `#F3F1F3` | `--muted` |
| `color/border/default` | `#E7E4E7` | `--border` |
| `color/text/muted` | `#79697B` | `--muted-foreground` |
| `radius/card` | `14px` | `--radius` 0.875rem |
| `touch/min` | `44px` | accessible tap target design target |

Spacing scale: `4 / 8 / 12 / 16 / 24 / 32` pixels. Arabic-first RTL; optional Latin numerals for SAR amounts and tablet/desktop cashiers. Avoid high-saturation decorative UI and large imagery on time-critical cashier routes.

## Components
- `Button/Primary,Secondary,Destructive,Disabled`: 48px primary touch targets.
- `Navigation/Section,NavItem`: fixed POS sections, avoid exposing app-menu settings to cashier.
- `Selector/Channel`: restaurant/HungerStation/Keeta and future channels dynamically.
- `Selector/Variant`: single product, 100/150/200 grams, channel price; no carb selector.
- `Card/Product`, `Card/CartLine`, `Field/Search`, `Field/Money`, `Card/Metric`.
- `Dialog/Reprice`: original and new totals with explicit employee confirmation.
- `Dialog/Publish`: admin-only draft/publish revision check, no app-menu mutation.
- `Table/BulkPrices`: channel selector and editable product-variant rows with draft save.
- `Status/Badge`: Paid vs Cash for app orders; external cash not counted in restaurant drawer until separately collected.
- `Receipt/Print`: withheld until ZATCA and accountant approval.

## Screens aligned with PRD
1. `POS / Sale`: product-first category filters, visualized prices and cart; checkout remains disabled in current preview.
2. `POS / Menu management`: independent product catalog, draft, bulk prices, channel-specific prices, publish.
3. `POS / App order`: manual input and Paid/Cash, external order ID optional; no separate delivery-collection page.
4. `POS / Subscriptions`: direct official backend integration only; staff paid renewal not yet available.
5. `POS / Daily closing`: one immutable close per business day, cross-source financial report.
6. `POS / Refunds`: manager-only full/partial audit and external settlement recording.

## Design release checklist
- Official logo compared visually with current approved materials.
- Tablet 1024px, desktop 1366px, mobile 390px; RTL and keyboard navigation.
- Contrast AA for cashier text and status, no meaning conveyed only by color.
- Invoice success requires backend transaction result, not a printer success toast.
- All financial actions disabled in Figma/mockups and Staging until server-side safety gates pass.
