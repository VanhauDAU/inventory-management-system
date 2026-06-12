export const PAGE_PERMISSION_RULES = {
  home: { public: true },
  'system-logout': { public: true },

  'product-list': { any: ['products.view_product'] },
  'product-add': { any: ['products.add_product'] },
  'product-categories': { any: ['categories.view_category'] },
  'product-suppliers': { any: ['suppliers.view_supplier'] },

  'warehouse-list': { any: ['inventory.view_warehouse'] },
  'warehouse-by-product': { any: ['inventory.view_warehousestock', 'products.view_product'] },
  'warehouse-by-location': { any: ['inventory.view_warehouse'] },

  'import-orders': { any: ['inventory.add_stocktransaction'] },
  'export-orders': { any: ['inventory.add_stocktransaction'] },
  'adjustment-orders': { any: ['inventory.add_stocktransaction'] },
  'transaction-history': { any: ['inventory.view_stocktransaction'] },

  'report-overview': { any: ['products.view_product', 'inventory.view_stocktransaction'] },
  'report-low-stock': { any: ['products.view_product'] },
  'report-value': { any: ['products.view_product'] },

  'system-users': { any: ['auth.view_user'] },
  'system-roles': { any: ['auth.view_group'] },
}

export function isSystemAdmin(user) {
  return hasAnyPermission(user, ['auth.view_user', 'auth.view_group'])
}

export function hasAnyPermission(user, permissions = []) {
  if (user?.is_superuser) return true
  const userPermissions = new Set(user?.permissions || [])
  return permissions.some((permission) => userPermissions.has(permission))
}

export function canAccessPage(user, pageKey) {
  const rule = PAGE_PERMISSION_RULES[pageKey]
  if (!rule) return false
  if (rule.public) return true
  if (!user) return false
  if (user.is_superuser) return true
  if (rule.systemAdmin) return isSystemAdmin(user)
  if (rule.any?.length) return hasAnyPermission(user, rule.any)
  return false
}
