import { Injectable,ViewChild, Renderer2, HostListener } from '@angular/core';
import {WebGL} from './app.rayCastWebGl';

import {Viewport} from './app.rayCastWebGl';
import {WebGlProgram} from './app.rayCastWebGl';

import {SliceView} from './app.rayCastSliceView';

@Injectable()
export class Slicer{
        
        gl : WebGLRenderingContext;
        program: WebGLProgram;
        webglProgram: WebGlProgram;       
        canvas: any;
        webgl: any;
        pixel_data: number[][];
        public pixelData: any;
        props: any;
        image: any;
        filter: any; 
        parentEl: any;
        res: any;
        dims: any;
        slices: any;
        properties: any;
        flipY: boolean;
        viewers: any;
        width: number;
        height: number;
        dimX: number;
        dimY: number;
        container: any;
       constructor(props, image, filter, parentEl){
         this.viewers = new Array<SliceView>();
        this.setup(props, image, filter, parentEl);
        //this.pixel_data = new Array();
        
       }
      

setup(props, image, filter, parentEl) {
    this.image = image;
    this.res = props.volume.res;
    this.dims = [props.volume.res[0] * props.volume.scale[0], 
                 props.volume.res[1] * props.volume.scale[1], 
                 props.volume.res[2] * props.volume.scale[2]];
    this.slices = [0.5, 0.5, 0.5];

    // Set properties
    this.properties = {};
    this.properties.show = true;
    this.properties.X = Math.round(this.res[0] / 2);
    this.properties.Y = Math.round(this.res[1] / 2);
    this.properties.Z = Math.round(this.res[2] / 2);
    this.properties.brightness = 0.0;
    this.properties.contrast = 1.0;
    this.properties.power = 1.0;
    this.properties.usecolourmap = false;
    this.properties.layout = "xyz";
    this.flipY = false;
    this.properties.zoom = 1.0;

    let startDiv = document.getElementById("startDiv");
    this.container = document.createElement("div");
    this.container.style.cssText = "position: absolute; bottom: 10px; left: 10px; margin: 0px; padding: 0px; pointer-events: none;";
    //if (!parentEl) parentEl = document.body;
     startDiv.appendChild(this.container);
  

    //Load from local storage or previously loaded file
    if (props.slices) this.load(props.slices);

    this.canvas = document.createElement("canvas"); //<HTMLCanvasElement>  document.getElementById('myCanvas');//
    this.canvas.style.cssText = "position: absolute; bottom: 0px; margin: 0px; padding: 0px; border: none; background: rgba(0,0,0,0); pointer-events: none;";

    this.doLayout();

    //this.canvas.mouse = new Mouse(this.canvas, this);

    this.webgl = new WebGL(this.canvas/*,this.program*/, null);
    this.gl = this.webgl.gl;

    this.filter = this.gl.NEAREST; //Nearest-neighbour (default)
    if (filter == "linear") this.filter = this.gl.LINEAR;

    //Use the default buffers
    this.webgl.init2dBuffers(this.gl.TEXTURE2);

    //Compile the shaders
    this.webglProgram = new WebGlProgram(this.gl, 'texture-vs', 'texture-fs');
   // if (this.program.errors) OK.debug(this.program.errors);
    this.webglProgram.setup(["aVertexPosition"], ["palette", "texture", "colourmap", "cont", "bright", "power", "slice", "dim", "res", "axis", "select"],null);

    this.webgl.setProgram(this.webglProgram);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.SCISSOR_TEST);

    //Load the textures
    this.loadImage(this.image);

    //Hidden?
   // if (!this.properties.show) this.toggle();
  }

  /*Slicer.prototype.toggle = function() {
    if (this.container.style.visibility == 'hidden')
      this.container.style.visibility = 'visible';
    else
      this.container.style.visibility = 'hidden';
  }*/

  

  get() {
    var data = {};
    //data.colourmap = colours.palette.toString();
   // data.properties = this.properties;
    return data;
  }

  load(src) {
    //colours.read(data.colourmap);
    //colours.update();
    for (var key in src.properties)
      this.properties[key] = src.properties[key]
  }

  setX(val) {this.properties.X = val * this.res[0]; this.draw();}


  setY(val) {this.properties.Y = val * this.res[1]; this.draw();}
  setZ(val) {this.properties.Z = val * this.res[2]; this.draw();}

  doLayout() {
   

    var x = 0;
    var y = 0;
    var xmax = 0;
    var ymax = 0;
    var rotate = 0;
    var alignTop = true;

    //removeChildren(this.container);

    var that = this;
    var buffer = "";
    var rowHeight = 0, rowWidth = 0;
    var addViewer = function(idx) {
      var mag = 1.0;
      if (buffer) mag = parseFloat(buffer);
      var v = new SliceView(that, x, y, idx, rotate, mag);
      that.viewers.push(v);
     
      that.container.appendChild(v.div);

     x += v.viewport.width + 5; //Offset by previous width
      var h = v.viewport.height + 5;
      if (h > rowHeight) rowHeight = h;
      if (x > xmax) xmax = x;

     y += v.viewport.height + 5; //Offset by previous height
      var w = v.viewport.width + 5;
      if (w > rowWidth) rowWidth = w;
      if (y > ymax) ymax = y;
    }

    //Process based on layout
    this.flipY = false;
    for (var i=0; i<this.properties.layout.length; i++) {
      var c = this.properties.layout.charAt(i);
      rotate = 0;
      switch (c) {
        case 'X':
          rotate = 90;
        case 'x':
          addViewer(0);
          break;
        case 'Y':
          rotate = 90;
        case 'y':
          addViewer(1);
          break;
        case 'Z':
          rotate = 90;
        case 'z':
          addViewer(2);
          break;
        case '|':
//          x = 0;
//          y += rowHeight; //this.viewers[this.viewers.length-1].viewport.height + 5; //Offset by previous height
//          rowHeight = 0;

          y = 0;
         // x += rowWidth;
          rowWidth = 0;
          break;
        case '_':
          this.flipY = true;
          break;
        case '-':
          alignTop = false;
          break;
        default:
          //Add other chars to buffer, if a number will be used as zoom
          buffer += c;
          continue;
      }
      //Clear buffer
      buffer = "";
    }

   this.width = xmax;
    this.height = y + rowHeight; //this.viewers[this.viewers.length-1].viewport.height;

    this.width = x + rowWidth;
    this.height = ymax;

    //Restore the main canvas
    this.container.appendChild(this.canvas);

    //Align to top or bottom?
    //console.log(this.height);
    //console.log(this.height + " : top? " + alignTop);
   if (alignTop) {
      this.container.style.bottom = "";
      this.container.style.top = (this.height + 10) + "px";
    } else {
      this.container.style.top = undefined;
      this.container.style.bottom = 10 + "px";
    }
  }

  loadImage(image) {
    //Texture load
    for (var i=0; i<3; i++)
      this.webgl.loadTexture(image, this.filter);
    this.reset();
  }

  reset() {
    this.dimX = this.image.width / this.res[0];
    this.dimY = this.image.height / this.res[1];
    //console.log(this.res[0] + "," + this.res[1] + "," + this.res[2] + " -- " + this.dimx + "x" + this.dimy);
  }

  updateColourmap() {
    let gradientCanvas = document.getElementById("gradient");
    this.webgl.updateTexture(this.webgl.gradientTexture,gradientCanvas, this.gl.TEXTURE2);  //Use 2nd texture unit
    this.draw();
  }

  draw() {
      let gl = this.gl;
    this.slices = [(this.properties.X-1)/(this.res[0]-1), 
                   (this.properties.Y-1)/(this.res[1]-1),
                   (this.properties.Z-1)/(this.res[2]-1)];

    if (this.width != this.canvas.width || this.height != this.canvas.height) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.setAttribute("width", this.width);
      this.canvas.setAttribute("height", this.height);
      if (this.webgl) {
        //this.gl.drawingBufferWidth = this.width;
        //this.canvas.Height = this.height;
        this.webgl.viewport = new Viewport(0, 0, this.width, this.height);
      }
    }
    //console.log(this.gl.viewportWidth + " x " + this.gl.viewportHeight);
    //console.log(this.width + " x " + this.height);

    this.webgl.use(this.webglProgram);

    //Uniform variables

    //Gradient texture
   /* this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.webgl.gradientTexture);
    this.gl.uniform1i(this.program.uniforms["palette"], 0);*/

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.webgl.gradientTexture);
    this.gl.uniform1i(this.webglProgram.uniforms["palette"], 0);
    //Options
    this.gl.uniform1i(this.webglProgram.uniforms["colourmap"], this.properties.usecolourmap);

    // brightness and contrast
    this.gl.uniform1f(this.webglProgram.uniforms["bright"], this.properties.brightness);
    this.gl.uniform1f(this.webglProgram.uniforms["cont"], this.properties.contrast);
    this.gl.uniform1f(this.webglProgram.uniforms["power"], this.properties.power);

    //Image texture
   this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.webgl.textures[0]);
    this.gl.uniform1i(this.webglProgram.uniforms["texture"], 1);


    
    //Clear all
    this.gl.scissor(0, 0, this.width, this.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    //Draw each slice viewport
    for (var i=0; i<this.viewers.length; i++)
      this.drawSlice(i);
  }

  drawSlice(idx) {
    var view = this.viewers[idx];
    var vp = view.viewport;

    //Set selection crosshairs
    var sel;
    if (view.rotate == 90)
      sel = [1.0 - this.slices[view.j], this.slices[view.i]];
    else
      sel = [this.slices[view.i], this.slices[view.j]];
    
    //Swap y-coord
    if (!this.flipY) sel[1] = 1.0 - sel[1];

   // this.webgl.viewport = vp;
    this.gl.scissor(vp.x, vp.y, vp.width, vp.height);
    //console.log(JSON.stringify(vp));

    //Apply translation to origin, any rotation and scaling (inverse of zoom factor)
this.webgl.modelView.identity();

this.webgl.modelView.translate([0.5, 0.5, 0.5])
this.webgl.modelView.rotate(-view.rotate, [0, 0,1]);//-view.rotate


    //Apply zoom and flip Y
   var scale = [1.0/2.0, -1.0/2.0, -1.0];
    if (this.flipY) scale[1] = -scale[1];
    this.webgl.modelView.scale(scale);
    
    //Texturing
    //this.gl.uniform1i(this.program.uniforms["slice"], ));
   this.gl.uniform3f(this.webglProgram.uniforms['slice'], this.slices[0], this.slices[1], this.slices[2]);
    this.gl.uniform2f(this.webglProgram.uniforms["dim"], this.dimX, this.dimY);
    this.gl.uniform3i(this.webglProgram.uniforms["res"], this.res[0], this.res[1], this.res[2]);
    this.gl.uniform1i(this.webglProgram.uniforms["axis"], view.axis);
    //Convert [0,1] selection coords to pixel coords
    this.gl.uniform2i(this.webglProgram.uniforms["select"], vp.width * sel[0] + vp.x, vp.height * sel[1] + vp.y);

    this.webgl.initDraw2d();
    this.gl.enable(this.gl.BLEND);

    //Draw, single pass
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.webgl.vertexPositionBuffer.numItems);
  }

  public setPixelData(data: number[]){
    this.pixel_data.push(data);
  }
  
}

