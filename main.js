
const pkg = require('./package.json');
let options;
if (pkg.hasOwnProperty("NRelectron")) { options = pkg["NRelectron"] }
// Setup user directory and flowfile (if editable)
var userdir = __dirname;
var psmid
global.array_config = [];
// Some settings you can edit if you don't set them in package.json
//console.log(options)
const { Notification } = require("electron");

const NOTIFICATION_TITLE = "FloWare Notification";
const NOTIFICATION_BODY = "You request was sent with success!";
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
global.x__ = 200;
global.y__ = 40;

// TCP port to use
//const  
/* var a;
a = Math.random() * 16383 + 49152         */            // fix it if you like
const listenPort = "18880";   // or random ephemeral port

const fetch = require('node-fetch');
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
const ipcRenderer = electron.ipcRenderer;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
var RED = require("node-red");
const { element } = require('protractor');
const { dirname } = require('logic-solver');
var red_app = express();


// Add a simple route for static content served from 'public'
red_app.use("/", express.static("web"));
//red_app.use(express.static(__dirname +"/public"));

// Create a server
var server = http.createServer(red_app);


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
  console.log("\n", fileName)
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
    title: "Create a new Application",
    width: 700,
    height: 500,
    icon: path.join(__dirname, nrIcon),
    autoHideMenuBar: true,
    preload: path.join('newapp3.html'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });


  appWindow.loadURL(path.join(__dirname, 'newapp3.html'));

  appWindow.on('closed', () => {
    appWindow = null;
  });
}

var main_name
flo = global.json
var elementi_analizzati = global.array_config
var path_eventi
var result_event;
ipc.on("FloWareConfiguration", async (event, flo, psmid) => {

  new Notification({
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY,
  }).show();

  main_name = flo[0].Name
  main_name = main_name.replace(/\s/g, '');
  path_eventi = "http://pedvalar.webs.upv.es/microservices/system/" + main_name + "/floware/psm/" + psmid + "/events"

  response = await fetch(path_eventi, {
    method: 'GET',
    headers: { Accept: 'application/json', },
  });


  result_event = (await response.json());
  console.log((result_event));

  for (elementflo = 0; elementflo < flo.length; elementflo++) {

   if(flo[elementflo]["Type"]=="Device")  {
    if (flo[elementflo].Selection == "Selected") {
      if ((flo[elementflo]["Device type"] == "Sensor" || flo[elementflo]["Device type"] == "Tag" || flo[elementflo]["Device type"] == "Actuator")) {
        if ((flo[elementflo]["Device type"] == "Sensor" || flo[elementflo]["Device type"] == "Tag")) {
          global.inp = "in"
        }
        else {
          global.inp = "out"
        }

        Object.keys((flo[elementflo]["Operations"])).forEach(element => {
       
          var id_comment = "159c15f9."
          var min = 1
          var max = 999999
          var r = parseInt(Math.random() * (max - min) + min);
          id_comment += r;
          var comment;
          var comment2;
          var vr = "Device Name: "
          comment2 = `
          {
              "id": "${id_comment}",
              "type": "comment",
              "z": "",
              "name": "${vr + flo[elementflo]["Name"]}",
              "info": "",
              "x":${global.x__},
              "y": ${global.y__},
              "wires": [[]]
          }`
          comment2 = JSON.parse(comment2)
          elementi_analizzati.push(comment2)
          global.y__ += 40;
          
          var high_level

          result_event.forEach(element2 => {

         

            if ((flo[elementflo]["Name"] == element2.device) && (flo[elementflo]["Operations"][element]["Operation Name"] == element2.operation)) {
              var min = 1
              var max = 999999
              var id_comment = "159c15f9."
              var r = parseInt(Math.random() * (max - min) + min);
              id_comment += r;

              var message = "Event Name: " + element2.name + " Event Condition: " + element2.operation + " " + element2.condition
            
             high_level = element2.name
              comment = `
         {
             "id": "${id_comment}",
             "type": "comment",
             "z": "",
             "name": "${message}",
             "info": "",
             "x":${global.x__},
             "y": ${global.y__},
             "wires": [[]]
         }`
              comment = JSON.parse(comment)
              elementi_analizzati.push(comment)

              //  global.y__ += parseInt((Math.random() * (200 - 100) + 100));
              global.y__ += 50;

            }
          });

          // console.log((flo[elementflo]["Operations"][element]["Operation Name"], flo[elementflo]["Operations"][element]["Service"]))

          if (flo[elementflo]["Operations"][element]["Service"] == "MQTT") {

            subm(high_level, (flo[elementflo]["Operations"][element]["Data Type"]), (flo[elementflo]["Operations"][element]["Operation Name"]), (flo[elementflo]["Operations"][element]["specification"]["QoS"]), (flo[elementflo]["Operations"][element]["specification"]["Topic"]), (flo[elementflo]["Operations"][element]["specification"]["Server Broker"]), (flo[elementflo]["Operations"][element]["specification"]["Port"]));
          }
          else if (flo[elementflo]["Operations"][element]["Service"] == "UDP") {

            set_udp(high_level, n, yy, (flo[elementflo]["Operations"][element]["Operation Name"]), global.inp);
          }
          else if (flo[elementflo]["Operations"][element]["Service"] == "TCP") {

            set_tcp(high_level, n, yy, (flo[elementflo]["Operations"][element]["Operation Name"]), global.inp);
          }
          else if (flo[elementflo]["Operations"][element]["Service"] == "WEBSOCKET") {

            set_websocket(high_level, n, yy, (flo[elementflo]["Operations"][element]["Operation Name"]), global.inp);
          }
          else if (flo[elementflo]["Operations"][element]["Service"] == "HTTP") {

            sub_http(high_level,(flo[elementflo]["Operations"][element]["Data Type"]), (flo[elementflo]["Operations"][element]["specification"]["Address"]), (flo[elementflo]["Operations"][element]["specification"]["Method"]), (flo[elementflo]["Operations"][element]["Operation Name"]), (flo[elementflo]["Operations"][element]["specification"]["Port"]));
          }
          else if (flo[elementflo]["Operations"][element]["Service"] == "LoRa") {

            set_lora(high_level,n, yy, (flo[elementflo]["Operations"][element]["Operation Name"]), global.inp);
          }
        
        });


      }
    }
  }
  }

  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);  //random id file
  var id = "41f61d2."
  id += r; // z = file_id

  var id_tab = `b7abfg80.${r}`

  var ui_tab = `
    {
        "id":"${id_tab}",
        "type": "ui_tab",
        "z": "",
        "tab":"",
        "name": "Smart Scenario",
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


  elementi_analizzati.push(initials) //deve rimanere in ultima posizione del file

  for (var i = 0; i < elementi_analizzati.length - 1; i++) { // must not contain initials!!!
    elementi_analizzati[i].z = `${id}`;
  }

  elementi_analizzati = JSON.stringify(elementi_analizzati)
  //console.log(elementi_analizzati)
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


global.systems_ = []
ipc.on("system_total", (err, value) => {
  global.systems_ = value
})

//console.log(global.array_config)
//ipcRenderer.send("setMyGlobalConfiguration3", global.array_config);

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



function create_colleg(high_level,node, datatype, x, y) {
  high_level=high_level
  global.nodename = node.name
  var node = node;
  var encr;
  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);
  global.x__ = parseInt(global.x__)
  global.y__ = parseInt(global.y__)
  if (global.encrypt_ != null) {
    var encr_id = `897696c.${r}`
    var decrypt_id = `4567f696c.${r}`
    encr =
      `{
           "id": "${encr_id}",
        "type": "decrypt",
        "z": "",
        "name": "",
        "algorithm":"${global.encrypt_}",
        "key": "1234",
        "x": "${parseInt(x) + 160} ",
        "y": "${parseInt(y)}",
        "wires": [
          []
        ]
      }`


    decr =
      `{
           "id": "${decrypt_id}",
        "type": "encrypt",
        "z": "",
        "name": "",
        "algorithm":"${global.encrypt_}",
        "key": "1234",
        "x": "${parseInt(x) + 380} ",
        "y": "${parseInt(y - 60)}",
        "wires": [
          []
        ]
      }`

    encr = JSON.parse(encr)
    decr = JSON.parse(decr)

    if (node.type.includes("in") || (node.type.includes("uplink") || (node.type.includes("request")))) {
      node.wires[0].push(encr_id)
    }
  }

  if (datatype == "Numeric") {
    var id_json = `82e7263f.${r}`
    var id_debug = `2a08c57b.${r}`
    var id_chart = `9d19d8fc.${r}`
    var id_template = `46dg574s.${r}`;
    var id_gauge = `a82ffb36.${r}`;
    var id_ui_group = `dca5gfd0.${r}`
    var id_function = `eb57e9b2.${r}`
    var id_change = `3e120eca.${r}`
    var id_request_bpmn = `a7f924e5.${r}`
    var id_response_bpmn = `3b966545.${r}`
    var messageName = "messageName"
    var message_name = `{\"${messageName}\":\"${high_level}\"}`
    message_name = JSON.stringify(message_name)
var change
var function_event
var request_bpmn
var response_bpmn

    if(high_level != undefined) {
    change =
      `{
      "id":  "${id_change}",
      "type": "change",
      "z": "",
      "name": "Set message",
      "rules": [
          {
              "t": "set",
              "p": "headers.content-type",
              "pt": "msg",
              "to": "application/json",
              "tot": "str"
          },
          {
              "t": "set",
              "p": "payload",
              "pt": "msg",
              "to":  ${message_name},
              "tot": "json"
          }
      ],
      "action": "",
      "property": "",
      "from": "",
      "to": "",
      "reg": false,
      "x": ${x + parseInt(900)},
      "y":${y + parseInt(20)},
      "wires": [
          [
            "${id_request_bpmn}"
          ]
      ]
  }`

    change = JSON.parse(change)

   function_event =
      `{
      "id": "${id_function}",
      "type": "function",
      "z": "",
      "name": "Develop the event function here",
      "func": "return msg;",
      "outputs": 1,
      "noerr": 0,
      "initialize": "",
      "finalize": "",
      "libs": [],
      "x": ${x + parseInt(800)},
      "y": ${y - parseInt(20)},
      "wires": [
          [
            "${id_change}"
          ]
      ]
  }`

    function_event = JSON.parse(function_event)
    var code_path = "172.23.181.247:8080/engine-rest/message"
   request_bpmn =
      ` {
      "id": "${id_request_bpmn}",
      "type": "http request",
      "z": "",
      "name": "Http request to BPMN model",
      "method": "POST",
      "ret": "txt",
      "paytoqs": "ignore",
      "url": "${code_path}",
      "tls": "",
      "persist": false,
      "proxy": "",
      "authType": "",
      "x": ${x + parseInt(1100)},
      "y":${y - parseInt(20)},
      "wires": [
          [
            "${id_response_bpmn}"
          ]
      ]
  }`

    request_bpmn = JSON.parse(request_bpmn)

     response_bpmn =
      `{
      "id": "${id_response_bpmn}",
      "type": "http response",
      "z": "",
      "name": "Response (200)",
      "statusCode": "200",
      "headers": {},
      "x": ${x + parseInt(1400)},
      "y":${y - parseInt(20)},
      "wires": []
    }`

    response_bpmn = JSON.parse(response_bpmn)
  }
    var ui_group =
      ` {
          "id": "${id_ui_group}",
          "type": "ui_group",
          "z": "",
          "name": "${node.name}",
          "tab": "",
          "order": 1,
          "disp": true,
          "width": "6",
          "collapse": false
      }`

    ui_group = JSON.parse(ui_group)
    global.array_config.push(ui_group)
    var debug =
      ` {
                      "id": "${id_debug}",
                      "type": "debug",
                      "z": "",
                      "name": "",
                      "active": true,
                      "tosidebar": true,
                      "console": false,
                      "tostatus": false,
                      "complete": "payload",
                      "targetType": "msg",
                      "x": ${x + parseInt(610)},
                      "y":${y - parseInt(40)},
                      "wires": []
                  }`

    var template =
      ` {
      "id": "${id_template}",
      "type": "template",
      "z": "",
      "name": "",
      "field": "payload",
      "fieldType": "msg",
      "format": "handlebars",
      "syntax": "mustache",
      "template": "{{payload.value}}",
      "output": "str",
       "x": ${x + parseInt(280)},
       "y":${y + parseInt(40)},
      "wires": [
        [
          "${id_chart}"
        ]
      ]
    }`

    var json =
      `  {
                  "id": "${id_json}",
                  "type": "json",
                  "z": "",
                  "name": "",
                  "property": "payload",
                   "action": "obj",
                  "pretty": true,
                 "x": ${x + parseInt(270)},
                  "y":${y},
                  "wires": [
                      [
                       "${id_debug}",
                       "${id_gauge}",
                       "${id_function}",
                       "${id_template}"
                      ]
                  ]
              }`

    var chart =
      ` 
                  {
                      "id": "${id_chart}",
                      "type": "ui_chart",
                      "name":"${node.name} monitoring",
                      "z": "",
                      "ymin": "0",
                      "ymax": "50",
                      "group": "${id_ui_group}",
                      "order": 1,
                      "width": 0,
                      "height": 0,
                      "label": "${node.name} chart",
                      "chartType": "line",
                      "legend": "false",
                      "xformat": "HH:mm:ss",
                      "interpolate": "linear",
                      "nodata": "",
                      "dot": false,
                      "ymin": "",
                      "ymax": "",
                      "removeOlder": 1,
                      "removeOlderPoints": "",
                      "removeOlderUnit": "3600",
                      "cutout": 0,
                      "useOneColor": false,
                      "useUTC": false,
                      "colors": [
                          "#1f77b4",
                          "#aec7e8",
                          "#ff7f0e",
                          "#2ca02c",
                          "#98df8a",
                          "#d62728",
                          "#ff9896",
                          "#9467bd",
                          "#c5b0d5"
                      ],
                      "useOldStyle": false,
                      "outputs": 1,
                     "x": ${x + parseInt(590)},
                      "y":${y + parseInt(40)},
                      "wires": [
                          []
                      ]
                  }`

    var gauge =
      `{
        "id": "${id_gauge}",
        "type": "ui_gauge",
        "z": "",
          "name":"${node.name}",
        "group": "${id_ui_group}",
        "order": 1,
        "width": 0,
        "height": 0,
        "gtype": "gage",
        "title": "",
        "label": "",
        "format": "{{payload.value}}",
        "min": 0,
        "max": "40",
        "colors": [
          "#00b500",
          "#e6e600",
          "#ca3838"
        ],
        "seg1": "",
        "seg2": "",
       "x": ${x + parseInt(500)},
        "y":${y - parseInt(70)},
        "wires": []
      }`

    if (global.encrypt_ != null) {
      encr.wires[0].push(id_json)
      node.wires[0].push(encr_id)
    }
    else if (global.encrypt_ == null) {
      node.wires[0].push(id_json)
    }


    chart = JSON.parse(chart)
    debug = JSON.parse(debug)
    json = JSON.parse(json)
    gauge = JSON.parse(gauge)
    template = JSON.parse(template)

    global.array_config.push(gauge)
    global.array_config.push(json)

    if(high_level!=undefined){
    global.array_config.push(function_event)
    global.array_config.push(response_bpmn)
    global.array_config.push(request_bpmn)
    global.array_config.push(change)
    }

    global.array_config.push(debug)
    global.array_config.push(chart)
    global.array_config.push(template)
  }
  else if (datatype == "Boolean") {
    x = parseInt(x)
    y = parseInt(y)
    var id_switch = `82e7263f.${r}`
    var id_text = `82erwr3f.${r}`
    var id_json = `sdf45dgd.${r}`
    var id_json2 = `hrt45gd.${r}`
    var id_ui_group = `dca5gfd0.${r}`

    var id_function = `eb57e9b2.${r}`
    var id_change = `3e120eca.${r}`
    var id_request_bpmn = `a7f924e5.${r}`
    var id_response_bpmn = `3b966545.${r}`
    var messageName = "messageName"
    var message_name = `{\"${messageName}\":\"${high_level}\"}`
    message_name = JSON.stringify(message_name)
var change
var function_event
var request_bpmn
var response_bpmn

    if(high_level != undefined) {
    change =
      `{
      "id":  "${id_change}",
      "type": "change",
      "z": "",
      "name": "Set message",
      "rules": [
          {
              "t": "set",
              "p": "headers.content-type",
              "pt": "msg",
              "to": "application/json",
              "tot": "str"
          },
          {
              "t": "set",
              "p": "payload",
              "pt": "msg",
              "to":  ${message_name},
              "tot": "json"
          }
      ],
      "action": "",
      "property": "",
      "from": "",
      "to": "",
      "reg": false,
      "x": ${x + parseInt(900)},
      "y":${y + parseInt(20)},
      "wires": [
          [
            "${id_request_bpmn}"
          ]
      ]
  }`

    change = JSON.parse(change)

   function_event =
      `{
      "id": "${id_function}",
      "type": "function",
      "z": "",
      "name": "Develop the event function here",
      "func": "return msg;",
      "outputs": 1,
      "noerr": 0,
      "initialize": "",
      "finalize": "",
      "libs": [],
      "x": ${x + parseInt(800)},
      "y": ${y - parseInt(20)},
      "wires": [
          [
            "${id_change}"
          ]
      ]
  }`

    function_event = JSON.parse(function_event)
    var code_path = "172.23.181.247:8080/engine-rest/message"
   request_bpmn =
      ` {
      "id": "${id_request_bpmn}",
      "type": "http request",
      "z": "",
      "name": "Http request to BPMN model",
      "method": "POST",
      "ret": "txt",
      "paytoqs": "ignore",
      "url": "${code_path}",
      "tls": "",
      "persist": false,
      "proxy": "",
      "authType": "",
      "x": ${x + parseInt(1100)},
      "y":${y - parseInt(20)},
      "wires": [
          [
            "${id_response_bpmn}"
          ]
      ]
  }`

    request_bpmn = JSON.parse(request_bpmn)

     response_bpmn =
      `{
      "id": "${id_response_bpmn}",
      "type": "http response",
      "z": "",
      "name": "Response (200)",
      "statusCode": "200",
      "headers": {},
      "x": ${x + parseInt(1400)},
      "y":${y - parseInt(20)},
      "wires": []
    }`

    response_bpmn = JSON.parse(response_bpmn)
  }

    var ui_group =
      ` {
          "id": "${id_ui_group}",
          "type": "ui_group",
          "z": "",
          "name": "${node.name}",
          "tab": "",
          "order": 1,
          "disp": true,
          "width": "6",
          "collapse": false
      }`

    ui_group = JSON.parse(ui_group)
    global.array_config.push(ui_group)

    var json =
      `  {
                  "id": "${id_json}",
                  "type": "json",
                  "z": "",
                  "name": "",
                  "property": "payload",
                  "action": "str",
                  "pretty": false,
                 "x": ${x + parseInt(370)},
                   "y":${y},
                  "wires": [
                      [
                       "${id_text}"
                      ]
                  ]
              }`


    var json2 =
      `  {
                  "id": "${id_json2}",
                  "type": "json",
                  "z": "",
                  "name": "",
                  "property": "payload",
                  "action": "",
                  "pretty": false,
                 "x": ${x + parseInt(370)},
                    "y":${y - parseInt(60)},
                  "wires": [
                      [
                 
                      ]
                  ]
              }`



    var switch_ =
      ` {
        "id": "${id_switch}",
        "type": "ui_switch",
        "z": "",
          "name":"${node.name} switch",
        "label": "switch",
        "tooltip": "",
        "group": "${id_ui_group}",
        "order": 2,
        "width": 0,
        "height": 0,
        "passthru": true,
        "decouple": "false",
        "topic": "",
        "style": "",
        "onvalue": "true",
        "onvalueType": "bool",
        "onicon": "",
        "oncolor": "",
        "offvalue": "false",
        "offvalueType": "bool",
        "officon": "",
        "offcolor": "",
        "x": ${global.x__ + parseInt(110)},
        "y":${global, y__ - parseInt(60)},
        "wires": [
          [
          ]
        ]
      }`

    var ui_text =
      ` {
        "id": "${id_text}",
        "type": "ui_text",
        "z": "",
        "name":"${node.name} state",
        "group": "${id_ui_group}",
        "order": 1,
        "width": 0,
        "height": 0,
        "name": "",
        "label": "state",
        "format": "{{msg.payload}}",
        "layout": "row-spread",
        "x": ${global.x__ + parseInt(530)},
        "y":${global.y__ - parseInt(60)},
        "wires": []
      }`
    switch_ = JSON.parse(switch_)
    ui_text = JSON.parse(ui_text)

    json = JSON.parse(json)
    json2 = JSON.parse(json2)
    var node2 = new Array();
    var node3 = new Array();

    node2.push(node) //out
    node3.push(node) //in

    node2 = JSON.stringify(node2)
    var node2_ = JSON.parse(node2);

    node3 = JSON.stringify(node3);
    var node3_ = JSON.parse(node3);

    if (node.type.includes("in")) {
      if (global.encrypt_ == null) {
        node.wires[0].push(id_json)
      }
      else {
        node.wires[0].push(encr_id)
        encr.wires[0].push(id_json)
      }
    }

    if (node.type.includes("out")) {
      node2_[0].x = parseInt(node3_[0].x) + 750
      node2_[0].y = parseInt(node2_[0].y) - 60
      node3_[0].id = `aaaaaa.${r}`
      //node3_[0].x = parseInt(node3_[0].x)
      node3_[0].type = node3_[0].type.replace(/out/, "in");
      // var x_ = parseInt(node3_[0].x) - parseInt(40)

      if (global.encrypt_ == null) {
        node3_[0].wires[0].push(id_json)
        json.wires[0].push(id_text)
        if(high_level!=undefined){
          global.array_config.push(function_event)
          global.array_config.push(response_bpmn)
          global.array_config.push(request_bpmn)
          global.array_config.push(change)
          }

          
      }
      else {
        node3_[0].wires[0].push(encr_id)
        encr.wires[0].push(id_json)
        json.wires[0].push(id_text)

        switch_.wires[0].push(id_json2)
        json2.wires[0].push(decrypt_id)
        decr.wires[0].push(node2_[0].id)

        global.array_config.push(decr)
        global.array_config.push(json2)

        if(high_level!=undefined){
          global.array_config.push(function_event)
          global.array_config.push(response_bpmn)
          global.array_config.push(request_bpmn)
          global.array_config.push(change)
          }
 
      }

      global.array_config.push(node3_[0])
      node = node2_[0]
      global.array_config.push(switch_)
    }

    else if (node.type.includes("downlink")) {
      var node2 = [];
      node2 = node
      node2.id = `8erw33f.${r}`
      node2.type = node2.type.replace(/downlink/, "uplink");
      var x_ = parseInt(node2.x) + parseInt(85)
      if (global.encrypt_ == null) {
        // node2.x.push(x_)
        node2.wires[0].push(id_text)
        node2.wires[0].push(id_switch)
      } else {
        encr.wires[0].push(id_text)
        encr.wires[0].push(id_switch)
      }
      global.array_config.push(node2)
    }


    else if (node.type.includes("request")) {
      if (node.name.includes("BPMN")) { }

      else {
        var node2 = [];
        node2 = node
        node2.id = `8erw33f.${r}`
        node2.type = node2.type.replace(/request/, "request");
        var x_ = parseInt(node2.x) + parseInt(85)
        if (global.encrypt_ == null) {
          var bb = x_.toString()
          node2.x = bb
          node2.wires[0].push(id_text)
          node2.wires[0].push(id_json)
          node2.wires[0].push(id_switch)
        } else {
          encr.wires[0].push(id_text)
          encr.wires[0].push(id_switch)
        }
        global.array_config.push(node2)
      }
    }

    global.array_config.push(json)
    global.array_config.push(ui_text)
  }
  else if (datatype == "Visual") {
    x = parseInt(x)
    y = parseInt(y)
    var id_image = `e0dfc0ce.${r}`
    var id_ui_group = `dca5gfd0.${r}`

    var image =
      `{
         "id": "${id_image}",
        "type": "ui_template",
        "z": "",
        "group": "${id_ui_group}",
         "name":"${node.name} image",
        "order": 1,
        "width": "6",
        "height": "6",
        "format": "<div layout='row' layout-align='space-between'><img width='300' height='200' src='{{(msg.responseUrl)}}'></div>",
        "storeOutMessages": true,
        "fwdInMessages": true,
        "resendOnRefresh": true,
        "templateScope": "local",
        "x": ${x + parseInt(380)},
        "y":${y},
        "wires": [
          []
        ]
        }`

    image = JSON.parse(image)


    var ui_group =
      ` {
          "id": "${id_ui_group}",
          "type": "ui_group",
          "z": "",
          "name": "${node.name}",
          "tab": "",
          "order": 1,
          "disp": true,
          "width": "6",
          "collapse": false
      }`

    ui_group = JSON.parse(ui_group)

    var id_predict = `dcfhhfd0.${r}`
    var id_funct = `fet34fd0.${r}`
    var id_text2 = `gf43tfdf4.${r}`
    var predict =
      `
        {
          "id": "${id_predict}",
          "type": "object-detector",
          "z": "",
          "service": "75710fce.85a6c",
          "method": "predict",
          "passthrough": false,
          "annotated_input": false,
          "predict_body": "",
          "predict_bodyType": "str",
          "predict_threshold": "",
          "predict_thresholdType": "str",
          "name": "",
              "x": ${x + parseInt(320)},
            "y":${y + parseInt(40)},
          "wires": [
              [
                  "${id_funct}"
              ]
          ]
        }`

    var f = `var people=0;for(var i=0;i<msg.details.predictions.length;i++){if(msg.details.predictions[i].label=='person'&& msg.details.predictions[i].probability >=0.15){people=people+1;msg.payload=people.toString()}}return msg`
    var funct =

      ` {
          "id": "${id_funct}",
          "type": "function",
          "z": "",
          "name": "",
          "func": "${f}",
             "outputs": 1,
          "noerr": 0,
             "x": ${x + parseInt(480)},
            "y":${y + parseInt(40)},
          "wires": [
              [
                  "${id_text2}"
              ]
          ]
      } `

    var text1 =
      `
      {
          "id": "${id_text2}",
          "type": "ui_text",
          "z": "",
          "group": "${id_ui_group}",
          "order": 2,
          "width": 0,
          "height": 0,
          "name": "",
          "label": "People detected:",
          "format": "{{msg.payload}}",
          "layout": "row-center",
          "x": ${x + parseInt(620)},
          "y":${y + parseInt(40)},
          "wires": []
      }`

    var service =
      `
      {
          "id": "75710fce.85a6c",
          "type": "object-detector-service",
          "z": "",
          "host": "https://max-object-detector.codait-prod-41208c73af8fca213512856c7a09db52-0000.us-east.containers.appdomain.cloud",
          "name": "cloud"
      }
  `

    service = JSON.parse(service)
    global.array_config.push(service)
    text1 = JSON.parse(text1)
    global.array_config.push(text1)
    funct = JSON.parse(funct)
    global.array_config.push(funct)
    predict = JSON.parse(predict)
    global.array_config.push(predict)
    node.wires[0].push(id_predict)

    if (global.encrypt_ != null) {
      encr.wires[0].push(id_image)
      node.wires[0].push(encr_id)
    }
    else if (global.encrypt_ == null) {
      node.wires[0].push(id_image)
    }



    global.array_config.push(ui_group)

    global.array_config.push(image)
  }
  else if (datatype == "String") {
    x = parseInt(x)
    y = parseInt(y)
    var id_switch = `82e7263f.${r}`
    var id_text = `41f61d2.${r}`
    var id_json = `sdf45dgd.${r}`
    var id_json2 = `hrt45gd.${r}`
    var id_ui_group = `dca5gfd0.${r}`



    var ui_group =
      ` {
          "id": "${id_ui_group}",
          "type": "ui_group",
          "z": "",
          "name": "${global.nodename}",
          "tab": "",
          "order": 1,
          "disp": true,
          "width": "6",
          "collapse": false
      }`

    ui_group = JSON.parse(ui_group)
    global.array_config.push(ui_group)

    var json =
      `  {
                  "id": "${id_json}",
                  "type": "json",
                  "z": "",
                  "name": "",
                  "property": "payload",
                  "action": "str",
                  "pretty": false,
                 "x": ${x + parseInt(370)},
                   "y":${y},
                  "wires": [
                      [
                       "${id_text}"
                      ]
                  ]
              }`


    var json2 =
      `  {
                  "id": "${id_json2}",
                  "type": "json",
                  "z": "",
                  "name": "",
                  "property": "payload",
                  "action": "",
                  "pretty": false,
                 "x": ${x + parseInt(370)},
                    "y":${y - parseInt(60)},
                  "wires": [
                      [
                 
                      ]
                  ]
              }`



    var switch_ =
      ` {
        "id": "${id_switch}",
        "type": "ui_switch",
        "z": "",
        "name":"${global.nodename} switch",
        "label": "switch",
        "tooltip": "",
        "group": "${id_ui_group}",
        "order": 2,
        "width": 0,
        "height": 0,
        "passthru": true,
        "decouple": "false",
        "topic": "",
        "style": "",
        "onvalue": "true",
        "onvalueType": "bool",
        "onicon": "",
        "oncolor": "",
        "offvalue": "false",
        "offvalueType": "bool",
        "officon": "",
        "offcolor": "",
        "x": ${x + parseInt(310)},
        "y":${y - parseInt(60)},
        "wires": [
          [
          ]
        ]
      }`
    var ui_text =
      `
      {
        "id": "${id_text}",
        "type": "ui_text",
        "z": "",
        "name":" ${global.nodename} state",
        "group": "${id_ui_group}",
        "order": 1,
        "width": 0,
        "height": 0,
        "name": "",
        "label": "state",
        "format": "{{msg.payload}}",
        "layout": "row-spread",
        "x": ${x + parseInt(530)},
        "y":${y - parseInt(60)},
        "wires": []
      }`
    switch_ = JSON.parse(switch_)
    ui_text = JSON.parse(ui_text)

    json = JSON.parse(json)
    json2 = JSON.parse(json2)
    var node2 = new Array();
    var node3 = new Array();

    node2.push(node) //out
    node3.push(node) //in

    node2 = JSON.stringify(node2)
    var node2_ = JSON.parse(node2);

    node3 = JSON.stringify(node3);
    var node3_ = JSON.parse(node3);

    if (node.type.includes("in")) {
      if (global.encrypt_ == null) {
        node.wires[0].push(id_json)
      }
      else {
        node.wires[0].push(encr_id)
        encr.wires[0].push(id_json)
      }
    }

    if (node.type.includes("out")) {
      node2_[0].x = parseInt(node3_[0].x) + 750
      node2_[0].y = parseInt(node2_[0].y) - 60
      node3_[0].id = `aaaaaa.${r}`
      //node3_[0].x = parseInt(node3_[0].x)
      node3_[0].type = node3_[0].type.replace(/out/, "in");
      node3_[0].type = node3_[0].type.replace(/out/, "in");
      // var x_ = parseInt(node3_[0].x) - parseInt(40)

      if (global.encrypt_ == null) {
        node3_[0].wires[0].push(id_json)
        json.wires[0].push(id_text)
      }
      else {
        node3_[0].wires[0].push(encr_id)
        encr.wires[0].push(id_json)
        json.wires[0].push(id_text)

        switch_.wires[0].push(id_json2)
        json2.wires[0].push(decrypt_id)
        decr.wires[0].push(node2_[0].id)

        global.array_config.push(decr)
        global.array_config.push(json2)
      }

      global.array_config.push(node3_[0])
      node = node2_[0]
      global.array_config.push(switch_)
    }

    else if (node.type.includes("downlink")) {
      var node2 = [];
      node2 = node
      node2.id = `8erw33f.${r}`
      node2.type = node2.type.replace(/downlink/, "uplink");
      var x_ = parseInt(node2.x) + parseInt(85)
      if (global.encrypt_ == null) {
        // node2.x.push(x_)
        node2.wires[0].push(id_text)
        node2.wires[0].push(id_switch)
      } else {
        encr.wires[0].push(id_text)
        encr.wires[0].push(id_switch)
      }
      global.array_config.push(node2)
    }

    else if (node.type.includes("request")) {
      var node2 = [];
      node2 = node
      node2.id = `8erw33f.${r}`
      node2.type = node2.type.replace(/request/, "request");
      var x_ = parseInt(node2.x) + parseInt(85)
      if (global.encrypt_ == null) {
        node2.x = (x_.toString())
        node2.wires[0].push(id_text)
        node2.wires[0].push(id_switch)
      } else {
        encr.wires[0].push(id_text)
        encr.wires[0].push(id_switch)
      }
      global.array_config.push(node2)
    }

    global.array_config.push(json)
    global.array_config.push(ui_text)
  }

  global.x__ = x;
  global.y__ = y + 150;
  if (global.encrypt_ != null) {
    global.array_config.push(encr)
  }
  global.array_config.push(node)
  global.encrypt_ = null;
  //global.inp = null;
}


function subm(high_level,datatype, node, qos, topic, broker, port) {
  global.datatype = datatype
  //console.log("dalla funzione: ", node, qos, topic, broker, port)
  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);
  var idBroker = `82e7263f.${r}`
  var id_ = `42a56979.${r}`
  var id_json = `174b1d51.${r}`;
  //nodo mqtt IN
  var node__ = `
    
        { "id": "${id_}", 
        "z": "",
         "type": "mqtt ${global.inp}", 
         "name": "${node}",
          "qos": "${qos}",
           "topic": "${topic}",
            "broker": "${idBroker}",
             "x": "${parseInt(global.x__)}",
              "y": "${parseInt(global.y__)}",
               "wires": [
                 [
                  "${id_json}"
                ]
              ] 
        }`
  //nodo broker
  var broker_ = ` {
          "id": "${idBroker}",
          "type": "mqtt-broker",
          "z": "",
          "name": "",
          "broker": "${broker}",
          "port": "${port}",
          "clientid": "",
          "usetls": false,
          "compatmode": false,
          "keepalive": "60",
          "cleansession": true,
          "birthTopic": "",
          "birthQos": "0",
          "birthPayload": "",
          "closeTopic": "",
          "closeQos": "0",
          "closePayload": "",
          "willTopic": "",
          "willQos": "0",
          "willPayload": ""
        }`

  node__ = JSON.parse(node__)
  broker_ = JSON.parse(broker_)

  global.x__ = global.x__
  global.y__ = global.y__
  global.array_config.push(broker_)

  create_colleg(high_level,node__, global.datatype, global.x__, global.y__)
  renderer_ = true

}


function sub_lora(high_level,deviceid, field, applid, key, element, port, n) {
  var appid = "22186c07."
  var min = 1
  var max = 999999

  var r = parseInt(Math.random() * (max - min) + min);
  appid += r;
  x = parseInt(Math.random() * (100 - 60) + 60);
  y = parseInt(Math.random() * (170 - 150) + 150);
  if (port != null || port != "") { var port_ = `${port}` } else { var port_ = `` }
  if (global.inp == "in") { global.inp = "uplink" } else { global.inp = "downlink" }
  var id = "94400940." + r
  var device = `{
          "id": "${id}",
          "type": "ttn ${global.inp}",
          "z": "41f61d2.fbe09e4",
          "name": "${element}",
          "app": "${applid}",
          "dev_id": "${deviceid}",
          "field":"${field}",
          "confirmed": true,
          "schedule": "replace",
          "port": "${port_}",
          "x": "${parseInt(global.x__)}",
          "y": "${parseInt(global.y__)}",
          "wires": [[]]
        }`

  device = JSON.parse(device)

  global.x__ = global.x__
  global.y__ = global.y__

  create_colleg(high_level,device, global.datatype, global.x__, global.y__)
  /*  serv = JSON.parse(serv) */
  // global.array_config.push(device)
  /*  global.array_config.push(serv) */
  var html = ""
  var code = ""
  //elem[n].innerHTML=""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;
}

function sub_http(high_level,datatype, path, method, name, port) {
  var high_level=high_level
  console.log(high_level)
  ids = "35eb11d7."
  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);
  if (global.inp == "in") { global.inp = "in" } else { global.inp = "response" }
  var id_inject = `198cf8a5.${r}`
  ids += r;
  var node_ = `{
          "id": "${ids}",
          "type": "http request",
          "z": "",
          "ret": "txt",
          "name": "${name}",
          "url": "${path}:${port}",
          "tls": "",
          "persist": false,
          "statusCode": "",
          "method": "${method}",
          "headers": {},
          "upload": true,
          "swaggerDoc": "",
          "x": "${parseInt(global.x__)}",
        "y": "${parseInt(global.y__)}",
          "wires": [
            []
          ]
        }`
  node_ = JSON.parse(node_)

  var inject =
    `
    {
      "id": "${id_inject}" ,
      "type": "inject",
      "z": "",
      "name": "",
      "topic": "",
      "payload": "",
      "payloadType": "date",
      "repeat": "",
      "crontab": "",
      "once": true,
      "onceDelay": 0.1,
       "x": "${parseInt(global.x__)}",
        "y": "${parseInt(global.y__) + 50}",
      "wires": [
        [
          "${ids}"
        ]
      ]
    }`

  inject = JSON.parse(inject)
  global.array_config.push(inject)
  global.x__ = global.x__
  global.y__ = global.y__
  global.inp = ""
  create_colleg(high_level,node_, datatype, global.x__, global.y__)
  // global.array_config.push(node_)
  var html = ""
  var code = ""
  //elem[n].innerHTML=""

  renderer_ = true
}

function set_websocket(high_level,n, yy, element) {

  if (n >= yy) {
    var config = document.getElementsByClassName("configurator" + n)
  }

  else {
    n = yy
    var config = document.getElementsByClassName("configurator" + n)
  }
  var code = ""
  var n_ = element.toString()
  code += '<div><label for="exampleInputMqtt">WebSocket node Name<br></label><input type="text" disabled="disabled" class="form-control" id="nodename" aria-describedby="emailHelp" value="' + n_ + '" placeholder="' + n_ + '"></div><br>'


  code += '<div><label for="exampleInputMqtt">WebSocket Server node Path<br></label><input type="text" class="form-control" id="webpath"  value="" placeholder="Insert path"></div><br>'
  code += '<button onclick="sub_websocket(webpath.value,nodename.value,' + n + ')"  id="se' + n + '" +>Save specifications</button>'
  return config[0].innerHTML += code
}

function sub_websocket(high_level,path, elem, n) {

  var id_wsServer = "3ad61300."
  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);
  id_wsServer += r;
  id_ = "431a8bb7."
  id_ += r;
  var web = `{
          "id": "${id_}",
          "type": "websocket ${global.inp}",
          "z": "",
          "name": "${elem}",
          "server": "",
          "client": "${id_wsServer}",
            "x": "${parseInt(global.x__)}",
        "y": "${parseInt(global.y__)}",
          "wires": [
            []
          ]
        }`
  var serv =
    `
          {
            "id": "${id_wsServer}",
            "type": "websocket-client",
            "z": "",
            "path": "${path}",
             "tls": "",
            "wholemsg": "false"
          }`
  web = JSON.parse(web)
  serv = JSON.parse(serv)
  //  global.array_config.push(web)
  global.array_config.push(serv)
  global.x__ = global.x__
  global.y__ = global.y__
  create_colleg(high_level,web, global.datatype, global.x__, global.y__)

  var html = ""
  var code = ""
  //elem[n].innerHTML=""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;
}
function set_tcp(high_level,n, yy, element) {

  if (n >= yy) {
    var config = document.getElementsByClassName("configurator" + n)
  }

  else {
    n = yy
    var config = document.getElementsByClassName("configurator" + n)
  }
  var code = ""
  var n_ = element.toString()
  code += '<div><label for="exampleInputMqtt">TCP node Name<br></label><input type="text" disabled="disabled" class="form-control" id="nodename" aria-describedby="emailHelp" value="' + n_ + '" placeholder="' + n_ + '"></div><br>'

  code += '<div><label for="exampleInputMqtt">TCP node Port<br></label><input type="number" class="form-control" id="tcpport"  value="" placeholder="Insert port number"></div><br>'
  code += '<button onclick="sub_tcp(tcpport.value,nodename.value,' + n + ')"  id="se' + n + '" +>Save specifications</button>'

  return config[0].innerHTML += code
}

function set_udp(high_level,n, yy, element) {

  var en = n;
  if (n >= yy) {
    var config = document.getElementsByClassName("configurator" + n)
  }

  else {
    n = yy
    var config = document.getElementsByClassName("configurator" + n)
  }
  var code = ""
  var n_ = element.toString()
  //  var n_ ="ciao"
  n = n.toString()
  code += '<div><label for="exampleInputMqtt">UDP node Name<br></label><input type="text" disabled="disabled" class="form-control" id="nodename" aria-describedby="emailHelp" value="' + n_ + '" placeholder="' + n_ + '"></div><br>'

  code += '<div><label for="exampleInputMqtt">UDP node Port<br></label><input type="number" class="form-control" id="udpport" placeholder="Insert port number"></div><br>'
  code += '<button onclick="sub_udp(udpport.value,nodename.value,' + n + ')"  id="se' + n + '">Save specifications</button>'

  return config[0].innerHTML += code
}


function sub_udp(port, elem, n) {
  var en = n
  var ele = document.getElementsByClassName("configurator" + en);

  var id__ = "42a56979."
  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);
  id__ += r;
  var udp = `{ 
          "id": "${id__}",
         "name": "${elem}",
          "type": "udp ${global.inp}",
           "ipv": "udp4",
           "multicast": "false",
            "addr": "127.0.0.1",
            "base64": false,
            "port": "${port}",
            "iface": "",
            "group": "",
             "datatype": "utf8",
            "x": "${parseInt(global.x__)}",
          "y": "${parseInt(global.y__)}",
            "wires": [[]] 
              }`
  udp = JSON.parse(udp)
  global.x__ = global.x__
  global.y__ = global.y__
  create_colleg(high_level,udp, global.datatype, global.x__, global.y__)
  // global.array_config.push(udp)
  var html = ""
  var code = ""
  //elem[n].innerHTML=""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;
}

function sub_tcp(port, elem, n) {
  var ids = "42a56979."
  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);
  ids += r;
  var tcp = `{ 
            "id": "${ids}", 
          "name": "${elem}",
           "type": "tcp ${global.inp}", 
           "ipv": "udp4",
           "z":"",
            "host": "127.0.0.1",
           "newline": "",
          "datamode": "stream",
            "base64": false,
          "end": true,
          "beserver": "client",
          "datatype": "utf8",
           "topic": "",
           "server": "server",
           "port": "${port}",
            "x": "${parseInt(global.x__)}",
            "y": "${parseInt(global.y__)}",
               "wires": [[]]
               }`
  tcp = JSON.parse(tcp)
  global.x__ = global.x__
  global.y__ = global.y__
  create_colleg(high_level,tcp, global.datatype, global.x__, global.y__)

  var ele = document.getElementsByClassName("configurator" + n);
  var html = ""
  var code = ""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;
}



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