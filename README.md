
<h2>Prerequisites<h2>

Nodejs: version v14.20.0
npm: version 7.16.0
electron: version v22.0.0



<h2>FloWare Platform</h2>

Is a Javascript software component to support our novel approach **FloWare**.
FloWare approach is based on Software Product Line paradigm models and combining the potentialities of Flow-based Programming paradigm, to design and develop Internet of Things applications.
For the IoT application development, the [Node-RED tool](https://nodered.org/) is imported into the FloWare Platform (previously called FloWare Platform) to provide a complete working solution. Specific information regarding the approach are provided at the following [link](http://pros.unicam.it/FloWare).




<h3> FloWare Feature Model Library Installation </h3>

- Install ADOxx metamodelling platform
- import the "feature_model_library.ADL" file, containingthe library and the supporting translator to derive codes


<h3>FloWare Platform Installation</h3>
The FloWare Platform could be installed on a laptop, raspberry or in the cloud.

After cloned the repository, the commands to lunch the component are:
 1. **npm install**
 2. **electron . **


<h3>Usage</h3>
The FloWare Platform's usage is regarded primarily as the input of the feature models to represent the entire IoT domain.
We provided the "Test" directory with two examples of the XML models needed to represent the IoT system and represent the IoT devices to import into FloWare Platform. The example provided regards a simple *Smart Department's University example scenario*, highlighting different departments' functionalities and associated devices.

######

The FloWare component produces a graphical visualization of the models to allow the experts to configure the IoT system and devices. It is possible to use the tool to represent all the possible functionalities and devices that each university department can have. It is possible to choose which functionalities and devices (divided into sensors and actuators) insert into each department's configuration. Then, for each device involved, it is possible to configure the specific parameters. Some of the critical information for the devices to insert regards the communication protocol they use to send/receive the data, the exact location in which they are collocated, and the output data type they produce (to manage the data received to the tool correctly).
<figure>
<img src="https://i.ibb.co/ZxYtjK5/Untitled-Diagram-18-1.jpg" alt="Untitled-Diagram-18-1" border="0">
<figcaption>Left: The IoT system configuration; selection of functionalities and devices involved. Right: IoT device-specific configuration</figcaption>
</figure>
  
  
######

Once configured all the departments and their associated devices, the modelling part is completed, and it is possible to automatically convert the models into IoT applications.
For doing it, the developer chooses, from all the configurations available, for which departments develop the IoT application. Then, it is possible to choose which functionality to insert into the application and a list of all the corresponding selectable devices.
<figure>
<img src="https://i.ibb.co/gtJfcGT/config-selection-tool-1-1.jpg" alt="config-selection-tool-1-1" border="0">
<figcaption>Left: The department's and functionalities selection for which realise the IoT application; Right: Selection of the devices involved in the application.</figcaption>
</figure>
  
######

From selecting the devices involved in the application, the FloWare Platform automatically converts each information, saved as an XML file, into a JSON file. This JSON file is obtained to be processable by the Node-RED tool, incorporated into the FloWare Platform. The component will lunch the Node-RED tool and the derived JSON file representing the entire IoT application previously selected. In this way, it is possible to have all the device information imported into the application automatically; this allows our component to input the device's data, manipulate the data, and obtain a graphical representation of this data using an incorporated dashboard. Then, for the developer, it is possible to expand the application following itself's specific necessity.
<figure>
<img src="https://i.ibb.co/B4jMF97/Untitled-Diagram-10-1.jpg" alt="Untitled Diagram (10)-1" border="0">
<figcaption>A partial view of the flow and dashboard of the automatic IoT application obtained. </figcaption>
</figure>
 
