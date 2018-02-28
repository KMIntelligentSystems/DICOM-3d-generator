
import { Injectable,ViewChild, Renderer2, HostListener } from '@angular/core';
import {Slicer} from './app.rayCastSlicer';
import {WebGL} from './app.rayCastWebGl';
import {WebGlProgram} from './app.rayCastWebGl';
import {Viewport} from './app.rayCastWebGl';
import {Colour} from './app.rayCastColour';
//import * as mat4 from "./gl-m4";
import {mat4} from "gl-matrix";
import {quat} from "gl-matrix";
import * as mat from "./app.mat4";

@Injectable()
export class Volume {
    gl : WebGLRenderingContext;
    program: WebGlProgram;       
    webgl: WebGL;
    image: any;
    canvas: any;
    rotating: boolean;
    translate: any;
    focus: any;
    centre: any;
    modelsize: any;
    scale: any;
    rotate:any;
    rotateX: any;
    rotateY: any;
    rotateZ: any;
    orientation: any;
    fov: any;
    focalLength: any;
    resolution: any;
    background: any;
    webglLine: any;

    lineprogram: any;
    borderColour: any;
    boxPositionBuffer: any;
    boxIndexBuffer: any;
    invPMatrix: any;
                //Calculated scaling
    res: any;
    dims: any;
    scaling: any;
    tiles: any;
    iscale: any;
    linePositionBuffer: any;    
    lineColourBuffer: any;
    properties: any;
    frames: number;
    testtime: number;
    width: number;
    height: number;
    slicer: Slicer;
    samples: any;
    props;
    constructor(state, image, interactive, parentEl){
            this.props = state.objects[0];
            this.image = image;
            this.frames = 0;
            let startDiv = document.getElementById("startDiv");
            this.canvas = document.createElement("canvas");//<HTMLCanvasElement>  document.getElementById('myCanvas');//
            this.canvas.style.cssText = "width: 100%; height: 100%; z-index: 0;position: margin: 0px; padding: 0px; background: black; border: none; display:block;";
           // if (!parentEl) parentEl = document.body;
            //parentEl.appendChild(this.canvas);
            startDiv.appendChild(this.canvas);
        
            //canvas event handling
         /*   this.canvas.mouse = new Mouse(this.canvas, this);
            this.canvas.mouse.moveUpdate = true; //Continual update of deltaX/Y
        
            this.background = new Colour(0xff404040);*/
            this.borderColour = new Colour(0xffbbbbbb);
        
            this.width = this.height = 0; //Auto-size

            this.webgl = new WebGL(this.canvas,null);
          //  this.webglLine = new WebGL(this.canvas,/*this.program,*/null);
            //
            this.gl = this.webgl.gl

            //this.webgl = new WebGL(this.canvas,/*this.program,*/null);
            //this.gl = this.webgl.gl;
            
            
            this.rotating = false;
            this.translate = [0,0,4];
            this.rotate = quat.create();
            quat.identity(this.rotate);
            this.focus = [0,0,0];
            this.centre = [0,0,0];
            this.modelsize = 1;
            this.scale = [1, 1, 1];
            this.orientation = 1.0; //1.0 for RH, -1.0 for LH
            this.fov = 45.0;
            this.focalLength = 1.0 / Math.tan(0.5 * this.fov * Math.PI/180);
            this.resolution = this.props.volume["res"];
        
            //Calculated scaling
            this.res = this.props.volume["res"];
            this.dims = this.props.volume["scale"];
            this.scaling = this.dims;
            //Auto compensate for differences in resolution..
            if (this.props.volume.autoscale) {
            //Divide all by the highest res
            var maxn = Math.max.apply(null, this.res);
            this.scaling = [this.res[0] / maxn * this.dims[0], 
                            this.res[1] / maxn * this.dims[1],
                            this.res[2] / maxn * this.dims[2]];
            }
            this.tiles = [this.image.width / this.res[0],
                        this.image.height / this.res[1]];
            this.iscale = [1.0 / this.scaling[0], 1.0 / this.scaling[1], 1.0 / this.scaling[2]]
        
            //Set dims
            this.centre = [0.5*this.scaling[0], 0.5*this.scaling[1], 0.5*this.scaling[2]];
            this.modelsize = Math.sqrt(3);
            this.focus = this.centre;
        
            this.translate[2] = -this.modelsize*1.25;
        
            //OK.debug("New model size: " + this.modelsize + ", Focal point: " + this.focus[0] + "," + this.focus[1] + "," + this.focus[2]);
        
            //Setup 3D rendering
            this.linePositionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linePositionBuffer);
            var vertexPositions = [-1.0,  0.0,  0.0,
                                    1.0,  0.0,  0.0,
                                    0.0, -1.0,  0.0, 
                                    0.0,  1.0,  0.0, 
                                    0.0,  0.0, -1.0, 
                                    0.0,  0.0,  1.0];
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositions), this.gl.STATIC_DRAW);
            this.linePositionBuffer.itemSize = 3;
            this.linePositionBuffer.numItems = 6;
        
            this.lineColourBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lineColourBuffer);
            var vertexColours =  [1.0, 0.0, 0.0, 1.0,
                                    1.0, 0.0, 0.0, 1.0,
                                    0.0, 1.0, 0.0, 1.0,
                                    0.0, 1.0, 0.0, 1.0,
                                    0.0, 0.0, 1.0, 1.0,
                                    0.0, 0.0, 1.0, 1.0];
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexColours), this.gl.STATIC_DRAW);
            this.lineColourBuffer.itemSize = 4;
            this.lineColourBuffer.numItems = 6;
        
            //Bounding box
            this.box([0.0, 0.0, 0.0], [1.0, 1.0, 1.0]);
        
            //Setup two-triangle rendering
            //this.webgl.init2dBuffers(this.gl.TEXTURE1); //Use 2nd texture unit
            this.webgl.init2dBuffers(this.gl.TEXTURE1); 
            //Override texture params set in previous call
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
            //this.webgl.loadTexture(image, this.gl.LINEAR);
            this.webgl.loadTexture(image, this.gl.LINEAR);
        
            //Compile the shaders
          //  var IE11 = !!window.MSInputMethodContext;  //More evil user-agent sniffing, broken WebGL on windows forces me to do this
            this.lineprogram = new WebGlProgram(this.gl, 'line-vs', 'line-fs');
            //mine
            this.webgl.setProgram(this.lineprogram);
            //if (this.lineprogram.errors) OK.debug(this.lineprogram.errors);
            this.lineprogram.setup(["aVertexPosition", "aVertexColour"], ["uColour", "uAlpha"]);
            this.gl.vertexAttribPointer(this.lineprogram.attributes["aVertexPosition"], this.linePositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.vertexAttribPointer(this.lineprogram.attributes["aVertexColour"], this.lineColourBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        
           var defines = "precision highp float; const highp vec2 slices = vec2(" + this.tiles[0] + "," + this.tiles[1] + ");\n";
            defines += "#define NOT_IE11\n";
            var maxSamples = interactive ? 1024 : 256;
            defines += "const int maxSamples = " + maxSamples + ";\n\n\n\n\n\n"; //Extra newlines so errors in main shader have correct line #
           // OK.debug(defines);*/
           
           this.setVolumeProg(state);
        }

        setVolumeProg(props)
        {
            this.program = new WebGlProgram(this.gl, 'volume-vs', 'volume-fs');
            //this.webgl.setProgram(this.program);
            //console.log(defines + fs);
            //if (this.program.errors) OK.debug(this.program.errors);
            this.program.setup(["aVertexPosition"], 
                            ["uBackCoord", "uVolume", "uTransferFunction", "uEnableColour", "uFilter",
                                "uDensityFactor", "uPower", "uSaturation", "uBrightness", "uContrast", "uSamples",
                                "uViewport", "uBBMin", "uBBMax", "uResolution", "uRange", "uDenMinMax",
                                "uIsoValue", "uIsoColour", "uIsoSmooth", "uIsoWalls", "uInvPMatrix"],null);
            this.webgl.setProgram(this.program);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.clearColor(0, 0, 0, 0);
            //this.gl.clearColor(this.background.red/255, this.background.green/255, this.background.blue/255, 0.0);
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthFunc(this.gl.LEQUAL);
        
            //Set default properties
            this.properties = {};
        
            this.properties.samples = 256;
            this.properties.isovalue = 0.45;
            this.properties.isowalls = false;
            this.properties.isoalpha = 0.75;
            this.properties.isosmooth = 1.0;
            this.properties.colour = [255, 245, 226];//214, 188, 86
        
            this.properties.xmin = this.properties.ymin = this.properties.zmin = 0.0;
            this.properties.xmax = this.properties.ymax = this.properties.zmax = 1.0;
        
            this.properties.density = 1.0;
            this.properties.saturation = 1.0;
            this.properties.brightness = 0.0;
            this.properties.contrast = 1.0;
            this.properties.power = 1.0;
            this.properties.minclip = this.props.volume.minclip || 0.0;
            this.properties.maxclip = this.props.volume.minclip || 1.0;
            this.properties.usecolourmap = true;
            this.properties.tricubicFilter = false;//true;
            this.properties.interactive = false;
            this.properties.axes = true;
            this.properties.border = true;
        
            //Load from local storage or previously loaded file
            this.load(props);
            
        }

        public applyBackground(bg) {
            if (!bg) return;
            this.background = new Colour(bg);
            var hsv = this.background.HSV();
            this.borderColour = hsv.V > 50 ? new Colour(0xff444444) : new Colour(0xffbbbbbb);
        
            //document.body.style.background = bg;
        
            //Set canvas background
            if (this.properties.usecolourmap)
                this.canvas.style.backgroundColor = bg;
            else
                this.canvas.style.backgroundColor = "black";
        
        }

        getShaderSource (id){
            return document.getElementById(id).textContent.replace(/^\s+|\s+$/g, '');
        }
        
        box(min, max) {
            var vertices = new Float32Array(
                [
                    min[0], min[1], max[2],
                    min[0], max[1], max[2],
                    max[0], max[1], max[2],
                    max[0], min[1], max[2],
                    min[0], min[1], min[2],
                    min[0], max[1], min[2],
                    max[0], max[1], min[2],
                    max[0], min[1], min[2]
                ]);
        
            var indices = new Uint16Array(
                [
                    0, 1, 1, 2, 2, 3, 3, 0,
                    4, 5, 5, 6, 6, 7, 7, 4,
                    0, 4, 3, 7, 1, 5, 2, 6
                ]
            );
           this.boxPositionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boxPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
            this.boxPositionBuffer.itemSize = 3;
        
            this.boxIndexBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.boxIndexBuffer); 
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
            this.boxIndexBuffer.numItems = 24;
        }
        
        
        load(src) {
           for (var key in src)
            this.properties[key] = src[key]
        
            if (src.colourmap != undefined) this.properties.usecolourmap = true;
            this.properties.axes = true;//src.views[0].axes;
            this.properties.border = true;//src.views[0].border;
            this.properties.tricubicFilter = src.tricubicfilter;
        
            if (src.views[0].translate) this.translate = src.views[0].translate;
            //Initial rotation (Euler angles or quaternion accepted)
            if (src.views[0].rotate) {
            if (src.views[0].rotate.length == 3) {
                this.rotateZ(-src.views[0].rotate[2]);
                this.rotateY(-src.views[0].rotate[1]);
                this.rotateX(-src.views[0].rotate[0]);
            } else if (src.views[0].rotate[3] != 0)
                this.rotate = mat.createQuat4(src.views[0].rotate);    
            }
        }
        
        get(matrix) {
            var data = {};
            if (matrix) {
            //Include the modelview matrix array
          /*  data.modelview = this.webgl.modelView.toArray();
            } else {
            //Translate + rotation quaternion
            data.translate = this.translate;
            data.rotate = [this.rotate[0], this.rotate[1], this.rotate[2], this.rotate[3]];
            }
            data.properties = this.properties;*/
            return data;
        }
    }
        
        
       draw(lowquality, testmode) {
            if (!this.properties || !this.webgl) return; //Getting called before vars defined, TODO:fix
            //this.time = new Date().getTime();
            if (this.width == 0 || this.height == 0) {
            //Get size from window
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            }
        
            if (this.width != this.canvas.width || this.height != this.canvas.height) {
            //Get size from element
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvas.setAttribute("width", this.width);
            this.canvas.setAttribute("height", this.height);
            if (this.gl) {
                //this.gl.drawingBufferWidth = this.width;
                //this.gl.viewportHeight = this.height;
                //this.gl.viewport. = this.width;
               // this.gl.viewportHeight = this.height;
                this.webgl.viewport = new Viewport(0, 0, this.width, this.height);
            }
            }
            //Reset to auto-size...
            //this.width = this.height = 0;
            //console.log(this.width + "," + this.height);
        
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            this.gl.viewport(this.webgl.viewport.x, this.webgl.viewport.y, this.webgl.viewport.width, this.webgl.viewport.height);
        
            //box/axes draw fully opaque behind volume
            if (this.properties.border) this.drawBox(1.0);
            if (this.properties.axes) this.drawAxis(1.0);
        
            //Volume render (skip while interacting if lowpower device flag is set)
            //if (!(lowquality && !this.properties.interactive)) {
            //Setup volume camera
            this.webgl.modelView.identity();
           // this.setVolumeProg(this.props);
            this.rayCamera();
            this.webgl.setProgram(this.program);
            this.webgl.use(this.program);
            this.webgl.modelView.scale(this.scaling);  //Apply scaling
                this.gl.disableVertexAttribArray(this.program.attributes["aVertexColour"]);
        
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.webgl.textures[0]);
        
            this.gl.activeTexture(this.gl.TEXTURE1);
            
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.webgl.gradientTexture);
        
            //Only render full quality when not interacting
          //  this.gl.uniform1i(this.program.uniforms["uSamples"], this.samples);
            this.gl.uniform1i(this.program.uniforms["uSamples"], lowquality ? this.properties.samples * 0.5 : this.properties.samples);
            this.gl.uniform1i(this.program.uniforms["uVolume"], 0);
            this.gl.uniform1i(this.program.uniforms["uTransferFunction"], 1);
            this.gl.uniform1i(this.program.uniforms["uEnableColour"], this.properties.usecolourmap);
            this.gl.uniform1i(this.program.uniforms["uFilter"], lowquality ? false : this.properties.tricubicFilter);
            this.gl.uniform4fv(this.program.uniforms["uViewport"], new Float32Array([0, 0, this.canvas.width, this.canvas.height]));
        
            var bbmin = [this.properties.xmin, this.properties.ymin, this.properties.zmin];
            var bbmax = [this.properties.xmax, this.properties.ymax, this.properties.zmax];
            this.gl.uniform3fv(this.program.uniforms["uBBMin"], new Float32Array(bbmin));
            this.gl.uniform3fv(this.program.uniforms["uBBMax"], new Float32Array(bbmax));
            this.gl.uniform3fv(this.program.uniforms["uResolution"], new Float32Array(this.resolution));
        
            this.gl.uniform1f(this.program.uniforms["uDensityFactor"], this.properties.density);
            // brightness and contrast
            this.gl.uniform1f(this.program.uniforms["uSaturation"], this.properties.saturation);
            this.gl.uniform1f(this.program.uniforms["uBrightness"], this.properties.brightness);
            this.gl.uniform1f(this.program.uniforms["uContrast"], this.properties.contrast);
            this.gl.uniform1f(this.program.uniforms["uPower"], this.properties.power);
        
            this.gl.uniform1f(this.program.uniforms["uIsoValue"], this.properties.isovalue);
            var colour = new Colour(this.properties.colour);
            colour.alpha = this.properties.isoalpha;
            this.gl.uniform4fv(this.program.uniforms["uIsoColour"], colour.rgbaGL());
            this.gl.uniform1f(this.program.uniforms["uIsoSmooth"], this.properties.isosmooth);
            this.gl.uniform1i(this.program.uniforms["uIsoWalls"], this.properties.isowalls);
        
            //Data value range (default only for now)
            this.gl.uniform2fv(this.program.uniforms["uRange"], new Float32Array([0.0, 1.0]));
            //Density clip range
            this.gl.uniform2fv(this.program.uniforms["uDenMinMax"], new Float32Array([0,1/*this.properties.mindensity, this.properties.maxdensity*/]));
        
            //Draw two triangles
           this.webgl.initDraw2d(); //This sends the matrices, uNMatrix may not be correct here though

           
            this.gl.uniformMatrix4fv(this.program.uniforms["uInvPMatrix"], false, this.invPMatrix);
          //  this.gl.enableVertexAttribArray(this.program.attributes["aVertexPosition"]);
        //    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.webgl.vertexPositionBuffer);
          //  this.gl.vertexAttribPointer(this.program.attributes["aVertexPosition"], this.webgl.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

           // this.webgl.modelView.translate([]);
         //  this.webgl.modelView.rotate(60,[0,0,1]);
           //this.webgl.modelView.matrix = mat4.create();
          // this.webgl.modelView.translate([4,0,-2]);
           //this.webgl.modelView.rotate(45,[1,0,0]);
           // this.webgl.setMatrices();
        
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.webgl.vertexPositionBuffer.numItems);
        
            
              this.webgl.modelView.pop();
           // }
            /* else {
            //Always draw axis even if turned off to show interaction
            if (!this.properties.axes) this.drawAxis(1.0);
            //Bounding box
            this.drawBox(1.0);
            }*/
        
            //this.timeAction("Render", this.time);
        
            //Draw box/axes again as overlay (near transparent)
            this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
            if (this.properties.axes) this.drawAxis(0.2);
            if (this.properties.border) this.drawBox(0.2);
        
          
            //this.draw(true, true);
        }

        
        camera() {
            //Apply translation to origin, any rotation and scaling
            this.webgl.modelView.identity()
            this.webgl.modelView.translate(this.translate);
            // Adjust centre of rotation, default is same as focal point so this does nothing...
            var adjust = [-(this.focus[0] - this.centre[0]), -(this.focus[1] - this.centre[1]), -(this.focus[2] - this.centre[2])];
            this.webgl.modelView.translate(adjust);
            
        
            // rotate model 
            var rotmat = mat.quat4toMat4(this.rotate, mat.createMat4(null));
            this.webgl.modelView.mult(rotmat);
           // 
        
            // Adjust back for rotation centre
           adjust = [this.focus[0] - this.centre[0], this.focus[1] - this.centre[1], this.focus[2] - this.centre[2]];
            this.webgl.modelView.translate(adjust);
        
            // Translate back by centre of model to align eye with model centre
           this.webgl.modelView.translate([-this.focus[0], -this.focus[1], -this.focus[2] * this.orientation]);
           //this.webgl.modelView.rotate(45,[1,1,0]);
            //Perspective matrix
           this.webgl.setPerspective(45, this.canvas.Width / this.canvas.height, 0.1, 100.0);
        }
        
        rayCamera() {
            //Apply translation to origin, any rotation and scaling
            this.webgl.modelView.identity()
            this.webgl.modelView.translate(this.translate);
        
            // rotate model 
            var rotmat = mat.quat4toMat4(this.rotate, mat.createMat4(null));
            this.webgl.modelView.mult(rotmat);
//this.webgl.modelView.rotate(60,[1,0,0]);

            //For a volume cube other than [0,0,0] - [1,1,1], need to translate/scale here...
            this.webgl.modelView.translate([-this.scaling[0]*0.5, -this.scaling[1]*0.5, -this.scaling[2]*0.5]);  //Translate to origin
            //Inverse of scaling
           this.webgl.modelView.scale([this.iscale[0], this.iscale[1], this.iscale[2]]);
        
            //Perspective matrix
            this.webgl.setPerspective(this.fov, this.canvas.width / this.canvas.height, 0.1, 100.0);
        
            //Get inverted matrix for volume shader
          //  this.webgl.perspective.matrix = mat4.create();
          // this.webgl.perspective.scale([1,1,1]);
            this.invPMatrix = mat.createMat4(this.webgl.perspective.matrix);// this.webgl.perspective.matrix
           // mat.translateMat4(this.invPMatrix,this.invPMatrix,[0,0,-2.5]);
           // mat4.invert(this.invPMatrix,this.invPMatrix);
           // mat4.transpose(this.invPMatrix,this.invPMatrix);
          // mat4.scale(this.invPMatrix,this.invPMatrix,[0.5,0.5,0.5])
           //mat4.translate(this.invPMatrix,this.invPMatrix,[-0.5,0,-2.5]);
            mat.inverseMat4(this.invPMatrix, this.invPMatrix);
        }
        
        drawAxis(alpha) {
            this.camera();
            this.webgl.setProgram(this.lineprogram);
            this.webgl.use(this.lineprogram);
            this.gl.uniform1f(this.lineprogram.uniforms["uAlpha"], alpha);
            this.gl.uniform4fv(this.lineprogram.uniforms["uColour"], new Float32Array([1.0, 1.0, 1.0, 0.0]));
        
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linePositionBuffer);
            this.gl.enableVertexAttribArray(this.lineprogram.attributes["aVertexPosition"]);
            this.gl.vertexAttribPointer(this.lineprogram.attributes["aVertexPosition"], this.linePositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lineColourBuffer);
            this.gl.enableVertexAttribArray(this.lineprogram.attributes["aVertexColour"]);
            this.gl.vertexAttribPointer(this.lineprogram.attributes["aVertexColour"], this.lineColourBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
        
            //Axis position, default centre, use slicer positions if available
            var pos = [0.5*this.scaling[0], 0.5*this.scaling[1], 0.5*this.scaling[2]];
            if (this.slicer) {
            pos = [this.slicer.slices[0]*this.scaling[0], 
                    this.slicer.slices[1]*this.scaling[1],
                    this.slicer.slices[2]*this.scaling[2]];
            }
            this.webgl.modelView.translate(pos);
        
            
            this.webgl.setMatrices();
            this.gl.drawArrays(this.gl.LINES, 0, this.linePositionBuffer.numItems);
            this.webgl.modelView.translate([-pos[0], -pos[1], -pos[2]]);
        }
        
        drawBox(alpha) {
            this.camera();
            this.webgl.setProgram(this.lineprogram);
            this.webgl.use(this.lineprogram);
            this.gl.uniform1f(this.lineprogram.uniforms["uAlpha"], alpha);
            this.gl.uniform4fv(this.lineprogram.uniforms["uColour"], this.borderColour.rgbaGL());
        
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boxPositionBuffer);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.boxIndexBuffer);
            this.gl.enableVertexAttribArray(this.lineprogram.attributes["aVertexPosition"]);
            this.gl.vertexAttribPointer(this.lineprogram.attributes["aVertexPosition"], this.boxPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
            this.gl.vertexAttribPointer(this.lineprogram.attributes["aVertexColour"], 4, this.gl.UNSIGNED_BYTE, true, 0, 0);
        
            this.webgl.modelView.scale(this.scaling);  //Apply scaling
            this.webgl.setMatrices();
            this.gl.drawElements(this.gl.LINES, this.boxIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        }
        
        timeAction(action, start) {
            if (!window.requestAnimationFrame) return;
            var timer = start || new Date().getTime();
            function logTime() {
            var elapsed = new Date().getTime() - timer;
            if (elapsed < 50) 
                window.requestAnimationFrame(logTime); //Not enough time, assume triggered too early, try again
           /* else {
                console.log(action + " took: " + (elapsed / 1000) + " seconds");
                /if (elapsed > 200 && this.quality > 32) {
                this.quality = Math.floor(this.quality * 0.5);
                OK.debug("Reducing quality to " + this.quality + " samples");
                this.draw();
                } else if (elapsed < 100 && this.quality < 512 && this.quality >= 128) {
                this.quality = this.quality * 2;
                OK.debug("Increasing quality to " + this.quality + " samples");
                this.draw();
                }/
            }*/
            }
            window.requestAnimationFrame(logTime);
        }
        
      /*  rotateX(deg) {
            this.rotation(deg, [1,0,0]);
        }
        
        rotateY(deg) {
            this.rotation(deg, [0,1,0]);
        }
        
        rotateZ(deg) {
            this.rotation(deg, [0,0,1]);
        }
        
       rotation(deg, axis) {
            //Quaterion rotate
            var arad = deg * Math.PI / 180.0;
            var rotation = quat4.fromAngleAxis(arad, axis);
            rotation = quat4.normalize(rotation);
            this.rotate = quat4.multiply(rotation, this.rotate);
        }
        
        zoom(factor) {
            this.translate[2] += factor * this.modelsize;
        }
        
        zoomClip(factor) {
            //var clip = parseFloat($("nearclip").value) - factor;
            //$("nearclip").value = clip;
            this.draw();
            //OK.debug(clip + " " + $("nearclip").value);
        }
        
        Volume.prototype.click = function(event, mouse) {
            this.rotating = false;
            this.draw();
            return false;
        }
        
        Volume.prototype.move = function(event, mouse) {
            this.rotating = false;
            if (!mouse.isdown) return true;
        
            //Switch buttons for translate/rotate
            var button = mouse.button;
        
            switch (button)
            {
            case 0:
                this.rotateY(mouse.deltaX/5.0);
                this.rotateX(mouse.deltaY/5.0);
                this.rotating = true;
                break;
            case 1:
                this.rotateZ(Math.sqrt(mouse.deltaX*mouse.deltaX + mouse.deltaY*mouse.deltaY)/5.0);
                this.rotating = true;
                break;
            case 2:
                var adjust = this.modelsize / 1000;   //1/1000th of size
                this.translate[0] += mouse.deltaX * adjust;
                this.translate[1] -= mouse.deltaY * adjust;
                break;
            }
        
            this.draw(true);
            return false;
        }*/
        
        /*Volume.prototype.wheel = function(event, mouse) {
            if (event.shiftKey) {
            var factor = event.spin * 0.01;
            this.zoomClip(factor);
            } else {
            var factor = event.spin * 0.05;
            this.zoom(factor);
            }
            this.delayedRender(250); //Delayed high quality render
        
            return false; //Prevent default
        }
        
        Volume.prototype.pinch = function(event, mouse) {
        
            var zoom = (event.distance * 0.0001);
            console.log(' --> ' + zoom);
            this.zoom(zoom);
            this.delayedRender(250); //Delayed high quality render
        }
        
        //Delayed high quality render
        Volume.prototype.delayedRender = function(time, skipImm) {
            if (!skipImm) this.draw(true); //Draw immediately in low quality
            //Set timer to draw the final render
            if (this.delaytimer) clearTimeout(this.delaytimer);
            var that = this;
            this.delaytimer = setTimeout(function() {that.draw();}, time);
        }
        
        Volume.prototype.applyBackground = function(bg) {
            if (!bg) return;
            this.background = new Colour(bg);
            var hsv = this.background.HSV();
            this.borderColour = hsv.V > 50 ? new Colour(0xff444444) : new Colour(0xffbbbbbb);
        
            //document.body.style.background = bg;
        
            //Set canvas background
            if (this.properties.usecolourmap)
                this.canvas.style.backgroundColor = bg;
            else
                this.canvas.style.backgroundColor = "black";
        
        
        }*/
    }
