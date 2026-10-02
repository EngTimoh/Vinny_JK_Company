# Frontend Design Invariants & User Preferences

This project follows strict minimalist, modern automotive e-commerce and showcase standards. Adhere to these principles whenever creating, updating, or reviewing HTML, CSS, and JavaScript.

---

## 1. Button & Integration Invariants
- **NEVER add unsolicited third-party buttons to cards**: Specifically, **DO NOT add WhatsApp buttons** or chat pills to service/product cards unless explicitly commanded in the current prompt.
- Floating contact triggers must remain minimal, compact (36px–38px), and non-obtrusive so they never obstruct card actions on mobile viewports.

---

## 2. Card Architecture: "No Card House"
- **Avoid Heavy Boxed Containers**: Never wrap items in bulky multi-layer bunkers with thick borders, heavy backgrounds, deep shadows, and nested padding.
- **Flat & Clean Structure**:
  - Base: Flat surface with subtle translucent fill (`rgba(255, 255, 255, 0.02)`) and hairline border (`1px solid rgba(255, 255, 255, 0.06)`).
  - Radius: Smooth `8px` to `10px`.
  - Padding: Minimal (`0.4rem` desktop, `0.35rem` mobile).
  - Hover: Subtle lift (`translateY(-2px)`) with hairline amber border accent (`rgba(232, 168, 37, 0.35)`).

---

## 3. Mobile Grid & Image Display (Zero Side Voids)
- **Grid Layout**: Always use a **2-column layout on mobile** (`col-6 col-md-4 col-lg-3` or `col-6 col-md-4 col-lg-4`).
- **Gutter**: Use tight gutters on mobile (`row g-2 g-md-3 g-lg-4`) to maximize edge-to-edge space.
- **Image Container**:
  - Use `aspect-ratio: 4 / 3` with `width: 100%` and `overflow: hidden`.
  - Image element: `width: 100%; height: 100%; object-fit: cover; object-position: center;`.
  - **No Side Voids**: Never use `object-fit: contain` inside a wide 1-column mobile card; this creates dark empty voids on the sides.
  - 4:3 matches the native aspect ratio of uploaded vehicle photographs, ensuring edge-to-edge coverage without unnatural vehicle cropping.

---

## 4. Card Information Hierarchy & Typography
Keep card fronts clean, sleek, and uniform:
1. **Micro-Badges**: Overlay badges directly on image corners:
   - Top-left: Discount pill (`-20%`, green `#198754`), Hot/Before/After pill (`HOT`/`BEFORE`/`AFTER`, red `#dc3545`).
   - Top-right: Stock status (`In Stock` / `Out of Stock`).
2. **Title**: Clean Title Case, 2-line clamp (`font-size: 0.82rem – 0.85rem`, `line-height: 1.25`).
3. **Subtitle**: Muted category / service type line directly beneath title (`font-size: 0.70rem`, `color: rgba(255,255,255,0.52)`).
4. **Description**: **Do NOT place paragraph descriptions on card fronts**. Descriptions cause uneven card heights and clutter.
5. **Price**: Compact alignment — crossed-out original price (`0.72rem`) + bold current price (`0.95rem`).
6. **Action**: Single compact action button (`View Details`) + optional small quick-add icon button for in-stock products.

---

## 5. Modal Detail Separation Pattern
- The **Card** is a hook and teaser.
- The **Modal** is the comprehensive showroom:
  - Multi-image carousel with `object-fit: contain; height: 380px; background: #080f18;` so customers can view every vehicle angle uncropped.
  - Complete Markdown description and specifications.
  - Transformation before/after thumbnail gallery.
  - Direct booking and checkout CTAs.

---

## 6. Homepage Preview Rows
- Homepage preview containers (`#servicesPreviewContainer`, `#productsPreviewContainer`) must show an **even count of items** (e.g., 4 items via `slice(0, 4)`).
- This ensures clean 2x2 symmetry on mobile and 1x4 symmetry on desktop without dangling cards.
