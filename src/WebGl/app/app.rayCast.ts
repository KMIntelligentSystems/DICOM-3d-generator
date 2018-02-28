import { Injectable,OnInit } from '@angular/core';
import {Http, Response} from '@angular/http';
import {Slicer} from './app.rayCastSlicer';
import {Volume} from './app.rayCastVolume'
import {Observable} from "rxjs/Observable";
 import "rxjs/Rx";

 import {Palette} from './app.rayCastPalette';
 import {Colour} from './app.rayCastColour';
 import {GradientEditor} from './app.rayCastGradientEditor';

//import {VolumeCube} from './app.rayCastCube';

@Injectable()
export class VolumeRayCast {
    gl : WebGLRenderingContext;
    program: WebGLProgram;       
    canvas: any;
    //http: Http;
    volume: Volume;
    //volumeCube: VolumeCube;
    slicer: Slicer;
    colours: GradientEditor;
    palette: Palette;
    //Windows...
    info: any; 
    colourmaps: any;
    state: any;
    object: any;
    view: any;
    reset: any;
    filename: any;
    mobile: any;

    constructor(private http: Http){
        //this.http = http;
        this.state = {};
    }

    

    main(data) {
    
        this.gl = this.InitializeWebGL();
        //this.program = this.createProgram(this.gl, this.getShaderSource('3d-vertex-shader'), this.getShaderSource('3d-fragment-shader'));
        
      //  let gl = this.gl
       // let program = this.program; //Colour editing and palette management*/
       this.palette = new Palette(null,false);
       let paletteCanvas = document.getElementById("palette");
        this.colours = new GradientEditor(paletteCanvas, this.updateColourmap,false,false,false);

    
  //Load json data?
  /*var json = getSearchVariable("data");
  //Attempt to load default.json
  if (!json) json = "default.json";

  $('status').innerHTML = "Loading params...";
  ajaxReadFile(decodeURI(json), loadData, true);*/
  //let data = this.getJson().then((data) => {
  this.loadData(data);
  
}



/*function loadStoredData(key) {
  if (localStorage[key]) {
    try {
      var parsed = JSON.parse(localStorage[key]);
      state = parsed;
    } catch (e) {
      //if erroneous data in local storage, delete
      //console.log("parse error: " + e.message);
      alert("parse error: " + e.message);
      localStorage[key] = null;
    }
  }
}*/
//https://codecraft.tv/courses/angular/http/http-with-observables/
//The return type of http.get(…​) is Observable<Response> 
/*getJson(): Observable<Response> {
    // get users from api
    
    return this.http.get('http://localhost:4200/assets/rayCast.json')//, options)
    .map((res: Response) => { 
        return res.json()
    })
    .catch(this.handleError);

} */

getJson() {
let self = this;
    return new Promise(resolve => {
        self.http.get('http://localhost:4200/assets/rayCast.json').map(response => {
            let data = response.json();
            resolve(data);
        });
    });
}

private handleError(error: Response) {
    return Observable.throw(error.statusText);
}

loadData(src) {
    this.state = {}
    this.state.properties = {};
    this.state.colourmaps = [{}];
    this.object = {};
    this.view = {};
    this.state.views = [this.view];
    this.state.objects = [this.object];
    //Copy fields to their new locations
    //this.objects
    this.object.name = "volume";
    this.object.samples = src.objects.samples;
    this.object.isovalue = src.objects.isovalue;
    this.object.isowalls = src.objects.isoWalls;
    this.object.isoalpha = src.objects.isoalpha;
    this.object.isosmooth = src.objects.isosmooth;
    this.object.colour = src.objects.isocolour;
    this.object.density = src.objects.density;
    this.object.power = src.objects.power;
    this.object.colourmap = 0;
    this.object.tricubicfilter = src.objects.tricubicFilter;
    this.object.zmin = src.objects.Zmin;
    this.object.zmax = src.objects.Zmax;
    this.object.ymin = src.objects.Ymin;
    this.object.ymax = src.objects.Ymax;
    this.object.xmin = src.objects.Xmin;
    this.object.xmax = src.objects.Xmax;
    this.object.brightness = src.objects.brightness;
    this.object.contrast = src.objects.contrast;
    //The volume data sub-this.object
    this.object.volume = {};
    this.object.volume.url = src.objects[0].volume.url;
    this.object.volume.res = src.objects[0].volume.res;
    this.object.volume.scale = src.objects[0].volume.scale;
   // this.object.volume.autoscale = true;
    //The slicer properties
    this.object.slices = src.objects[0].slices;
    //Properties - global rendering properties
    this.state.properties.nogui = src.properties.nogui;
    //this.views - single only in old data
    this.view.axes = src.views[0].axes;
    this.view.border = src.views[0].border;
    this.view.translate = src.views[0].translate;
    this.view.rotate = src.views[0].rotate;
    //this.view.focus = parsed.volume.focus;

    //Colourmap
    this.colours.read(src.colourmaps[0].colours);
/*this.colours.update();
    this.state.colourmaps = [this.colours.palette.get()];
    delete this.state.colourmaps[0].background;
    this.state.properties.background = this.colours.palette.background.html();
  } else {
    //New format - LavaVu compatible
    this.state = parsed;
  }*/

  this.reset = this.state; //Store orig for reset
  //Storage reset?
 // if (getSearchVariable("reset")) {localStorage.removeItem(fn); console.log("Storage cleared");}
  /* LOCALSTORAGE DISABLED
  //Load any stored presets for this file
  filename = fn;
  loadStoredData(fn);
  */

  //Setup default props from original data...
  //this.state.this.objects = reset.this.objects;
  if (!this.state.objects[0].volume.res) {
  this.state.objects[0].volume.res = [256, 256, 256];
  }
  //Load the image
  this.loadTexture();
}

/*function saveData() {
  try {
    localStorage[filename] = getData();
  } catch(e) {
    //data wasn’t successfully saved due to quota exceed so throw an error
    console.log('LocalStorage Error: Quota exceeded? ' + e);
  }
}*/

/*getData(compact, matrix) {
  if (this.volume) {
    var vdat = volume.get(matrix);
    var object = state.objects[0];
    object.saturation = vdat.properties.saturation;
    object.brightness = vdat.properties.brightness;
    object.contrast = vdat.properties.contrast;
    object.zmin = vdat.properties.zmin;
    object.zmax = vdat.properties.zmax;
    object.ymin = vdat.properties.ymin;
    object.ymax = vdat.properties.ymax;
    object.xmin = vdat.properties.xmin;
    object.xmax = vdat.properties.xmax;
    //object.volume.res = parsed.res;
    //object.volume.scale = parsed.scale;
    object.samples = vdat.properties.samples;
    object.isovalue = vdat.properties.isovalue;
    object.isowalls = vdat.properties.isowalls
    object.isoalpha = vdat.properties.isoalpha;
    object.isosmooth = vdat.properties.isosmooth;
    object.colour = vdat.properties.colour;
    object.density = vdat.properties.density;
    object.power = vdat.properties.power;
    object.minclip = parsed.volume.properties.minclip;;
    object.maxclip = parsed.volume.properties.maxclip;;
    object.tricubicfilter = vdat.properties.tricubicFilter;
    if (vdat.properties.usecolourmap)
      object.colourmap = 0;
    else
      delete object.colourmap;

    //Views - single only in old data
    state.views[0].axes = vdat.properties.axes;
    state.views[0].border = vdat.properties.border;
    state.views[0].translate = vdat.translate;
    state.views[0].rotate = vdat.rotate;

    if (slicer)
       state.objects[0].slices = slicer.get();

    //Colourmap
    state.colourmaps = [colours.palette.get()];
    delete state.colourmaps[0].background;
    state.properties.background = colours.palette.background.html();
  }

  //Return compact json string
  console.log(JSON.stringify(state, null, 2));
  if (compact) return JSON.stringify(state);
  //Otherwise return indented json string
  return JSON.stringify(state, null, 2);
}

function exportData() {
  window.open('data:text/json;base64,' + window.btoa(getData()));
}

function resetFromData(src) {
  //Restore data from saved props
  if (src.objects[0].volume && volume) {
    volume.load(src.objects[0]);
    volume.draw();
  }

  if (src.objects[0].slices && slicer) {
    slicer.load(src.objects[0].slices);
    slicer.draw();
  }
}*/

loadTexture() {
  var image;
  this.loadImage('assets/data.jpg').then((img: HTMLImageElement) => {
    this.imageLoaded(img);
  });
 
  }
 
  loadImage(src) {
    return new Promise((resolve, reject)=> {
      var img = new Image();
      img.onload = ()=> {resolve(img)};
      img.src = src;
    });
}

imageLoaded(image) {
  //Create the slicer
    //if (mobile) state.objects[0].slices.show = false; //Start hidden on small screen
 if (this.state.objects[0].slices) {
    this.slicer = new Slicer(this.state.objects[0], image, "linear",null);
  }

  //Create the volume viewer
  if (this.state.objects[0].volume) {
    let interactive = true;
   // if (mobile || state.properties.interactive == false) interactive = false;
    this.volume = new Volume(this.state/*.objects[0]*/, image, interactive,null);
   this.volume.slicer = this.slicer; //For axis position

//this.volumeCube = new VolumeCube(this.state.objects[0], image, interactive,null);
  //this.volumeCube.slicer = this.slicer; 
  }
  

  //Volume draw on mouseup to apply changes from other controls (including slicer)
 // document.addEventListener("mouseup", function(ev) {if (volume) volume.delayedRender(250, true);}, false);
 // document.addEventListener("wheel", function(ev) {if (volume) volume.delayedRender(250, true);}, false);

  //Update colours (and draw objects)
  //this.colours.read(this.state.colourmaps[0].colours);
  //Copy the global background colour
  this.colours.palette.background = new Colour("rgba(81,77,74,1.0)"/*this.state.properties.background*/);
  this.colours.update()
  this.updateColourmap();

 // info.hide();  //Status
// this.volume.webgl.updateTexture(this.volume.webgl.gradientTexture, image, this.volume.gl.TEXTURE1); 
//this.volume.draw(true, true);
 //   this.volumeCube.drawCube();
 /*if (this.slicer) {
  this.slicer.updateColourmap();
 this.slicer.draw();
}*/


// 
  /*Draw speed test
  frames = 0;
  testtime = new Date().getTime();
  info.show();
  volume.draw(false, true);*/

  /*if (!state.properties.nogui) {
    var gui = new dat.GUI();
    if (state.properties.server)
      gui.add({"Update" : function() {ajaxPost(state.properties.server + "/update", "data=" + encodeURIComponent(getData(true, true)));}}, 'Update');
    /LOCALSTORAGE DISABLED
    gui.add({"Reset" : function() {resetFromData(reset);}}, 'Reset');/
    gui.add({"Restore" : function() {resetFromData(state);}}, 'Restore');
    gui.add({"Export" : function() {exportData();}}, 'Export');
    //gui.add({"loadFile" : function() {document.getElementById('fileupload').click();}}, 'loadFile'). name('Load Image file');
    gui.add({"ColourMaps" : function() {window.colourmaps.toggle();}}, 'ColourMaps');

    var f = gui.addFolder('Views');
    var ir2 = 1.0 / Math.sqrt(2.0);
    f.add({"XY" : function() {volume.rotate = quat4.create([0, 0, 0, 1]);}}, 'XY');
    f.add({"YX" : function() {volume.rotate = quat4.create([0, 1, 0, 0]);}}, 'YX');
    f.add({"XZ" : function() {volume.rotate = quat4.create([ir2, 0, 0, -ir2]);}}, 'XZ');
    f.add({"ZX" : function() {volume.rotate = quat4.create([ir2, 0, 0, ir2]);}}, 'ZX');
    f.add({"YZ" : function() {volume.rotate = quat4.create([0, -ir2, 0, -ir2]);}}, 'YZ');
    f.add({"ZY" : function() {volume.rotate = quat4.create([0, -ir2, 0, ir2]);}}, 'ZY');

   // if (volume) volume.addGUI(gui);
   // if (slicer) slicer.addGUI(gui);
  }*/

  //Save props on exit
 // window.onbeforeunload = saveData;
}

/////////////////////////////////////////////////////////////////////////
/*function autoResize() {
  if (volume) {
    volume.width = 0; //volume.canvas.width = window.innerWidth;
    volume.height = 0; //volume.canvas.height = window.innerHeight;
    volume.draw();
  }
}*/

updateColourmap() {
  if (!this.colours) return;
  //var gradient = this.colours.canvas;//$('gradient');
  let gradient = document.getElementById("gradient");
  this.colours.palette.draw(gradient, false);

if (this.volume && this.volume.webgl) {
    this.volume.webgl.updateTexture(this.volume.webgl.gradientTexture,gradient, this.volume.gl.TEXTURE1);  //Use 2nd texture unit
    this.volume.applyBackground(this.colours.palette.background.html());
    this.volume.draw(false, true);
  }

/* if (this.slicer) {
  this.slicer.updateColourmap();
    this.slicer.draw();
  }*/


var request, progressBar;

    function loadImage(imageURI, callback)
    {
        request = new XMLHttpRequest();
        request.onloadstart = showProgressBar;
        request.onprogress = updateProgressBar;
        request.onload = callback;
        request.onloadend = hideProgressBar;
        request.open("GET", imageURI, true);
        request.responseType = 'arraybuffer';
        request.send(null);
    }
    
    function showProgressBar()
    {
        progressBar = document.createElement("progress");
        progressBar.value = 0;
        progressBar.max = 100;
        progressBar.removeAttribute("value");
        document.getElementById('status').appendChild(progressBar);
    }
    
    function updateProgressBar(e)
    {
        if (e.lengthComputable)
            progressBar.value = e.loaded / e.total * 100;
        else
            progressBar.removeAttribute("value");
    }
    
    function hideProgressBar()
    {
      document.getElementById('status').removeChild(progressBar);
    }

/*
function Popup(id, x, y) {
  this.el = $(id);
  this.style = $S(id);
  if (x && y) {
    this.style.left = x + 'px';
    this.style.top = y + 'px';
  } else {
    this.style.left = ((window.innerWidth - this.el.offsetWidth) * 0.5) + 'px';
    this.style.top = ((window.innerHeight - this.el.offsetHeight) * 0.5) + 'px';
  }
  this.drag = false;*/
}

/*Popup.prototype.toggle = function() {
  if (this.style.visibility == 'visible')
    this.hide();
  else
    this.show();
}

Popup.prototype.show = function() {
  this.style.visibility = 'visible';
}

Popup.prototype.hide = function() {
  this.style.visibility = 'hidden';
}*/
InitializeWebGL(){
  var parentElement = document.body;
 this.canvas = document.createElement('canvas');
 parentElement.appendChild(this.canvas);
    //this.canvas = <HTMLCanvasElement>  document.getElementById('myCanvas');
    var gl = null;                              // WebGL rendering context
     var extensions = null;                      // Available extensions

    // ! used twice in a row to cast object state to a Boolean value
     gl = this.canvas.getContext('webgl');
    
    if (!!gl)
    {
            console.log("WebGL is initialized.");

            // Ensure WebGL viewport is resized to match canvas dimensions
            gl.viewportWidth = this.canvas.width;
            gl.viewportHeight = this.canvas.height;

           return gl;

                                                                        
    } else
        console.log("WebGL is supported, but disabled :-(");
}

public createShader(gl, source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
  }
  
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    gl.deleteShader(shader);
  }


  private createProgram(gl, vertexShader, fragmentShader) {
    
    var program = gl.createProgram();
    var vshader = this.createShader(gl, vertexShader, gl.VERTEX_SHADER);
    var fshader = this.createShader(gl, fragmentShader, gl.FRAGMENT_SHADER);

    gl.attachShader(program, vshader);
    

    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    gl.deleteProgram(program);
  }
  getShaderSource (id){
        return document.getElementById(id).textContent.replace(/^\s+|\s+$/g, '');
    }
}

 
