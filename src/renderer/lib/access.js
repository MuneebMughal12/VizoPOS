// Central place for "what can this user see" — mirrors the permission model
// in the project doc. Full enforcement (incl. main-process guards) lands in
// Phase 7; this keeps Phase 3 compatible: a plain cashier sees only POS.
//
// auth = { user, can } from AuthContext.

export function isOwner(auth) {
  return auth.user?.role === 'owner';
}

// A dashboard appears once a user can see at least one card on it — i.e. they
// have reports, stock or item access. A plain order-taker does not.
export function canSeeDashboard(auth) {
  return (
    isOwner(auth) ||
    auth.can('view_sales_reports') ||
    auth.can('stock_entry') ||
    auth.can('stock_edit') ||
    auth.can('manage_items')
  );
}

// Sidebar visibility per destination. Five areas stay owner-only forever
// (Settings, Staff here; profit reports / backup restore / discount master
// switch are guarded inside their screens).
export function navVisibility(auth) {
  return {
    dashboard: canSeeDashboard(auth),
    pos: isOwner(auth) || auth.can('take_order'),
    history: isOwner(auth) || auth.can('reprint_bill'),
    items: isOwner(auth) || auth.can('manage_items'),
    stock: isOwner(auth) || auth.can('stock_entry') || auth.can('stock_edit'),
    reports: isOwner(auth) || auth.can('view_sales_reports'),
    staff: isOwner(auth),
    settings: isOwner(auth),
  };
}
