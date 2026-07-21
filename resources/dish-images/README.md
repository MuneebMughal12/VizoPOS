# Dish Image Library

Drop dish photo files **directly into this folder** (`resources/dish-images/`).
They appear automatically in the app's image picker (Items → Choose Image) —
no restart needed, the picker rescans on open.

## Naming convention (important — search uses the filename)

- **lowercase**, words separated by **hyphens**, no spaces:
  - `chicken-biryani.jpg`
  - `beef-karahi.png`
  - `seekh-kabab.jpg`
  - `cold-drink.jpg`
- Several photos of the same dish: add a number at the end —
  `chicken-biryani-2.jpg`, `chicken-biryani-3.jpg`
- The picker shows `chicken-biryani-2.jpg` as **"Chicken Biryani"** and
  typing `bir` in the search finds it.
- Use the names customers/cashiers would type: `zinger-burger.jpg` is
  findable, `img_0231.jpg` is not.

## File requirements

- Formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- Recommended: roughly **square**, ~**600×600 px**, under **300 KB** each
  (the POS grid shows them as 150×170 tiles — bigger files just load slower)

The owner's own uploads (via "Upload my own photo" in the app) are stored
separately in `%APPDATA%\VizoPOS\images\dishes\` and also appear in the picker.
