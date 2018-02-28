import { Injectable } from '@angular/core';
import {Colour} from './app.rayCastColour';
import {ColourPos} from './app.rayCastColour';

@Injectable()
export class Palette {
    source: any;
    premultiply: any;
    colours: any;
    slider: any;
    background: any;


constructor(source, premultiply) {
    this.premultiply = premultiply;
    //Default transparent black background
    this.background = new Colour("rgba(0,0,0,0)");
    //Colour palette array
    this.colours = [];
    this.slider = new Image();
    this.slider.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAPCAYAAAA2yOUNAAAAj0lEQVQokWNIjHT8/+zZs//Pnj37/+TJk/9XLp/+f+bEwf9HDm79v2Prqv9aKrz/GUYVEaeoMDMQryJXayWIoi0bFmFV1NWS+z/E1/Q/AwMDA0NVcez/LRsWoSia2luOUAADVcWx/xfO6/1/5fLp/1N7y//HhlmhKoCBgoyA/w3Vyf8jgyyxK4CBUF8zDAUAAJRXY0G1eRgAAAAASUVORK5CYII=";

    if (!source) {
      //Default greyscale
  
      this.colours.push(new ColourPos("rgba(0,0,0,1)", 1.0));
      return;
    }

    var calcPositions = false;

    if (typeof(source) == 'string') {
      //Palette string data parser
      var lines = source.split(/[\n;]/); // split on newlines and/or semi-colons
      var position;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;

        //Palette: parse into attrib=value pairs
        var pair = line.split("=");
        if (pair[0] == "Background")
          this.background = new Colour(pair[1]);
        else if (pair[0][0] == "P") //Very old format: PositionX=
          position = parseFloat(pair[1]);
        else if (pair[0][0] == "C") { //Very old format: ColourX=
          //Colour constructor handles html format colours, if no # or rgb/rgba assumes integer format
          this.colours.push(new ColourPos(pair[1], position));
          //Some old palettes had extra colours at end which screws things up so check end position
          if (position == 1.0) break;
        } else if (pair.length == 2) {
          //New style: position=value
          this.colours.push(new ColourPos(pair[1], pair[0]));
        } else {
          //Interpret as colour only, calculate positions
          calcPositions = true;
          this.colours.push(new ColourPos(line,null));
        }
      }
    } else {
      //JSON colour/position list data
      for (var j=0; j<source.length; j++) {
        //Calculate default positions if none provided
        if (source[j].position == undefined)
          calcPositions = true;
        //Create the entry
        this.colours.push(new ColourPos(source[j].colour, source[j].position));
      }
      //Use background if included
      if (source.background)
        this.background = new Colour(source.background);
    }

    //Calculate default positions
    if (calcPositions) {
      for (var j=0; j<this.colours.length; j++)
        this.colours[j].position = j * (1.0 / (this.colours.length-1));
    }

    //Sort by position (fix out of order entries in old palettes)
    this.sort();

    //Check for all-transparent palette and fix
    var opaque = false;
    for (var c = 0; c < this.colours.length; c++) {
      if (this.colours[c].colour.alpha > 0) opaque = true;
      //Fix alpha=255
      if (this.colours[c].colour.alpha > 1.0)
        this.colours[c].colour.alpha = 1.0;
    }
    if (!opaque) {
      for (var c = 0; c < this.colours.length; c++)
        this.colours[c].colour.alpha = 1.0;
    }
  }

  sort() {
    this.colours.sort(function(a,b){return a.position - b.position});
  }

 /* Palette.prototype.newColour = function(position, colour) {
    var col = new ColourPos(colour, position);
    this.colours.push(col);
    this.sort();
    for (var i = 1; i < this.colours.length-1; i++)
      if (this.colours[i].position == position) return i;
    return -1;
  }

  Palette.prototype.inRange = function(pos, range, length) {
    for (var i = 0; i < this.colours.length; i++)
    {
      var x = this.colours[i].position * length;
      if (pos == x || (range > 1 && pos >= x - range / 2 && pos <= x + range / 2))
        return i;
    }
    return -1;
  }

  Palette.prototype.inDragRange = function(pos, range, length) {
    for (var i = 1; i < this.colours.length-1; i++)
    {
      var x = this.colours[i].position * length;
      if (pos == x || (range > 1 && pos >= x - range / 2 && pos <= x + range / 2))
        return i;
    }
    return 0;
  }

  Palette.prototype.remove = function(i) {
    this.colours.splice(i,1);
  }

  Palette.prototype.toString = function() {
    var paletteData = 'Background=' + this.background.html();
    for (var i = 0; i < this.colours.length; i++)
      paletteData += '\n' + this.colours[i].position.toFixed(6) + '=' + this.colours[i].colour.html();
    return paletteData;
  }

  
  Palette.prototype.toJSON = function() {
    return JSON.stringify(this.get());
  }*/

  get() {
    var obj = {};
    this.colours.background = this.background.html();
    this.colours = [];
    for (var i = 0; i < this.colours.length; i++)
      this.colours.push({'position' : this.colours[i].position, 'colour' : this.colours[i].colour.html()});
    return this.colours;
  }


  //Palette draw to canvas
  draw(canvas, ui) {
    //Slider image not yet loaded?
    if (!this.slider.width && ui) {
      var _this = this;
      setTimeout(function() { _this.draw(canvas, ui); }, 150);
      return;
    }
    
    // Figure out if a webkit browser is being used
    if (!canvas) {alert("Invalid canvas!"); return;}
   // var webkit = /webkit/.test(navigator.userAgent.toLowerCase());

    if (this.colours.length == 0) {
      this.background = new Colour("#ffffff");
      this.colours.push(new ColourPos("#000000", 0));
      this.colours.push(new ColourPos("#ffffff", 1));
    }

    //Colours might be out of order (especially during editing)
    //so save a (shallow) copy and sort it
    var list = this.colours.slice(0);
    list.sort(function(a,b){return a.position - b.position});

    if (canvas/*.getContext*/) {
      //Draw the gradient(s)
      var width = canvas.width;
      var height = canvas.height;
      var context = canvas.getContext('2d');//'2d'  
      context.clearRect(0, 0, width, height);
//if (webkit) {
        //Split up into sections or webkit draws a fucking awful gradient with banding
        var x0 = 0;
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
      }
    /*  } else {
        //Single gradient
        context.fillStyle = context.createLinearGradient(0, 0, width, 0);
        for (var i = 0; i < list.length; i++) {
          var colour = list[i].colour;
          //Pre-blend with background unless in UI mode
          if (this.premultiply && !ui)
            colour = this.background.blend(colour);
          context.fillStyle.addColorStop(list[i].position, colour.html());
        //}*/
        context.fillRect(0, 0, width, height);
      }

      
      //Background colour
      var bg = document.getElementById('backgroundCUR');
      if (bg) bg.style.background = this.background.html();

      //User interface controls
      if (!ui) return;  //Skip drawing slider interface
      for (var i = 1; i < list.length-1; i++)
      {
        var x = Math.floor(width * list[i].position) + 0.5;
        var HSV = list[i].colour.HSV();
        if (HSV.V > 50)
          context.strokeStyle = "black";
        else
          context.strokeStyle = "white";
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.closePath();
        context.stroke();
        x -= (this.slider.width / 2);
        context.drawImage(this.slider, x, 0);  
      } 
    //} else alert("getContext failed!");
  }
}
