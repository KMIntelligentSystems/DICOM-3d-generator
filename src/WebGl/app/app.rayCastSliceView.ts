
import { Injectable,ViewChild, Renderer2, HostListener } from '@angular/core';
import {Slicer} from './app.rayCastSlicer';
import {Viewport} from './app.rayCastWebGl';
@Injectable()
export class SliceView {
  axis: number;
  slicer: Slicer;
  magnify: number;
  origin: Array<number>;
  rotate: number;
  viewport: Viewport;
  i: number;
  j: number;
  div: any;
  constructor(slicer, x, y, axis, rotate, magnify){
    this.axis = axis;
    this.slicer = slicer;

    this.magnify = magnify || 1.0;
    this.origin = [0.5,0.5];
    this.rotate = rotate || 0;

    //Calc viewport
    this.i = 0;
    this.j = 1;
    if (axis == 0) this.i = 2;
    if (axis == 1) this.j = 2;

    var w = Math.round(slicer.dims[this.i] * slicer.properties.zoom * this.magnify);
    var h = Math.round(slicer.dims[this.j] * slicer.properties.zoom * this.magnify);

   if (this.rotate == 90)
      this.viewport = new Viewport(x, y, h, w);
    else
      this.viewport = new Viewport(x, y, w, h);
  
    //Border and mouse interaction element
    this.div = document.createElement("div");
    this.div.style.cssText = "padding: 0px; margin: 0px; outline: 2px solid rgba(64,64,64,0.5); position: absolute; display: inline-block;";
    this.div.id = "slice-div-" + axis;

    this.div.style.left = x + "px";
    this.div.style.bottom = y + "px";
    this.div.style.width = this.viewport.width + "px";
    this.div.style.height = this.viewport.height + "px";

    //this.div.mouse = new Mouse(this.div, this);
  }

  /*SliceView.prototype.click = function(event, mouse) {
    if (this.slicer.flipY) mouse.y = mouse.element.clientHeight - mouse.y;

    var coord;

    //Rotated?
    if (this.rotate == 90)
      coord = [mouse.y / mouse.element.clientHeight, 1.0 - mouse.x / mouse.element.clientWidth];
    else 
      coord = [mouse.x / mouse.element.clientWidth, mouse.y / mouse.element.clientHeight];

    var A = Math.round(this.slicer.res[this.i] * coord[0]);
    var B = Math.round(this.slicer.res[this.j] * coord[1]);

    if (this.axis == 0) {
      slicer.properties.Z = A;
      slicer.properties.Y = B;
    } else if (this.axis == 1) {
      slicer.properties.X = A;
      slicer.properties.Z = B;
    } else {
      slicer.properties.X = A;
      slicer.properties.Y = B;
    }

    this.slicer.draw();
  }*/

 /* SliceView.prototype.wheel = function(event, mouse) {
    if (this.axis == 0) slicer.properties.X += event.spin;
    if (this.axis == 1) slicer.properties.Y += event.spin;
    if (this.axis == 2) slicer.properties.Z += event.spin;
    this.slicer.draw();
  }

  SliceView.prototype.move = function(event, mouse) {
    if (mouse.isdown) this.click(event, mouse);
  }*/
}

