'use strict';

const pkg = require('./package.json');
let options;
if (pkg.hasOwnProperty("NRelectron")) { options = pkg["NRelectron"] }
// Setup user directory and flowfile (if editable)
var userdir = __dirname;

// Some settings you can edit if you don't set them in package.json
//console.log(options)
const editable = true;      // set this to false to create a run only application - no editor/no console
const allowLoadSave = true; // set to true to allow import and export of flow file
const showMap = true;       // set to true to add Worldmap to the menu
const kioskMode = false;   // set to true to start in kiosk mode
const addNodes = true;      // set to false to block installing extra nodes
let flowfile = 'electronflow.json'; // default Flows file name - loaded at start
const urldash = "/ui/#/0"             // url for the dashboard page
const urledit = "/red";             // url for the editor page
const urlconsole = "/console.htm";  // url for the console page
const urlmap = "/worldmap";         // url for the worldmap
const nrIcon = "nodered.png"        // Icon for the app in root dir (usually 256x256)
let urlStart;                       // Start on this page
if (options.start.toLowerCase() === "editor") { urlStart = urledit; }
else if (options.start.toLowerCase() === "map") { urlStart = urlmap; }
else { urlStart = urledit }


// TCP port to use
//const  
/* var a;
a = Math.random() * 16383 + 49152         */            // fix it if you like
const listenPort = "18880";   // or random ephemeral port

const os = require('os');
var fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const express = require("express");
const electron = require('electron');
const isDev = require('electron-is-dev');
const { app, Menu } = electron;
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
var RED = require("node-red");
const { createUnparsedSourceFile } = require('typescript');
const { contains } = require('jquery');
const { element } = require('protractor');
const { dirname } = require('logic-solver');
var red_app = express();


// Add a simple route for static content served from 'public'
red_app.use("/", express.static("web"));
//red_app.use(express.static(__dirname +"/public"));

// Create a server
var server = http.createServer(red_app);

var blob = "ciao"




//function to analyse types of elements presented in the file
/* function analyseFlowFile(userdir) {
    var paths = userdir.toString();
    var arrayTypes = new Array();
    var arrayMQTT = new Array();

    var arrayMQTTBroker = [];


    fs.readFile(paths, 'utf-8', (err, data) => {
        try {
            var flo = JSON.parse(data);
            if (Array.isArray(flo) && (flo.length > 0)) {

                //  console.log("il flusso è ",(flo))

                for (var i = 0; i < flo.length; i++) {
                    arrayTypes[i] = flo[i] //save all the differents elements in the file
                    //  console.log("Array", arrayTypes[i]) 
                }

                //search for mqtt-broker
                var k = 0;
                for (var i = 0; i < flo.length; i++) {
                    if (arrayTypes[i].type == "mqtt-broker") {
                        arrayMQTTBroker[k] = arrayTypes[i];
                        k++;
                    }
                    //  console.log(arrayMQTTBroker[i])
                }

                //  console.log(arrayMQTTBroker.length)
                //search for all mqtt nodes
                var j = 0;
                for (var i = 0; i < flo.length; i++) {
                    if (arrayTypes[i].type == "mqtt in") {
                        arrayMQTT[j] = arrayTypes[i];
                        // console.log("mqtt e':", arrayMQTT[j])
                        j++;
                    }
                }

                //   console.log(arrayMQTT.length)
                //search for all the mqtt nodes that are connected with mqtt-broker


                arrayMQTTBroker.map(x => {
                    x.mqttnodes = [[]]
                })

                for (var i = 0; i < arrayMQTT.length; i++) {
                    var l = 0;
                    for (var j = 0; j < arrayMQTTBroker.length; j++) {
                        if (arrayMQTT[i].broker == arrayMQTTBroker[j].id) {
                            arrayMQTTBroker[j].mqttnodes[l] = arrayMQTT[i].id //ogni nodo mqttbroker ora ha i suoi nodi figli indicizzati
                            l++;
                        }
                    }
                    //   console.log(arrayMQTTBroker[i])
                }
                var legh = 5
                ipc.on('prova2', () => {
                    mainWindow.webContents.send('store-data', legh);
                });
            }

            else {
                dialog.showErrorBox("Error", "Failed to parse flow file.\n\n  " + flo + ".\n\nAre you sure it's a flow file ?");
                console.log(err);
            }
        }
        catch (e) {
            dialog.showErrorBox("Error", "Failed to load flow file.\n\n  " + e);
            console.log(e);
        }
    })

    // console.log("il file è", flowfile2)
}
 */
if (editable) {
    // if running as raw electron use the current directory (mainly for dev)
    if (process.argv[1] && (process.argv[1] === "main.js")) {
        userdir = __dirname;
        if ((process.argv.length > 2) && (process.argv[process.argv.length - 1].indexOf(".json") > -1)) {
            if (path.isAbsolute(process.argv[process.argv.length - 1])) {
                flowfile = process.argv[process.argv.length - 1];
            }
            else {
                flowfile = path.join(process.cwd(), process.argv[process.argv.length - 1]);
            }
        }
    }
    else { // We set the user directory to be in the users home directory...
        userdir = os.homedir() + '/.node-red';
        if (!fs.existsSync(userdir)) {
            fs.mkdirSync(userdir);
        }
        if ((process.argv.length > 1) && (process.argv[process.argv.length - 1].indexOf(".json") > -1)) {
            if (path.isAbsolute(process.argv[process.argv.length - 1])) {
                flowfile = process.argv[process.argv.length - 1];
            }
            else {
                flowfile = path.join(process.cwd(), process.argv[process.argv.length - 1]);
            }
        }
        else {
            if (!fs.existsSync(userdir + "/" + flowfile)) {
                fs.writeFileSync(userdir + "/" + flowfile, fs.readFileSync(__dirname + "/" + flowfile));
            }
            let credFile = flowfile.replace(".json", "_cred.json");
            if (fs.existsSync(__dirname + "/" + credFile) && !fs.existsSync(userdir + "/" + credFile)) {
                fs.writeFileSync(userdir + "/" + credFile, fs.readFileSync(__dirname + "/" + credFile));
            }
        }
    }
}

/*
console.log("CWD",process.cwd());
console.log("DIR",__dirname);
console.log("UserDir :",userdir);
console.log("FlowFile :",flowfile);
console.log("PORT",listenPort); */

// Keep a global reference of the window objects, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let conWindow;
let appWindow;
let deviceWindow;
let logBuffer = [];
let logBuffer2 = ["a", "b", "c"];
let logLength = 250;    // No. of lines of console log to keep.
const levels = ["", "fatal", "error", "warn", "info", "debug", "trace"];
ipc.on('clearLogBuffer', function () { logBuffer = []; });
var config = [];
ipc.on('clearLogBuffer', function (event, arg) { console.log(arg) });


// Create the settings object - see default settings.js file for other options
var settings = {
    uiHost: "localhost",    // only allow local connections, remove if you want to allow external access
    httpAdminRoot: "/red",  // set to false to disable editor and deploy
    httpNodeRoot: "/",
    userDir: userdir,
    httpNodeCors: {
        origin: "*",
        methods: "GET,PUT,POST,DELETE"
    },
    flowFile: flowfile,
    editorTheme: { projects: { enabled: false }, palette: { editable: addNodes } },    // enable projects feature
    functionGlobalContext: {},    // enables global context - add extras ehre if you need them
    logging: {
        websock: {
            level: 'info',
            metrics: false,

            handler: function () {
                return function (msg) {
                    if (editable) {  // No logging if not editable
                        var ts = (new Date(msg.timestamp)).toISOString();
                        ts = ts.replace("Z", " ").replace("T", " ");
                        var line = "";
                        if (msg.type && msg.id) {
                            line = ts + " : [" + levels[msg.level / 10] + "] [" + msg.type + ":" + msg.id + "] " + msg.msg;
                        }
                        else {
                            line = ts + " : [" + levels[msg.level / 10] + "] " + msg.msg;
                        }
                        logBuffer.push(line);

                        if (conWindow) { conWindow.webContents.send('debugMsg', line); }
                        if (logBuffer.length > logLength) { logBuffer.shift(); }
                    }
                }
            }
        }
    }
}

if (!editable) {
    settings.httpAdminRoot = false;
    settings.readOnly = true;
}



// Initialise the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red (if editable)
if (settings.httpAdminRoot !== false) {
    red_app.use(settings.httpAdminRoot, RED.httpAdmin);
}

// Serve the http nodes UI from /
red_app.use(settings.httpNodeRoot, RED.httpNode);




// Create the Application's main menu
const template = [{
    label: "View",
    submenu: [
        {
            label: 'Create a new application',
            accelerator: "Shift+CmdOrCtrl+H",
            click() { createNewApp(); }
        },
        /* {
            label: 'Devices dashboard',
            accelerator: "Shift+CmdOrCtrl+D",
            click() { deviceAnalisys(); }
        }, */
        {
            label: 'Import Flow',
            accelerator: "Shift+CmdOrCtrl+O",
            click() { openFlow(); }
        },
        {
            label: 'Save Flow',
            accelerator: "Shift+CmdOrCtrl+S",
            click() { saveFlow(); }
        },
        { type: 'separator' },
        {
            label: 'Console',
            accelerator: "Shift+CmdOrCtrl+C",
            click() { createConsole(); }
        },
        {
            label: 'Dashboard',
            accelerator: "Shift+CmdOrCtrl+D",
            click() { mainWindow.loadURL("http://localhost:" + listenPort + urldash); }
        },
        {
            label: 'Worldmap',
            accelerator: "Shift+CmdOrCtrl+M",
            click() { mainWindow.loadURL("http://localhost:" + listenPort + urlmap); }
        },
        { type: 'separator' },
        { type: 'separator' },
        {
            label: 'Documentation',
            click() { electron.shell.openExternal('https://nodered.org/docs') }
        },
        {
            label: 'Flows and Nodes',
            click() { electron.shell.openExternal('https://flows.nodered.org') }
        },
        {
            label: 'Discourse Forum',
            click() { electron.shell.openExternal('https://discourse.nodered.org/') }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'quit' }
    ]
}];

if (!showMap) { template[0].submenu.splice(6, 1); }

if (!editable) {
    template[0].submenu.splice(3, 1);
    template[0].submenu.splice(4, 1);
}

if (!allowLoadSave) { template[0].submenu.splice(0, 2); }

// Top and tail menu on Mac
if (process.platform === 'darwin') {
    template[0].submenu.unshift({ type: 'separator' });
    template[0].submenu.unshift({ label: "About " + options.productName || "FloWare Framework", selector: "orderFrontStandardAboutPanel:" });
    template[0].submenu.unshift({ type: 'separator' });
    template[0].submenu.unshift({ type: 'separator' });
}

// Add Dev menu if in dev mode
if (isDev) {
    template.push({
        label: 'Development',
        submenu: [
            {
                label: 'Editor',
                accelerator: "Shift+CmdOrCtrl+E",
                click() { mainWindow.loadURL(`http://localhost:${listenPort}${urledit}`); }
            },

            {
                label: 'Refresh', accelerator: 'CmdOrCtrl+R',
                click(item, focusedWindow) {
                    if (focusedWindow) focusedWindow.reload()
                }
            },
            {
                label: 'Developer console',
                accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                click(item, focusedWindow) {
                    if (focusedWindow) focusedWindow.webContents.toggleDevTools()
                }
            }
        ]
    })
}


async function saveFlow() {
    const fileName = __dirname;
    console.log(fileName)
    const options = {
        title: 'flow1',
        defaultPath: fileName,
        filters: [
            { name: 'json', extensions: ['json'] }
        ],
    };
    var pathh = dialog.showSaveDialogSync(options);
    findPath(pathh);
}


function findPath(pathh) {
    if (pathh) {
        var flo = JSON.stringify(RED.nodes.getFlows());
        var indexinizio = flo.search("flows");
        var indexfine = flo.search("}]")
        var flow = flo.slice(indexinizio + 7, indexfine + 2) //file settato correttamente

        //qui si aggiunge la parte dei dati analizzati nello stesso file
        //write a file 
        fs.writeFile(pathh, flow, function (err) {
            if (err) {
                dialog.showErrorBox('Error', err);
            }
            else {

                dialog.showMessageBox({
                    icon: nrIcon,
                    message: "Flow file saved as\n\n" + pathh,
                    buttons: ["OK"]
                });
            }
        });
    }
}


async function openFlow() {
    const options = {
        filters: [
            { name: 'json', extensions: ['json'] }
        ],
    };
    var filePaths;
    filePaths = dialog.showOpenDialogSync(null, options);

    await takeFlow(filePaths);
    await analyseFlowFile(flowfile);
}

function takeFlow(filePaths) {

    if (filePaths && filePaths.length > 0) {
        var paths = filePaths.toString();
        fs.readFile(paths, 'utf-8', (err, data) => {
            try {
                var flo = JSON.parse(data);

                if (Array.isArray(flo) && (flo.length > 0)) {
                    RED.nodes.setFlows(flo);
                    //console.log("flo", flo);
                    flowfile = flo;  //setto come file il file appena importato

                    mainWindow.loadURL("http://localhost:" + listenPort + urledit);
                }
                else {
                    dialog.showErrorBox("Error", "Failed to parse flow file.\n\n  " + flo + ".\n\nAre you sure it's a flow file ?");
                    console.log(err);
                }
            }
            catch (e) {
                dialog.showErrorBox("Error", "Failed to load flow file.\n\n  " + e);
                console.log(e);
            }
        })
    }
}


function deviceAnalisys() {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "real-time.html"),
        protocol: 'file:',
        slashes: true
    }))

    //conWindow.webContents.openDevTools();

}


// Create the console log window
function createConsole() {
    if (conWindow) { conWindow.show(); return; }
    // Create the hidden console window
    conWindow = new BrowserWindow({
        title: "FloWare  Console",
        width: 700,
        height: 500,
        icon: path.join(__dirname, nrIcon),
        autoHideMenuBar: true,
        webPreferences: {

            nodeIntegration: true
        }
    });
    conWindow.loadURL(url.format({
        pathname: path.join(__dirname, urlconsole),
        protocol: 'file:',
        slashes: true
    }))
    conWindow.webContents.on('did-finish-load', () => {
        conWindow.webContents.send('logBuff', logBuffer);
    });
    conWindow.on('closed', () => {
        conWindow = null;
    });
}

function createNewApp() {

    if (appWindow) { appWindow.show(); return; }

    // Create the hidden console window
    appWindow = new BrowserWindow({
        title: "Create a new application",
        width: 700,
        height: 500,
        icon: path.join(__dirname, nrIcon),
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    appWindow.loadURL(url.format({
        pathname: path.join(__dirname, "./newapp.html"),
        protocol: 'file:',
        slashes: true,

    }))

    appWindow.on('closed', () => {
        appWindow = null;
    });
}

//FUNZIONA 
var c = new Array;
global.config = []
ipc.on("setMyGlobalConfiguration", (event, myGlobalVariableValue) => {

    c = myGlobalVariableValue

});

global.systems_ = []
ipc.on("system_total", (err, value) => {
    global.systems_ = value
})

ipc.on("setMyGlobalConfiguration2", (event, mySelectedGlobalValue2) => {
    //  global.selectedGlobalValue= mySelectedGlobalValue;
    //contiene la configurazione del feature model
    // scelta dall'utente

    global.zz = []
    global.zz = mySelectedGlobalValue2

    appWindow.loadURL(url.format({
        pathname: path.join(__dirname, "./newapp2.html"),
        protocol: 'file:',
        slashes: true,

    }))
});

ipc.on("ping", (event, value) => {
    event.reply('ping-reply', global.zz)
})


ipc.on("setMyGlobalConfiguration3", (event, myGlobalVariableValue) => {
    var elementi_analizzati = []
    elementi_analizzati = myGlobalVariableValue //array
    var min = 1
    var max = 999999
    var r = parseInt(Math.random() * (max - min) + min);  //random id file
    var id = "41f61d2."
    id += r; // z = file_id
    var rules = []
    var newarr = []
    newarr = c
    var j = 0;
    for (var i = 0; i < newarr.length; i++) {
        newarr[i + 1] = newarr[i + 1].toString()
        rules[j] = newarr[i + 1]
        j++
        i++
    }

    console.log(rules)

    var id_tab = `b7abfg80.${r}`

    var ui_tab = `
    {
        "id":"${id_tab}",
        "type": "ui_tab",
        "z": "",
        "tab":"",
        "name": "Smart University Scenario",
        "icon": "dashboard",
        "disabled": false,
        "hidden": false
    }`
    ui_tab = JSON.parse(ui_tab)

    var initials = `
    {"id":"${id}",
    "type": "tab",
    "label": "Flow ${r}",
    "disabled": false,
    "info": ""
    }
    `




    initials = JSON.parse(initials)

    elementi_analizzati.push(ui_tab)


    elementi_analizzati.forEach(element_ => {
        if (element_.type == "ui_group") {
            element_.tab = id_tab
        }
    })



    var y = 0;

   /*  for (var i = 0; i < newarr.length; i++) {  //set every comment for each system to provide

        var min = 1
        var max = 999999
        var id_comment = "159c15f9."
        var r = parseInt(Math.random() * (max - min) + min);
        id_comment += r;
        y = y + 40
        var comment = `
     {
         "id": "${id_comment}",
         "type": "comment",
         "z": "",
         "name": "${newarr[i]}",
         "info": "",
         "x": 100,
         "y": ${y},
         "wires": [[]]
     }`
        comment = JSON.parse(comment)
        elementi_analizzati.push(comment)

        y += parseInt((Math.random() * (200 - 100) + 100));
        i++
    } */

    elementi_analizzati.push(initials) //deve rimanere in ultima posizione del file

    for (var i = 0; i < elementi_analizzati.length - 1; i++) { // must not contain initials!!!
        elementi_analizzati[i].z = `${id}`;
    }

    elementi_analizzati = JSON.stringify(elementi_analizzati)

    var random = parseInt(Math.random() * (10000 - 1) + 1)
    var paths = `${__dirname}/files`
    paths += random
    fs.mkdir(paths, function (err) {
        if (err) {
            console.log('failed to create directory', err);
        } else {
            fs.writeFile(`${paths}/projectFile${random}.json`, elementi_analizzati, function (err) {
                if (err) {
                    console.log('error writing file', err);
                } else {

                    console.log('writing file succeeded' + `${paths}/projectFile${random}.json`);
                }
            });
        }
    });



    RED.nodes.setFlows(JSON.parse(elementi_analizzati));
    appWindow = null; //not works for now
    mainWindow.loadURL("http://localhost:" + listenPort + urledit);
});

// Create the main browser window
function createWindow() {
    mainWindow = new BrowserWindow({
        title: "FloWare Framework",
        width: 1024,
        height: 768,
        icon: path.join(__dirname, nrIcon),
        fullscreenable: true,
        autoHideMenuBar: false,
        kiosk: kioskMode,
        webPreferences: {
            nodeIntegration: false
        }
    });

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    if (process.platform !== 'darwin') { mainWindow.setAutoHideMenuBar(true); }

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "./load.html"),
        protocol: 'file',
        slashes: true
    }));

    mainWindow.webContents.on('did-get-response-details', function (event, status, newURL, originalURL, httpResponseCode) {
        if ((httpResponseCode == 404) && (newURL == ("http://localhost:" + listenPort + urlStart))) {
            setTimeout(mainWindow.webContents.reload, 250);
        }
    });

    mainWindow.webContents.on("new-window", function (e, url, frameName, disposition, option) {
        var w = mainWindow.getBounds();
        option.x = w.x;
        option.y = w.y;
        option.width = w.width;
        option.height = w.height;
    })

    mainWindow.on('close', function (e) {
        const choice = require('electron').dialog.showMessageBoxSync(this, {
            type: 'question',
            icon: nrIcon,
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Are you sure you want to quit?'
        });
        if (choice === 1) {
            e.preventDefault();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Start the app full screen
    //mainWindow.setFullScreen(true)

    // Open the DevTools at start
    //mainWindow.webContents.openDevTools();
}

// Called when Electron has finished initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') { app.quit(); }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
        mainWindow.loadURL("http://localhost:" + listenPort + urlStart);
    }
});

if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
        applicationVersion: pkg.version,
        version: pkg.dependencies["node-red"],
        //   credits: "Node-RED and other components are copyright the JS Foundation and other contributors."
    });
}




// Start the Node-RED runtime, then load the inital dashboard page
RED.start().then(function () {
    server.listen(listenPort, "localhost", function () {
        mainWindow.loadURL("http://localhost:" + listenPort + urlStart);
        console.log("Listen at   http://localhost:" + listenPort + urlStart)
        //analyseFlowFile(flowfile);
    });
});


