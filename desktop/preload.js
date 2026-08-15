const { contextBridge } = require('electron');

/** Door is open because Junior is installed on this PC. */
contextBridge.exposeInMainWorld('sg16Junior', {
  name: 'Cursor Junior',
  publicName: 'SG16 Personal Developer',
  road: 'pc',
  door: 'open',
  platform: process.platform,
});
