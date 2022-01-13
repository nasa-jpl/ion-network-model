 *********************************
 README
 *********************************
# DTN Configuration Tool
 This is a DTN Configuration Tool, used to draw a skeletal outline of a DTN Network, input some configuration information, and output a JSON file. 
## Documentation

### Installation
 
 This tool can be run offline on Mozilla Firefox just fine because of a default setting that other browsers do not have enabled. Just open 'index.html' in Firefox. To run this tool on other browsers, it must be run on a server. In the future, the tool may be hosted permanently, but for now, you can host it locally by running the 'server.js' script.
 
  First, install Connect and Serve-Static with NPM(you only have to do this once):
  ```
  $ npm install connect serve-static
  ```
  
  Then you can run the server script with:
  ```
  $ node server.js
  ```
  
  The terminal will tell you which port the server is running on and then you can open any browser and go to: 
  ```
  localhost:****
  ```
  
 **** being the port number. e.g. 8000. More information can be found here: https://stackoverflow.com/questions/6084360/using-node-js-as-a-simple-web-server
 
 ### Instructions
 
 Many of the instructions and controls for this tool can be found in the Help menu under Instructions and Notes.
 
 #### View Options
 In the view menu, options are available to view only nodes, only hosts, everything, and just a single host(Host Editor Mode). Labels can be toggled on or off in this menu. The user can hide objects with the 'H' key and unhide all with 'SHIFT'+'H'. With these options, you can simplify visualizing large networks. 
 
 #### Host Editor Mode
 With a host selected, go to the View Menu and select 'This Host' to enter Host Editor Mode. The label of the host that is being edited will appear in the top left corner of the editor. If the host has nodes, you will be able to visualize intra-host links in this mode. If the host doesnt have any nodes yet, press 'A' to add some and they will be automatically added to the host.
 
 #### Hierarchy Window
 In the window menu, click 'Hierarchy' to toggle the hierarchy window. This window lists all the objects in the scene allowing the user to select objects that may not be easily visible(hidden for example).

 ### Future Changes Guide

 Check 'index.html' for the structure/layout of the webpage. This will give you a general understanding of how the website in structured. This holds all the script references, menu information, and script order, which is useful for determining the scope of certain variables in the javascript files. 

 'main.css' is the css file, which holds the style of the html elements. Change this if you want to change the look of the 2D elements of the webpage. 

 'useful_functions.js' holds the node, host, and link classes. Change this if you want to change the structure of the classes, or if you want to add more fields/data in the nodes or links. It also holds some useful funtions for getting nodes or links given the 3D object. 

 'initialization.js' is a large script that holds most of the initialization code. This sets up the 3D scene, and places the grid plane along with the first node. This script also holds the node/host creation functions and a few other useful functions.

 'link_implementation.js' is a script that is self-expanatory. It holds the code for drawing links between nodes. 

 '3Dapp.js' holds the render function, which is called every frame. It also holds most of the event handlers and many of the functions that make the app interactive, such as moving around the nodes. 

 'context_menu_manipulations.js' is another large script that controls how the user inputs information into the node, host, and link editors. It gets the input from user and displays it/saves it. Check this script out if you want to add functionality to the menus.

 'jsonFileExporter.js' is a script that controls the exporting of JSON files. It converts the saved object node and link data into a json string, and generates a file that is saves to the computer. Functions from this script are called when pressing the generate JSON file button. If there are problems with the JSON file exported, or if extra fields should be added, make sure you change this script accordingly. 


 ### Aesthetic Improvements

 If you want to improve how the webpage looks, first take a look at the html and css files to change the apearance of the 2D elements and the background of the 3D scene (because the 3D scene is transparent).

 If you want to change how the 3D aspect of the website looks, first look at 'initialization.js'. From here you could change how the nodes look, how the ground plane looks. 

