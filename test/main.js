

const path = require('path');
const fs = require('fs');

const { app, Menu, ipcMain, BrowserWindow } = require('electron');
const isDarwin = process.platform == 'darwin';

try{
    require('..');
}
catch(e) {
    console.log(e);
}

let mainWindow = null

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} 
else {
    const url = require('url');
    const args = process.argv.filter(arg => arg.indexOf('-') == 0);
    let title = '', icon = '', manifest;

    if (args.length > 0 && args[0].toLocaleLowerCase().indexOf('dev') >= 0) {
        app.commandLine.appendSwitch('--ignore-certificate-errors', 'true')
    }

    try {
        manifest = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json')).toString());
        title = manifest.window.title;
        icon = manifest.window.icon;
        if (isDarwin) app.setName(title);
    } catch (err) {
        title = '';
        console.log('fs read file error');
    }

    app.commandLine.appendSwitch('disable-gpu', true)


    function createWindow(event) {
        Menu.setApplicationMenu(null);
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 1180,
            height: 730,
            minWidth: 1180,
            minHeight: 730,
            title: title,
            icon: path.join(__dirname, icon),
            webPreferences: {
                // preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true,
                enableRemoteModule:true,
                // allowRendererProcessReuse: true,
            }
        })

        mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
            event.preventDefault();
            let windowObj = {
                parent: mainWindow,
                webContents: options.webContents, // use existing webContents if provided
            };
            Object.assign(windowObj, options);
            if (frameName == 'preview') {    //preview modal
                windowObj.fullscreen = true
            } else if (frameName == 'classroom') {
                windowObj.nodeIntegration = false
                windowObj.modal = true
            } 
            const win = new BrowserWindow(windowObj)
            if (!options.webContents) {
                win.loadURL(url) // existing webContents will be navigated automatically
            }
            event.newGuest = win
            const webContents = event.newGuest.webContents;

            if (args.length > 0 && args[0].toLocaleLowerCase().indexOf('dev') >= 0) {
                webContents.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
                    event.preventDefault()
                    callback(true)
                })
            }
            if (process.argv.some(one => one == '--debug')) {
                webContents.openDevTools({mode: 'detach'});
            }
        })

        // and load the index.html of the app.
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'demo.html'),
            protocol: 'file:',
            slashes: true
        }))

        
        mainWindow.webContents.openDevTools({mode: 'detach'});
    }

    ipcMain.on('synchronous-message', (event, arg) => {
        let cmd = arg, params = [];
        if (typeof arg == 'object' && !Array.isArray(arg)) {
            cmd = arg.cmd;
            params = arg.params;
        }
        switch (cmd) {
            case 'argv':
                event.returnValue = args;
                break;
            case 'manifest':
                event.returnValue = manifest;
                break;
            case 'relaunch':
                ipcMain.removeAllListeners();
                app.relaunch({ args: process.argv.slice(1).concat(['--relaunch', ...params]) });
                app.exit(0);
                event.returnValue = '';
                break;
            case 'quit':
                app.exit()
                break;
            default:
                event.returnValue = 'no such command!!'
                break;
        }
    })

    app.on('ready', () => {
        createWindow()
    })

    app.on('window-all-closed', function () {
        app.quit()
    })

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}
