-- ============================================================
-- VIZO POS — by VIZO TECH — COMPLETE SQLITE SCHEMA  (v1.0)
-- Electron + better-sqlite3 | Fully offline | Single file DB
-- NOTE: seed rows (schema_version, admin user) are inserted by
-- the app code at first run, so the password gets a real hash.
-- ============================================================

-- ------------------------------------------------------------
-- 1. APP META & LICENSE  (activation, schema version)
-- ------------------------------------------------------------
CREATE TABLE app_meta (
    key         TEXT PRIMARY KEY,          -- 'schema_version', 'machine_code', 'activated', 'activation_code', 'installed_at'
    value       TEXT
);

-- ------------------------------------------------------------
-- 2. SETTINGS  (Business / Billing / Printer / Backup — sab yahan)
-- key-value: UI mein sections mein dikhega, DB mein simple
-- ------------------------------------------------------------
CREATE TABLE settings (
    key         TEXT PRIMARY KEY,
    value       TEXT
);

-- ------------------------------------------------------------
-- 3. USERS & PERMISSIONS  (flexible checkbox system)
-- ------------------------------------------------------------
CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL UNIQUE,
    full_name       TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'cashier',   -- 'owner' | 'manager' | 'cashier' (sirf default-permissions ka shortcut)
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Har checkbox = ek row. Owner ke liye rows ki zaroorat nahi (owner = sab kuch).
CREATE TABLE user_permissions (
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission      TEXT NOT NULL,      -- 'take_order','give_discount','void_order','reprint_bill',
                                        -- 'view_sales_reports','stock_entry','stock_edit',
                                        -- 'manage_items','day_end_closing'
    PRIMARY KEY (user_id, permission)
);

-- ------------------------------------------------------------
-- 4. MENU  (categories, items, variants, add-ons)
-- ------------------------------------------------------------
CREATE TABLE categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     INTEGER REFERENCES categories(id),
    name            TEXT NOT NULL,
    price           REAL,                       -- NULL agar variants hain (price variant se aayegi)
    image           TEXT,                       -- image file ka naam (app ke images folder mein)
    has_variants    INTEGER NOT NULL DEFAULT 0,
    -- countable stock (botal/can) — sirf jin pe ON ho:
    track_stock     INTEGER NOT NULL DEFAULT 0,
    stock_qty       REAL NOT NULL DEFAULT 0,
    low_stock_level REAL NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE item_variants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,                  -- 'Simple' | 'Chicken' | 'Beef'
    price       REAL NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE addons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,                  -- 'Raita', 'Extra Chicken'
    price       REAL NOT NULL,
    is_active   INTEGER NOT NULL DEFAULT 1
);

-- Kaunsa addon kis item pe dikhe (mapping). Agar item ki koi row nahi = us pe koi addon nahi.
CREATE TABLE item_addons (
    item_id     INTEGER NOT NULL REFERENCES items(id)  ON DELETE CASCADE,
    addon_id    INTEGER NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, addon_id)
);

-- ------------------------------------------------------------
-- 5. INGREDIENTS & RECIPES  (kachcha maal + formula)
-- ------------------------------------------------------------
CREATE TABLE ingredients (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,              -- 'Chawal', 'Chicken', 'Ghee'
    unit            TEXT NOT NULL,              -- 'kg' | 'liter' | 'pcs'
    current_stock   REAL NOT NULL DEFAULT 0,    -- cached balance (ledger se sync)
    low_stock_level REAL NOT NULL DEFAULT 0,
    avg_cost        REAL NOT NULL DEFAULT 0,    -- per unit — profit report ke liye
    is_active       INTEGER NOT NULL DEFAULT 1
);

-- Recipe line: dish/variant/addon → ingredient + miqdaar
-- Rule: variant_id set hai to us variant ki recipe; warna item_id ki; addon_id addon ki.
CREATE TABLE recipe_lines (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id         INTEGER REFERENCES items(id)         ON DELETE CASCADE,
    variant_id      INTEGER REFERENCES item_variants(id) ON DELETE CASCADE,
    addon_id        INTEGER REFERENCES addons(id)        ON DELETE CASCADE,
    ingredient_id   INTEGER NOT NULL REFERENCES ingredients(id),
    qty             REAL NOT NULL               -- e.g. 0.25 (kg per 1 plate)
);

-- ------------------------------------------------------------
-- 6. STOCK LEDGER  (har harkat ka record — purchase/sale/wastage)
-- current_stock isi ledger ka total hai. Chori pakarne ka raaz yahin hai.
-- ------------------------------------------------------------
CREATE TABLE stock_movements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id   INTEGER REFERENCES ingredients(id),  -- ingredient ke liye
    item_id         INTEGER REFERENCES items(id),        -- countable item ke liye
    change_qty      REAL NOT NULL,              -- purchase: +50 | sale: -0.75 | wastage: -1
    movement_type   TEXT NOT NULL,              -- 'purchase' | 'sale' | 'wastage' | 'adjustment'
    unit_cost       REAL,                       -- purchase pe bharo — profit ke liye
    ref_order_id    INTEGER,                    -- sale wali movement kis order se aayi
    note            TEXT,                       -- adjustment/wastage ki wajah
    user_id         INTEGER NOT NULL REFERENCES users(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_movements_date ON stock_movements(created_at);
CREATE INDEX idx_movements_ing  ON stock_movements(ingredient_id);

-- ------------------------------------------------------------
-- 7. ORDERS  (asal kaam)
-- Naam/price snapshot save hote hain — baad mein price badle to purane bill na badlein
-- ------------------------------------------------------------
CREATE TABLE orders (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no          TEXT NOT NULL UNIQUE,     -- settings ke format se: 'KK-0451'
    token_no          INTEGER,                  -- Savour-style token (roz reset, dono slips pe bara chhapta hai)
    business_date     TEXT,                     -- token reset ke liye (reset time settings se, default 05:00)
    order_type        TEXT NOT NULL DEFAULT 'dine_in',  -- 'dine_in' | 'takeaway' | 'delivery'
    table_no          TEXT,
    customer_name     TEXT,
    customer_phone    TEXT,
    subtotal          REAL NOT NULL DEFAULT 0,
    discount_percent  REAL NOT NULL DEFAULT 0,
    discount_amount   REAL NOT NULL DEFAULT 0,
    tax_amount        REAL NOT NULL DEFAULT 0,
    service_charge    REAL NOT NULL DEFAULT 0,
    delivery_charge   REAL NOT NULL DEFAULT 0,
    grand_total       REAL NOT NULL DEFAULT 0,
    ingredient_cost   REAL NOT NULL DEFAULT 0,  -- order save pe recipes se calculate — profit report yahin se
    status            TEXT NOT NULL DEFAULT 'paid',   -- 'paid' | 'pending' | 'void'
    void_reason       TEXT,
    void_by           INTEGER REFERENCES users(id),
    created_by        INTEGER NOT NULL REFERENCES users(id),
    created_at        TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_orders_date ON orders(created_at);

CREATE TABLE order_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id         INTEGER REFERENCES items(id),
    variant_id      INTEGER REFERENCES item_variants(id),
    item_name       TEXT NOT NULL,              -- snapshot: 'Biryani'
    variant_name    TEXT,                       -- snapshot: 'Chicken'
    qty             REAL NOT NULL,
    unit_price      REAL NOT NULL,
    line_total      REAL NOT NULL
);

CREATE TABLE order_item_addons (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id   INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    addon_id        INTEGER REFERENCES addons(id),
    addon_name      TEXT NOT NULL,              -- snapshot: 'Raita'
    qty             REAL NOT NULL DEFAULT 1,
    price           REAL NOT NULL
);

-- ------------------------------------------------------------
-- 8. DAY CLOSING  (din band karna, cash ka hisab)
-- ------------------------------------------------------------
CREATE TABLE day_closings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    closing_date    TEXT NOT NULL UNIQUE,       -- '2026-07-21'
    total_orders    INTEGER NOT NULL,
    total_sales     REAL NOT NULL,
    total_discount  REAL NOT NULL,
    cash_counted    REAL,                       -- ginti wala cash
    difference      REAL,                       -- system vs counted farak
    closed_by       INTEGER NOT NULL REFERENCES users(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ------------------------------------------------------------
-- 9. AUDIT LOG  (kis ne kya kiya — har hasas kaam ka record)
-- ------------------------------------------------------------
CREATE TABLE audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    action      TEXT NOT NULL,          -- 'order_void','discount_given','stock_edit','price_change',
                                        -- 'item_delete','settings_change','restore_backup','login'
    entity      TEXT,                   -- 'order' | 'ingredient' | 'item' | 'setting'
    entity_id   INTEGER,
    details     TEXT,                   -- 'Chawal 50kg -> 45kg' | 'Discount 10% on KK-0451'
    created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX idx_audit_date ON audit_log(created_at);
