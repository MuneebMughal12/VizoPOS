const { contextBridge, ipcRenderer } = require('electron');

// The only bridge between renderer and main. The renderer never sees
// Node, the DB, or the filesystem — just these calls.
contextBridge.exposeInMainWorld('vizo', {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
  logout: () => ipcRenderer.invoke('auth:logout'),
  changePassword: (currentPassword, newPassword) =>
    ipcRenderer.invoke('auth:change-password', { currentPassword, newPassword }),
  settings: {
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    save: (entries) => ipcRenderer.invoke('settings:save', { entries }),
    chooseLogo: () => ipcRenderer.invoke('settings:choose-logo'),
  },
  menu: {
    listCategories: () => ipcRenderer.invoke('menu:categories:list'),
    saveCategory: (payload) => ipcRenderer.invoke('menu:categories:save', payload),
    listAddons: () => ipcRenderer.invoke('menu:addons:list'),
    saveAddon: (payload) => ipcRenderer.invoke('menu:addons:save', payload),
    deleteAddon: (id) => ipcRenderer.invoke('menu:addons:delete', { id }),
    listItems: () => ipcRenderer.invoke('menu:items:list'),
    getItem: (id) => ipcRenderer.invoke('menu:items:get', { id }),
    saveItem: (payload) => ipcRenderer.invoke('menu:items:save', payload),
    deleteItem: (id) => ipcRenderer.invoke('menu:items:delete', { id }),
  },
  images: {
    library: () => ipcRenderer.invoke('images:library'),
    data: (ref) => ipcRenderer.invoke('images:data', { ref }),
    upload: () => ipcRenderer.invoke('images:upload'),
  },
  pos: {
    menu: () => ipcRenderer.invoke('pos:menu'),
    saveOrder: (payload) => ipcRenderer.invoke('pos:save-order', payload),
    holdOrder: (payload) => ipcRenderer.invoke('pos:hold-order', payload),
    getOrder: (id) => ipcRenderer.invoke('pos:get-order', { id }),
    listOrders: (filters) => ipcRenderer.invoke('pos:list-orders', filters),
    voidOrder: (id, reason) => ipcRenderer.invoke('pos:void-order', { id, reason }),
  },
});
