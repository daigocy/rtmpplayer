const { ipcMain } = require('electron');
if(ipcMain) {
    module.exports = require("./server");
}
else {
    module.exports = require("./player");
}
