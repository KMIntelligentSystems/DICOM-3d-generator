import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import {AppLoadFile} from './app.loadFileComponent';




import { GuiController, Dom,Gui } from './app.GuiController';
import {CommunicationTemplateComponentModel, CommunicationTemplateItemModel, CommunicationTemplateFieldModel}  from './app.models';

//
import * as ami from 'ami.js';
import * as THREE from 'three';
import * as GUI from 'dat.gui'
import * as DICOM from 'dicom-parser'
//import * as fs from "fstream";


declare var amiObj: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit{
  title = 'app app';
 guiObj = GUI;
  amiObj = ami;
  dicomParser = DICOM;
  container: any;
  guiContainer:any;
  fileLoader: AppLoadFile;
  
  @ViewChild('container') myContainerId: ElementRef;
  @ViewChild('myguicontainer') guiContainerId: ElementRef;
  constructor() {
    this.fileLoader = new AppLoadFile();

   
   }

  ngAfterViewInit() {
    this.container = this.myContainerId.nativeElement;
    this.guiContainer = this.guiContainerId.nativeElement;
   // this.parseDicom();
 
  // this.CreateModelToElement(this.guiContainer)
 
this.render(this.guiContainer);
  
 }

 CreateModelToElement(container)
 {
    var models:CommunicationTemplateComponentModel[] = [];
    var field1 = new CommunicationTemplateFieldModel();
    field1.HelixAttribute = "Date" ;    
    var field2 = new CommunicationTemplateFieldModel();
    field2.HelixAttribute = "Name" ;   
    var text1 = new CommunicationTemplateItemModel();
    text1.Value = "Text 1"
    var text2 = new CommunicationTemplateItemModel();
    text2.Value = "Text 2"
   
    var model1 = new CommunicationTemplateComponentModel()
    model1.TextItem = text1;
    model1.FieldItem = null;
    var model2 = new CommunicationTemplateComponentModel()
    model2.TextItem = null;
    model2.FieldItem = field1;

    var model3 = new CommunicationTemplateComponentModel()
    model3.TextItem = text2;
    model3.FieldItem = null;
    var model4 = new CommunicationTemplateComponentModel()
    model4.TextItem = null;
    model4.FieldItem = field2;


    models.push(model1);
    models.push(model2);
    models.push(model3);
    models.push(model4);


    var gui = new Gui("");
    var textFolder = gui.addFolder('Text');
    // index range depends on stackHelper orientation.
   // var index = stackFolder.add(
   //   stackHelper, 'index', 0, stack.dimensionsIJK.z - 1).step(1).listen();
    
    models.forEach((templateContent: CommunicationTemplateComponentModel, index: number) => {
            if(templateContent.TextItem){
             var t =  textFolder.add(templateContent,templateContent,"TextItem", gui.params).listen();
            }
            else{
              gui.add(templateContent,templateContent,"FieldItem", gui.params);
            }
      });
      var customContainer = container;//<HTMLInputElement>document.getElementById('myguicontainer');//this.guiContainer;
      customContainer.appendChild(gui.domElement);
      
 }

 parseDicom(){
  var file = 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/36444280';
  
  var a: ArrayBuffer;
  

  this.fileLoader.fetch(file).then(
    (result: any) => {
       a = result.buffer;
    
  var byteArray = new Uint8Array(a);
  
  try
  {
     // Parse the byte array to get a DataSet object that has the parsed contents
      var dataSet = this.dicomParser.parseDicom(byteArray/*, options */);
  
      // access a string element
      var studyInstanceUid = dataSet.string('x0020000d');
  
      // get the pixel data element (contains the offset and length of the data)
      var pixelDataElement = dataSet.elements.x7fe00010;
  
      // create a typed array on the pixel data (this example assumes 16 bit unsigned data)
      var buffer = dataSet.byteArray.buffer;
      var pixelData = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
      var blob = new Blob([pixelData], {type: "octet/stream"});
    //  var myFile = this.blobToFile(blob, "C:\Users\kimmc\DICOM\brain.dat");

    
     /* fs
      .Writer({ path: "C:/Users/kimmc/DICOM/"
              , mode: 503
              , size: pixelDataElement.length
              })
      .write(myFile)
      .end()*/
  }
  catch(ex)
  {
     
  }
    
  });  
 }
 
 public blobToFile = (theBlob: Blob, fileName:string): File => {
  var b: any = theBlob;
  //A Blob() is almost a File() - it's just missing the two properties below which we will add
  b.lastModifiedDate = new Date();
  b.name = fileName;

  //Cast to a File() type
  return <File>theBlob;
}

  render(childContainer){
     var LoadersVolume = this.amiObj.default.Loaders.Volume;
     var ControlsTrackball = this.amiObj.default.Controls.Trackball;
     var HelpersStack = this.amiObj.default.Helpers.Stack;
    
   var agui = new this.guiObj.default.GUI({
    autoPlace: false,
});
    // var x = stackFolder.addFolder('stack');
     // Setup renderer0
   
     var t =<HTMLInputElement>document.getElementById('container');
     var renderer = new THREE.WebGLRenderer({
         antialias: true,
       });
     renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
     renderer.setClearColor(0x353535, 1);
     renderer.setPixelRatio(window.devicePixelRatio);
     this.container.appendChild(renderer.domElement);
     
     var scene = new THREE.Scene();
     
     // Setup camera
     var camera = new THREE.PerspectiveCamera(
       45, this.container.offsetWidth / this.container.offsetHeight, 0.01, 10000000);
     camera.position.x = 150;
     camera.position.y = 150;
     camera.position.z = 100;
     
     // Setup controls
     var controls = new ControlsTrackball(camera, this.container);
     
     /**
      * Handle window resize
      */
     /*function onWindowResize() {
       camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
       camera.updateProjectionMatrix();
     
       renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
     }
     
     window.addEventListener('resize', onWindowResize, false);*/
     
    /**
 * Build GUI
 */
function gui(stackHelper, childContainer) {
  var stack = stackHelper.stack;
 /* var gui =  new this.guiObj.default.GUI({
      autoPlace: false,
  });*/
  var gui = agui;
  var customContainer = childContainer;//<HTMLInputElement>document.getElementById('myguicontainer');//this.guiContainer;
  customContainer.appendChild(gui.domElement);

  // stack
  var stackFolder = gui.addFolder('Stack');
  // index range depends on stackHelper orientation.
  var index = stackFolder.add(
    stackHelper, 'index', 0, stack.dimensionsIJK.z - 1).step(1).listen();
  var orientation = stackFolder.add(
    stackHelper, 'orientation', 0, 2).step(1).listen();
  orientation.onChange(function(value) {
      index.__max = stackHelper.orientationMaxIndex;
      // center index
      stackHelper.index = Math.floor(index.__max/2);
  });
  stackFolder.open();

  // slice
  var sliceFolder = gui.addFolder('Slice');
  sliceFolder.add(
    stackHelper.slice, 'windowWidth', 1, stack.minMax[1] - stack.minMax[0])
    .step(1).listen();
  sliceFolder.add(
    stackHelper.slice, 'windowCenter', stack.minMax[0], stack.minMax[1])
    .step(1).listen();
  sliceFolder.add(stackHelper.slice, 'intensityAuto').listen();
  sliceFolder.add(stackHelper.slice, 'invert');
  sliceFolder.open();

  // bbox
  var bboxFolder = gui.addFolder('Bounding Box');
  bboxFolder.add(stackHelper.bbox, 'visible');
  bboxFolder.addColor(stackHelper.bbox, 'color');
  bboxFolder.open();

  // border
  var borderFolder = gui.addFolder('Border');
  borderFolder.add(stackHelper.border, 'visible');
  borderFolder.addColor(stackHelper.border, 'color');
  borderFolder.open();
}


/*function animate() {
    controls.update();
    renderer.render(scene, camera);

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }
animate();*/

// Setup loader
var loader = new LoadersVolume(this.container);

var t2 = [
    '36444280', '36444294', '36444308', '36444322', '36444336',
    '36444350', '36444364', '36444378', '36444392', '36444406',
    '36444420', '36444434', '36444448', '36444462', '36444476',
    '36444490', '36444504', '36444518', '36444532', '36746856',
];
var files = t2.map(function(v) {
    return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
});

loader.load(files)
.then(function() {
    // merge files into clean series/stack/frame structure
    var series = loader.data[0].mergeSeries(loader.data);
    var stack = series[0].stack[0];
    loader.free();
    loader = null;
    // be carefull that series and target stack exist!
    var stackHelper = new HelpersStack(stack);
    stackHelper.bbox.color = 0x8BC34A;
    stackHelper.border.color = 0xF44336;

    scene.add(stackHelper);

    // build the gui
    gui(stackHelper,childContainer);

    // center camera and interactor to center of bouding box
    var centerLPS = stackHelper.stack.worldCenter();
    camera.lookAt(new THREE.Vector3(centerLPS.x, centerLPS.y, centerLPS.z));//(centerLPS.x, centerLPS.y, centerLPS.z);
    camera.updateProjectionMatrix();
    controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    renderer.render(scene, camera);
    //animate();
  })
  .catch(function(error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
  });

  }
 
}

