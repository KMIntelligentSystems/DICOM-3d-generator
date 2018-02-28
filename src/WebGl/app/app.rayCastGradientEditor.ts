
import { Injectable,ViewChild, Renderer2, HostListener } from '@angular/core';
import {Slicer} from './app.rayCastSlicer';
import {Palette} from './app.rayCastPalette';
@Injectable()
export class GradientEditor {
    canvas: any;
    callback: any;
    premultiply: any;
    changed: any;
    inserting: any;
    editing: any;
    element: any;
    spin: any;
    scrollable: any;
    picker: any;
    palette: any;
constructor(canvas, callback, premultiply, nopicker, scrollable) {
    this.canvas = canvas;
    this.callback = callback;
    this.premultiply = premultiply;
    this.changed = true;
    this.inserting = false;
    this.editing = null;
    this.element = null;
    this.spin = 0;
    this.scrollable = scrollable;
    var self = this;
//function saveColour(val) {self.save(val);}
    //function abortColour() {self.cancel();}
    //if (!nopicker)
      //this.picker = new ColourPicker(this.save.bind(this), this.cancel.bind(this));
  
    //Create default palette object (enable premultiply if required)
    this.palette = new Palette(null, premultiply);
    //Event handling for palette
   // this.canvas.mouse = new Mouse(this.canvas, this);
    this.canvas.oncontextmenu="return false;";
    this.canvas.oncontextmenu = function() { return false; }      
  
    //this.update();
  }
  
  //Palette management
  read(source) {
    //Read a new palette from source data
    this.palette = new Palette(source, this.premultiply);
   // this.reset();
   //this.update();
  }
  
  update() {
    
    //Redraw and flag change
    this.changed = true;
    this.palette.draw(this.canvas, true);
    //Trigger callback if any
    this.callback(this);
  }
  /*
  //Draw gradient to passed canvas if data has changed
  //If no changes, return false
  GradientEditor.prototype.get = function(canvas, cache) {
    if (cache && !this.changed) return false;
    this.changed = false;
    //Update passed canvas
    this.palette.draw(canvas, false);
    return true;
  }
  
  GradientEditor.prototype.insert = function(position, x, y) {
    //Flag unsaved new colour
    this.inserting = true;
    var col = new Colour();
    this.editing = this.palette.newColour(position, col)
    this.update();
    //Edit new colour
    this.picker.pick(col, x, y);
  }
  
  GradientEditor.prototype.editBackground = function(element) {
    this.editing = -1;
    var offset = findElementPos(element); //From mouse.js
    this.element = element;
    this.picker.pick(this.palette.background, offset[0]+32, offset[1]+32);
  }
  
  GradientEditor.prototype.edit = function(val, x, y) {
    if (typeof(val) == 'number') {
      this.editing = val;
      this.picker.pick(this.palette.colours[val].colour, x, y);
    } else if (typeof(val) == 'object') {
      //Edit element
      this.cancel();  //Abort any current edit first
      this.element = val;
      var col = new Colour(val.style.backgroundColor)
      var offset = findElementPos(val); //From mouse.js
      this.picker.pick(col, offset[0]+32, offset[1]+32);
    }
    this.update();
  }
  
  GradientEditor.prototype.save = function(val) {
    if (this.editing != null) {
      if (this.editing >= 0)
        //Update colour with selected
        this.palette.colours[this.editing].colour.setHSV(val);
      else
        //Update background colour with selected
        this.palette.background.setHSV(val);
    }
    if (this.element) {
      var col = new Colour(0);
      col.setHSV(val);
      this.element.style.backgroundColor = col.html();
      if (this.element.onchange) this.element.onchange();  //Call change function
    }
    this.reset();
    this.update();
  }
  
  GradientEditor.prototype.cancel = function() {
    //If aborting a new colour add, delete it
    if (this.editing >= 0 && this.inserting)
      this.palette.remove(this.editing);
    this.reset();
    this.update();
  }
  
  GradientEditor.prototype.reset = function() {
    //Reset editing data
    this.inserting = false;
    this.editing = null;
    this.element = null;
  }
  
  //Mouse event handling
  GradientEditor.prototype.click = function(event, mouse) {
    //this.changed = true;
    if (event.ctrlKey) {
      //Flip
      for (var i = 0; i < this.palette.colours.length; i++)
        this.palette.colours[i].position = 1.0 - this.palette.colours[i].position;
      this.update();
      return false;
    }
  
    //Use non-scrolling position
    if (!this.scrollable) mouse.x = mouse.clientx;
  
    if (mouse.slider != null)
    {
      //Slider moved, update texture
      mouse.slider = null;
      this.palette.sort(); //Fix any out of order colours
      this.update();
      return false;
    }
    var pal = this.canvas;
    if (pal.getContext){
      this.cancel();  //Abort any current edit first
      var context = pal.getContext('2d'); 
      var ypos = findElementPos(pal)[1]+30;
  
      //Get selected colour
      //In range of a colour pos +/- 0.5*slider width?
      var i = this.palette.inRange(mouse.x, this.palette.slider.width, pal.width);
      if (i >= 0) {
        if (event.button == 0) {
          //Edit colour on left click
          this.edit(i, event.clientX-128, ypos);
        } else if (event.button == 2) {
          //Delete on right click
          this.palette.remove(i);
          this.update();
        }
      } else {
        //Clicked elsewhere, add new colour
        this.insert(mouse.x / pal.width, event.clientX-128, ypos);
      }
    }
    return false;
  }
  
  GradientEditor.prototype.down = function(event, mouse) {
     return false;
  }
  
  GradientEditor.prototype.move = function(event, mouse) {
    if (!mouse.isdown) return true;
  
    //Use non-scrolling position
    if (!this.scrollable) mouse.x = mouse.clientx;
  
    if (mouse.slider == null) {
      //Colour slider dragged on?
      var i = this.palette.inDragRange(mouse.x, this.palette.slider.width, this.canvas.width);
      if (i>0) mouse.slider = i;
    }
  
    if (mouse.slider == null)
      mouse.isdown = false; //Abort action if not on slider
    else {
      if (mouse.x < 1) mouse.x = 1;
      if (mouse.x > this.canvas.width-1) mouse.x = this.canvas.width-1;
      //Move to adjusted position and redraw
      this.palette.colours[mouse.slider].position = mouse.x / this.canvas.width;
      this.update(true);
    }
  }
  
  GradientEditor.prototype.wheel = function(event, mouse) {
    if (this.timer)
      clearTimeout(this.timer);
    else
      this.canvas.style.cursor = "wait";
    this.spin += 0.01 * event.spin;
    //this.cycle(0.01 * event.spin);
    var this_ = this;
    this.timer = setTimeout(function() {this_.cycle(this_.spin); this_.spin = 0;}, 150);
  }
  
  GradientEditor.prototype.leave = function(event, mouse) {
  }
  
  GradientEditor.prototype.cycle = function(inc) {
    this.canvas.style.cursor = "default";
    this.timer = null;
    //Shift all colours cyclically
    for (var i = 1; i < this.palette.colours.length-1; i++)
    {
      var x = this.palette.colours[i].position;
      x += inc;
      if (x <= 0) x += 1.0;
      if (x >= 1.0) x -= 1.0;
      this.palette.colours[i].position = x;
    }
    this.palette.sort(); //Fix any out of order colours
    this.update();
  }*/

}