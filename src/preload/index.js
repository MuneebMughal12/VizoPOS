const { contextBridge, ipcRenderer } = require('electron');

// The only bridge between renderer and main. The renderer never sees
// Node, the DB, or the filesystem — just these calls.
contextBridge.exposeInMainWorld('vizo', {
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
  logout: () => ipcRenderer.invoke('auth:logout'),
  changePassword: (currentPassword, newPassword) =>
    ipcRenderer.invoke('auth:change-password', { currentPassword, newPassword }),
});
