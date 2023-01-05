/* import 'configuration'
import 'configuration-renderer'
import 'configurator'
import 'constraint-solver'
import 'model'
import 'logic-solver'
import 'feature' */

import * as electron from 'electron';

import { createWindowsInstaller } from 'electron-winstaller';
import * as express from "express";
import { ipcRenderer } from 'electron';
import { empty } from 'rxjs';
import { data } from 'jquery';
import { NOMEM } from 'dns';
var sensors1
var actuators1
var elements
var xml
var change = [];
var html;
var x;
var y;
var label = new Array();
var parsed = []
var selected = []
var appl_pro = []
var encrypt = []
var totalF = []
var data_type = []
var encrypt = new Array();
global.inp = "";
var valid = false;
global.x__ = 100;
global.y__ = 100;
var coll = "#ex"
import { parseString } from 'xml2js';
var configuration_complete;
global.gobal_node = new Array;
global.mqtt_node = new Array;
global.udpnode = new Array;
global.tcpnode = new Array;
global.loranode = new Array;
global.websocket = new Array;
global.http = new Array;
global.datatype = "";
global.encrypt_ = null
var newElem;
var code = ''
var yy = 0;
global.array_config = [];
var renderer_ = false
ipcRenderer.send("ping", "ping");
ipcRenderer.on('ping-reply', (event, z) => {
  elements = z
  calculate_elements(elements);
})

function calculate_elements(elem) {

  $.get("sensor.xml", function (data) {

    xml = data
  })
  var arraySensor_actuator = [];
  arraySensor_actuator = elem
  $("#smartSensor").click(function () {
    var n = 0;

    arraySensor_actuator.forEach(element => {

      var tag = document.createElement("div");

      var elements = document.getElementById("new");

      var conf = document.createElement("div");

      var x = document.createElement("p");
      var title = "Configuration of " + element.name + " element"
      var t = document.createTextNode(title);
      x.appendChild(t);
      elements.appendChild(x)

      conf.setAttribute("class", "configurator" + n)
      elements.appendChild(conf)

      n++;
    });
    n = 0;


    arraySensor_actuator.forEach(element => {
      try {
        window.app = new Configurator(new Model(new XmlModel(xml)), {

          target: $(".configurator" + n),

          renderer: {
            renderAround: function (fn) {
              //var html=""
              var code = ""

              if (n <= yy && renderer_ == true) { var coll = "#ex"; coll += yy.toString(); n = yy }
              else if (n > yy && renderer_ == true) { var coll = "#ex"; coll += n.toString() }
              else if (renderer_ == false) {
                var coll = ""
                coll = "#ex" + n
              }

              html = "<p>This configuration is " + (this.configuration.isValid() ? "valid" : "invalid") +
                " and " + (this.configuration.isComplete() ? "complete" : "incomplete") + ".</p>";
              html += fn();
              html += code;
              valid = this.configuration.isValid();
              complete = this.configuration.isComplete();

              if (valid == true && complete == true) {
                configuration_complete = this.configuration.serialize();
              }

              html += '<button id="ex' + n + '"' + (this.configuration.isComplete() ? "" : "disabled") + '>Analyze ' + element.name + ' configuration</button>';
              html += '<br><hr></hr><br>'
              return html;
            },

            afterRender: function () {

              var self = this;


              if (n <= yy && renderer_ == true) { var coll = "#ex"; coll += yy.toString(); n = yy }
              else if (n > yy && renderer_ == true) { var coll = "#ex"; coll += n.toString() }
              else if (renderer_ == false) {
                var coll = "#ex"
                coll += n.toString()
              }

              $(coll).click(function () {
                selected = []
                parsed = []
                totalF = []
                appl_pro = []
                encrypt = []
                data_type = []
                coll = "#ex"
                n = 0;
                // $("pre").empty().text(self.configuration.serialize());
                configuration_complete = self.configuration.serialize();

                newElem = { "name": element.name, "configuration": self.configuration.serialize() }
                label.push(newElem)
                parseString(configuration_complete, function (err, result) {

                  for (var i = 0; i < global.tutteFeatures.length; i++) {
                    parsed[i] = result.configuration.feature[i].$;
                  }
                })
                var nn = 0;
                for (item in parsed) {
                  if (parsed[item].automatic == "selected" || parsed[item].manual == "selected") {
                    selected[nn] = parsed[item]
                    nn++;
                  }
                }
                totalF = global.tutteFeatures
                for (x in totalF) {
                  for (y in selected) {
                    if (totalF[x].parent != null) { //non è la root del sistema
                      if ((selected[y].name == totalF[x].name && totalF[x].parent.name == "Application_protocol") && (selected[y].automatic == "selected" || selected[y].manual == "selected")) {
                        appl_pro.push(totalF[x]) //application_protocol selected
                      }

                      if ((selected[y].name == totalF[x].name && totalF[x].parent.name == "Data_type") && (selected[y].automatic == "selected" || selected[y].manual == "selected")) {
                        data_type.push(totalF[x]) //data_type selected 
                        global.datatype = totalF[x].name

                      }
                      // se c'è encryption
                      if ((selected[y].name == totalF[x].name && totalF[x].parent.name == "Encryption") && (selected[y].automatic == "selected" || selected[y].manual == "selected")) {

                        encrypt.push(totalF[x]) //encryption selected 
                        global.encrypt_ = totalF[x].name
                      }
                    }
                  }
                }
                if (appl_pro.length > 0) {

                  var len = 0
                  var len2 = 0;
                  len3 = 0
                  if (appl_pro.length == 1) { len = 0 } else if (appl_pro.length > 1) { len = appl_pro.length - 1 }
                  if (data_type.length == 1) { len2 = 0 } else if (data_type.length > 1) { len2 = data_type.length - 1 }
                  if (encrypt.length == 1) { len3 = 0 } else if (encrypt.length > 1) { len3 = encrypt.length - 1 }

                  if (element.parent != null && element.parent.name == "sensors") {
                    global.inp = "in"
                  }
                  else if (element.parent != null && (element.parent.name == "actuators" || element.parent.name == "Alarm")) {
                    global.inp = "out"
                  } else { global.inp = "out" }

                  if (appl_pro[len].name == "MQTT" || appl_pro[len].name == "mqtt" || appl_pro[len].name == "Mqtt") {

                    set_mqtt(n, yy, element.name, global.inp);
                  }
                  else if (appl_pro[len].name == "UDP" || appl_pro[len].name == "udp" || appl_pro[len].name == "Udp") {

                    set_udp(n, yy, element.name, global.inp);
                  }
                  else if (appl_pro[len].name == "TCP" || appl_pro[len].name == "tcp" || appl_pro[len].name == "Tcp") {

                    set_tcp(n, yy, element.name, global.inp);
                  }
                  else if (appl_pro[len].name == "WebSocket" || appl_pro[len].name == "websocket" || appl_pro[len].name == "WEBSOCKET") {

                    set_websocket(n, yy, element.name, global.inp);
                  }
                  else if (appl_pro[len].name == "HTTP" || appl_pro[len].name == "http" || appl_pro[len].name == "Http") {

                    set_http(n, yy, element.name, global.inp);
                  }
                  else if (appl_pro[len].name == "lorawan" || appl_pro[len].name == "LORAWAN" || appl_pro[len].name == "LoRaWan") {

                    set_lora(n, yy, element.name, global.inp);
                  }
                }



              })


            },
          },
        }
        ); n++;
      } catch (e) {
        alert(e)
      }

    });
  });



  $("#complete").click(function () {



    ipcRenderer.send("setMyGlobalConfiguration3", global.array_config);
  })
}





function set_mqtt(n, yy, element) {
  var config;
  if (n >= yy) {
    var config = document.getElementsByClassName("configurator" + n)
  }

  else {
    n = yy
    var config = document.getElementsByClassName("configurator" + n)
  }
  var code = ""
  var n_ = element.toString()

  // config[0].append(document.createElement("div"));
  // code += "<input type='checkbox' id='serverMQTT' onclick='checked()' name='server' value=''><label for='servermqtt'>Imposta MQTT server</label><br>"
  code += '<div><label for="exampleInputMqtt">Mqtt node Name<br></label><input type="text" disabled="disabled" class="form-control" id="nodename" aria-describedby="emailHelp" value="' + n_ + '" placeholder="' + n_ + '"></div><br>'
  code += '<div><label for="exampleInputMqtt">Mqtt node QoS<br></label><select name="qos" id="qos"><option value="0">0</option><option value="1">1</option><option value="2">2</option></select></div>'
  code += '<div><label for="exampleInputMqtt">Mqtt node Topic<br></label><input type="text" class="form-control" id="topic" aria-describedby="emailHelp" placeholder="Insert topic"></div><br>'

  code += '<div><label for="exampleInputMqtt">Mqtt Broker Server Name<br></label><input type="text" class="form-control" id="brokername" aria-describedby="emailHelp" placeholder="www.brokername.com"></div><br>'
  code += '<div><label for="exampleInputMqtt">Mqtt Broker Port<br></label><input type="number" class="form-control" id="brokerport" aria-describedby="emailHelp" placeholder="Insert broker port"></div><br>'


  code += `<button onclick="subm(nodename.value, qos.value, topic.value, brokername.value, brokerport.value,${n})"  id="se${n}">Save specifications</button>`
  return config[0].innerHTML += code
}

function create_colleg(node, datatype, x, y) {
  var node = node;
  var encr;
  var min = 1
  var max = 999999
  var r = parseInt(Math.random() * (max - min) + min);
  x = parseInt(global.x__)
  y = parseInt(global.y__)
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
      "y": "${parseInt(y-60)}",
      "wires": [
        []
      ]
    }`

    encr = JSON.parse(encr)
    decr = JSON.parse(decr)

    if (node.type.includes("in") || (node.type.includes("uplink") || (node.type.includes("request")))) {
      node.wires[0].push(encr_id)
    }
    else if (node.type.includes("out") || (node.type.includes("downlink"))) {
      //encr.wires[0].push(node.id)
    }
  }

  if (datatype == "Numeric") {
    var id_json = `82e7263f.${r}`
    var id_debug = `2a08c57b.${r}`
    var id_chart = `9d19d8fc.${r}`
    var id_template = `46dg574s.${r}`;
    var id_gauge = `a82ffb36.${r}`;
    var id_ui_group = `dca5gfd0.${r}`

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
                    "y":${y - parseInt(20)},
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
     "x": ${x + parseInt(380)},
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
               "x": ${x + parseInt(370)},
                "y":${y},
                "wires": [
                    [
                     "${id_debug}",
                     "${id_gauge}",
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
     "x": ${x + parseInt(590)},
      "y":${y - parseInt(60)},
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
      "x": ${x + parseInt(110)},
      "y":${y - parseInt(60)},
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
        node2.x.push(x_)
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
          "y":${y+parseInt(40)},
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

  global.x__ = x;
  global.y__ = y + 150;
  if (global.encrypt_ != null) {
    global.array_config.push(encr)
  }
  global.array_config.push(node)
  global.encrypt_ = null;
  global.inp = null;
}


function subm(node, qos, topic, broker, port, n) {
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

  create_colleg(node__, global.datatype, global.x__, global.y__)



  var ele = document.getElementsByClassName("configurator" + n);
  var html = ""
  var code = ""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;

}



function set_lora(n, yy, element) {

  if (n >= yy) {
    var config = document.getElementsByClassName("configurator" + n)
  }

  else {
    n = yy
    var config = document.getElementsByClassName("configurator" + n)
  }
  var code = ""
  var n_ = element.toString()

  code += '<div><label for="exampleInputMqtt">LoRa node Name<br></label><input type="text" disabled="disabled" class="form-control" id="nodename" aria-describedby="emailHelp" value="' + n_ + '" placeholder="' + n_ + '"></div><br>'
  code += '<div><label for="exampleInputMqtt">Lora device Id<br></label><input type="text"  class="form-control" id="loraid" aria-describedby="emailHelp"  placeholder="Insert LoRa device id"></div><br>'
  code += '<div><label for="exampleInputMqtt">Lora device field<br></label><input type="text" class="form-control" id="lorafield" aria-describedby="emailHelp" placeholder="Insert  LoRa device field"></div><br>'
  code += '<div><label for="exampleInputMqtt">Lora Server application id<br></label><input type="text" class="form-control" id="loraappid" aria-describedby="emailHelp" placeholder="Insert  LoRa application id"></div><br>'
  code += '<div><label for="exampleInputMqtt">Lora Server application key<br></label><input type="text" class="form-control" id="loraappkey" aria-describedby="emailHelp" placeholder="Insert  LoRa application key"></div><br>'
  if (global.inp == "out") {
    code += '<div><label for="exampleInputMqtt">Lora Server port<br></label><input type="number" class="form-control" id="loraport" aria-describedby="emailHelp" placeholder="Insert  LoRa port"></div><br>'
    code += '<button onclick="sub_lora(loraid.value,lorafield.value,loraappid.value,loraappkey.value,nodename.value, loraport.value,' + n + ')"  id="se' + n + '" +>Save specifications</button>'

  }
  else {
    code += '<button onclick="sub_lora(loraid.value,lorafield.value,loraappid.value,loraappkey.value,nodename.value, null,' + n + ')"  id="se' + n + '" +>Save specifications</button>'

  }
  return config[0].innerHTML += code
}

function sub_lora(deviceid, field, applid, key, element, port, n) {
  var ele = document.getElementsByClassName("configurator" + n);
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

  create_colleg(device, global.datatype, global.x__, global.y__)
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
function set_http(n, yy, element) {


  if (n >= yy) {
    var config = document.getElementsByClassName("configurator" + n)
  }

  else {
    n = yy
    var config = document.getElementsByClassName("configurator" + n)
  }
  var code = ""
  var n_ = element.toString()
  code += '<div><label for="exampleInputMqtt">HTTP node Name<br></label><input type="text" disabled="disabled" class="form-control" id="nodename" aria-describedby="emailHelp" value="' + n_ + '" placeholder="' + n_ + '"></div><br>'
  code += '<div><label for="exampleInput">HTTP Path <br></label><input type="text" class="form-control" id="httppath"  value="" placeholder="Insert /path"></div><br>'
  code += '<div><label for="exampleInput">HTTP method<br></label><select name="method" id="method"><option selected value="GET">GET</option><option value="post">POST</option><option value="put">PUT</option><option value="delete">DELETE</option><option value="patch">PATCH</option></select></div>'

  code += '<button onclick="sub_http(httppath.value, method.value,nodename.value,' + n + ')"  id="se' + n + '" +>Save specifications</button>'
  return config[0].innerHTML += code
}

function sub_http(path, method, name, n) {
  var ele = document.getElementsByClassName("configurator" + n);
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
        "url": "${path}",
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
      "y": "${parseInt(global.y__) - 50}",
    "wires": [
      [
        "${node_.id}"
      ]
    ]
  }`

  inject = JSON.parse(inject)
  global.array_config.push(inject)
  global.x__ = global.x__
  global.y__ = global.y__

  create_colleg(node_, global.datatype, global.x__, global.y__)
  // global.array_config.push(node_)
  var html = ""
  var code = ""
  //elem[n].innerHTML=""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;
}

function set_websocket(n, yy, element) {

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

function sub_websocket(path, elem, n) {
  var ele = document.getElementsByClassName("configurator" + n);
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
  create_colleg(web, global.datatype, global.x__, global.y__)

  var html = ""
  var code = ""
  //elem[n].innerHTML=""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;
}
function set_tcp(n, yy, element) {

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

function set_udp(n, yy, element) {

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
  create_colleg(udp, global.datatype, global.x__, global.y__)
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
  create_colleg(tcp, global.datatype, global.x__, global.y__)

  var ele = document.getElementsByClassName("configurator" + n);
  var html = ""
  var code = ""
  ele[0].innerHTML = ""
  n++
  renderer_ = true
  yy++;
}

