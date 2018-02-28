import { Injectable,ViewChild, Renderer2, HostListener } from '@angular/core';

//import * as mat4 from "./gl-m4";
import {mat4} from "gl-matrix";
import * as mat from './app.mat4';



export class ViewMatrix{
        matrix: any;
        stack: any
        
    constructor(){
      this.matrix = mat4.create();
      mat4.identity(this.matrix);
      this.stack = [];
    }
    
    
      toString() {
        return JSON.stringify(this.toArray());
      }
    
      toArray() {
        //return JSON.parse(mat4.str(this.matrix));
      }
     
      push(m) {
        if (m) {
          this.stack.push(mat.createMat4(m));
          this.matrix = mat.createMat4(m);
        } else {
          this.stack.push(mat.createMat4(this.matrix));
        }
      
      }
    
      pop() {
        if (this.stack.length == 0) {
          //throw "Matrix stack underflow";
          //mat.createMat4(this.matrix);
          return;
        }
        this.matrix = this.stack.pop();
        return this.matrix;
      }
    
      mult(m) {
       // mat4.multiply(this.matrix, m);
       mat.multiplyMat4(this.matrix, m,null);
      }
    
      identity() {
       // mat4.identity(this.matrix);      
       mat.identityMat4(this.matrix);         
      }
    
      scale(v) {
        //mat4.scale(this.matrix,this.matrix, v);
        mat.scaleMat4(this.matrix,v,this.matrix );
      }
    
      translate(v) {
       // mat4.translate(this.matrix,this.matrix, v);
       mat.translateMat4(this.matrix,v,this.matrix)

      }
    
      rotate(angle,v) {
        var arad = angle * Math.PI / 180.0;
        mat4.rotate(this.matrix, this.matrix,arad, v);
      }

     
    
}

export class Viewport{
        x: number;
        y: number;
        width: number;
        height: number;
    constructor(x, y, width, height) {
        this.x = x; 
        this.y = y; 
        this.width = width; 
        this.height = height; 
      }
}

export class WebGlProgram{
        gl: any;
        vs: any;
        fs: any;
        program: WebGLProgram;
        vshader: any;
        fshader: any;
        attributes: any;
        uniforms: any;
        mvMatrixUniform: any;
        pMatrixUniform: any;
        nMatrixUniform: any;
    constructor(gl, vs, fs) {
        //Can be passed source directly or script tag
        this.program = null;
       // if (vs.indexOf("main") < 0) vs = getSourceFromElement(vs);
//if (fs.indexOf("main") < 0) fs = getSourceFromElement(fs);
        //Pass in vertex shader, fragment shaders...
        this.gl = gl;
        if (this.program && this.gl.isProgram(this.program))
        {
          //Clean up previous shader set
          if (this.gl.isShader(this.vshader))
          {
            this.gl.detachShader(this.program, this.vshader);
            this.gl.deleteShader(this.vshader);
          }
          if (this.gl.isShader(this.fshader))
          {
            this.gl.detachShader(this.program, this.fshader);
            this.gl.deleteShader(this.fshader);
          }
          this.gl.deleteProgram(this.program);  //Required for chrome, doesn't like re-using this.program object
        }
    
        this.program = this.gl.createProgram();
    
        this.vshader = this.compileShader(vs, this.gl.VERTEX_SHADER);
        this.fshader = this.compileShader(fs, this.gl.FRAGMENT_SHADER);
    
        this.gl.attachShader(this.program, this.vshader);
        this.gl.attachShader(this.program, this.fshader);
    
        this.gl.linkProgram(this.program);
     
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
          throw "Could not initialise shaders: " + this.gl.getProgramInfoLog(this.program);
        }
      }
    
           compileShader(source, type) {
        //alert("Compiling " + type + " Source == " + source);
        var shader = this.gl.createShader(type);
       
        this.gl.shaderSource(shader, this.getShaderSource(source));
        
        this.gl.compileShader(shader);
        
          if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert(this.gl.getShaderInfoLog(shader));
          }
        return shader;
      }

      getShaderSource (id){
        return document.getElementById(id).textContent.replace(/^\s+|\s+$/g, '');
    }
    
      //Setup and load uniforms
      public setup(attributes, uniforms, noenable) {
        if (!this.program) return;
        if (attributes == undefined) {attributes = ["aVertexPosition", "aTextureCoord"];}
        this.attributes = {};
        var i;
        for (i in attributes) {
          this.attributes[attributes[i]] = this.gl.getAttribLocation(this.program, attributes[i]);
          if (!noenable) {
          this.gl.enableVertexAttribArray(this.attributes[attributes[i]]);
          }
        }
    
        this.uniforms = {};
        for (i in uniforms){
          this.uniforms[uniforms[i]] = this.gl.getUniformLocation(this.program, uniforms[i]);
        }
        this.mvMatrixUniform = this.gl.getUniformLocation(this.program, "uMVMatrix");
        this.pMatrixUniform = this.gl.getUniformLocation(this.program, "uPMatrix");
        this.nMatrixUniform = this.gl.getUniformLocation(this.program, "uNMatrix");
      }
    
}
@Injectable()
export class WebGL{
    gl : WebGLRenderingContext;
    program: WebGLProgram;       
    canvas: any;
    webGlProgram: WebGlProgram;
    webGlLineProgram: WebGlProgram;
    modelView: any;
    perspective: any;
    textures: any;
    timer: any;
    vertexPositionBuffer: any;
    textureCoordBuffer: any;
    gradientTexture: any;
    texid: any;
    viewport: Viewport;
    constructor(canvas,/*program*/ options) {
   // this.program = program;
   this.canvas = canvas;
    this.modelView = new ViewMatrix();
    this.perspective = new ViewMatrix();
    this.textures = [];
    this.timer = null;
    
   // if (!this.canvas.WebGLRenderingContext) throw "No browser WebGL support";
    
      // Try to grab the standard context. If it fails, fallback to experimental.
      try {
        this.gl = this.canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);
      } catch (e) {
       // OK.debug("detectGL exception: " + e);
        throw "No context"
      }
   // this.gl = this.InitializeWebGL();
    this.viewport = new Viewport(0, 0, canvas.width, canvas.height);
   
  }
  
  public setProgram(program){
    this.webGlProgram = program;
    this.program = program.program;
  }
  setMatrices() {
    let gl = this.gl;
    //Model view matrix
//this.modelView.matrix[14] = 0;
    gl.uniformMatrix4fv(this.webGlProgram.mvMatrixUniform, false, this.modelView.matrix);
    //this.setModelView();
    //Perspective matrix
   // if(this.webGlProgram.pMatrixUniform)
    gl.uniformMatrix4fv(this.webGlProgram.pMatrixUniform, false, this.perspective.matrix);
    //Normal matrix
     if (this.webGlProgram.nMatrixUniform) {

     /* this.modelView.translate([-3,0,0]);
      this.modelView.rotate(60,[4,1,0]);*/
      
    // this.modelView.scale([0.5,0.5,0.5]);
//this.modelView.translate([-1,0,-1]);
      var nMatrix = mat.createMat4(this.modelView.matrix);
      mat.inverseMat4(nMatrix,nMatrix);
      mat.transposeMat4(nMatrix,nMatrix);
   
      
      this.gl.uniformMatrix4fv(this.webGlProgram.nMatrixUniform, false, nMatrix);
    }
  }

  degToRad(d) {
    return d * Math.PI / 180;
  }

  setModelView(){
    
    let fieldOfViewRadians = this.degToRad(60);
    let modelXRotationRadians = this.degToRad(0);
    let modelYRotationRadians = this.degToRad(0);
let aspect = this.viewport.width / this.viewport.height;
    var projectionMatrix =
    mat4.perspective(fieldOfViewRadians, 0.5, 1, 2000);

var cameraPosition = [0, 1, 2];
var up = [0, 1, 0];
var target = [0, 0, 0];

// Compute the camera's matrix using look at.
var cameraMatrix = mat4.lookAt(cameraPosition, target, up);

// Make a view matrix from the camera matrix.
var viewMatrix = mat4.inverse(cameraMatrix);

var viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

var matrix = this.xRotate(viewProjectionMatrix, modelXRotationRadians);
//this.modelView = matrix;
//matrix = this.yRotate(matrix, modelYRotationRadians);
this.gl.uniformMatrix4fv(this.webGlProgram.mvMatrixUniform, false, matrix);
  }
  

  initDraw2d() {
    let gl = this.gl;
    gl.viewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);

    gl.enableVertexAttribArray(this.webGlProgram.attributes["aVertexPosition"]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    gl.vertexAttribPointer(this.webGlProgram.attributes["aVertexPosition"], this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if (this.webGlProgram.attributes["aTextureCoord"]) {
      gl.enableVertexAttribArray(this.webGlProgram.attributes["aTextureCoord"]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
      gl.vertexAttribPointer(this.webGlProgram.attributes["aTextureCoord"], this.textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }

    this.setMatrices();
  }

 

  updateTexture(texture, image, unit) {
      let gl = this.gl;
    //Set default texture unit if not provided
    if (unit == undefined) unit = gl.TEXTURE0;
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  init2dBuffers(unit) {
    let gl = this.gl;
    //Set default texture unit if not provided
    if (unit == undefined) unit = gl.TEXTURE0;
    //All output drawn onto a single 2x2 quad
    this.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    var vertexPositions = [1.0,1.0,  -1.0,1.0,  1.0,-1.0,  -1.0,-1.0];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 2;
    this.vertexPositionBuffer.numItems = 4;

    //Gradient texture
    gl.activeTexture(unit);
    this.gradientTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    //Texture coords
    this.textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
    var textureCoords = [1.0, 1.0,  0.0, 1.0,  1.0, 0.0,  0.0, 0.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    this.textureCoordBuffer.itemSize = 2;
    this.textureCoordBuffer.numItems = 4;
  }

  loadTexture(image, filter) {
    let gl = this.gl;
    if (filter == undefined) filter = gl.NEAREST;
    this.texid = this.textures.length;
    this.textures.push(gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, this.textures[this.texid]);
    //Removing this gave outline of foot
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    //(Ability to set texture type?)
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, image);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, image);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return this.textures[this.texid];
  }

 
  setPerspective(fovy, aspect, znear, zfar) {
    mat.perspective(fovy, 2.023715415/*aspect*/, znear,zfar, this.perspective.matrix); //45, 0.65 0.1, 100
  }

  use(program) {
   // this.program = program;
   // if (this.program)
   this.webGlProgram = program;
   this.program = program.program;
      this.gl.useProgram(this.program);
  }

  InitializeWebGL(){
    if(this.canvas === null)
    this.canvas = document.createElement('canvas');
     // this.canvas = <HTMLCanvasElement>  document.getElementById('canvas');
    var gl = null;                              // WebGL rendering context
     var extensions = null;                      // Available extensions

    // ! used twice in a row to cast object state to a Boolean value
     gl = this.canvas.getContext('webgl');
     var width = this.canvas.width;
     var height = this.canvas.height;
     var context = gl;//canvas.getContext('webgl');//'2d'  
     //context.clearRect(0, 0, width, height);
    /* var x0 = 0;
     for (var i = 1; i < list.length; i++) {
       var x1 = Math.round(width * list[i].position);
       context.fillStyle = context.createLinearGradient(x0, 0, x1, 0);
       var colour1 = list[i-1].colour;
       var colour2 = list[i].colour;
       //Pre-blend with background unless in UI mode
       if (this.premultiply && !ui) {
         colour1 = this.background.blend(colour1);
         colour2 = this.background.blend(colour2);
       }
       context.fillStyle.addColorStop(0.0, colour1.html());
       context.fillStyle.addColorStop(1.0, colour2.html());
       context.fillRect(x0, 0, x1-x0, height);
       x0 = x1;
   }*/
    
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
translate(m, tx, ty, tz) {
  return mat4.multiply(m, mat4.translation(tx, ty, tz));
}

xRotate(m, angleInRadians) {
  return mat4.multiply(m, mat4.xRotation(angleInRadians));
}

yRotate(m, angleInRadians) {
  return mat4.multiply(m, mat4.yRotation(angleInRadians));
}

zRotate(m, angleInRadians) {
  return mat4.multiply(m, mat4.zRotation(angleInRadians));
}

scale(m, sx, sy, sz) {
  return mat4.multiply(m, mat4.scaling(sx, sy, sz));
}

}
