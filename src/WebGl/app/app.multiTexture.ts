import { Component, OnInit  } from '@angular/core';
import {AppLoadFile} from './app.loadFileComponent';
import { ArrayBuffer } from '@angular/http/src/static_request';
import { async } from '@angular/core/testing';

import {DICOMViewer} from './app.webGL';
import * as DICOM from 'dicom-parser';
import {WebGl2Viewer} from './app.webGL_2';
import {WebGl2TextureViewer} from './app.webgl2_2d_texture';
import {WebGl2Test} from './app.webgl2_simple_test'

import {LUTLookup} from './app.LUTLookup';
import {WebGlColorCube} from './app.colorCube';
import {WebGl2Square}  from './app.webgl2Square';
import {WebGlFrameBuffer} from './app.webgl_frameBuffer';

import {WebGlFrameBuffer_Test} from './app.webgl_frameBufferTest';
import {WebGlFrameBufferAnotherTest} from './app.webglAnotherTest';
import {WebGlAgain} from './app.webglAgain';
import {WebGlCloud} from './app.cloud';

import {WebGl2Cube} from './app.Cube';
import {VolumeRayCast} from './app.rayCast'
import {Http, Response} from '@angular/http';
// <!--<canvas id="myCanvas" width="384" height="512"></canvas>-->
//<div id="startDiv"></div>
@Component({
    selector: 'app-root',
    template:`<div id="hidden" style="display: none">
                <canvas id="gradient" width="2048" height="1"></canvas>
            </div>
            <div id="startDiv"></div>
            <canvas id="palette" width="512" height="24" class="palette checkerboard"></canvas>`,
    providers:[LUTLookup, DICOMViewer,WebGl2TextureViewer,WebGlColorCube,VolumeRayCast,WebGl2Test,WebGl2Cube,WebGl2Viewer,WebGl2Square,WebGlCloud,WebGlAgain, WebGlFrameBuffer,WebGlFrameBuffer_Test,WebGlFrameBufferAnotherTest] 
  })

  export class MultiTextureLoader {
    fileLoader: AppLoadFile;
    t2: string[];
    images: ArrayBuffer[];
    LUTLookup: LUTLookup;
    dicomViewer: DICOMViewer;
    webGl2Viewer: VolumeRayCast;
    data: string;
    constructor(private http: Http,lutLookup: LUTLookup, dicomViewer: DICOMViewer,webGl2Viewer:VolumeRayCast) {
        this.fileLoader = new AppLoadFile();
        this.LUTLookup = lutLookup;
        this.dicomViewer = dicomViewer; 
        this.webGl2Viewer = webGl2Viewer;
    //this.images = [];
        this.t2 = [
            '36444280', '36444294', '36444308', '36444322', '36444336',
            '36444350', '36444364', '36444378', '36444392', '36444406',
             '36444434', '36444448', '36444462', '36444476',
            '36444490', '36444504', '36444518', '36444532', '36746856',
        ];
       var _this = this;
       this.loadFiles().then((res) => {
           _this.images = res[0].images;
           _this.createDicomImage(_this.images,_this.LUTLookup,_this.dicomViewer,_this.webGl2Viewer);
       });
    }

    ngOnInit() {
        this.http
          .get("/assets/rayCast.json")
          .map(data => data.json())
          .subscribe(data => {
          this.data = data;
          });
      }
    createDicomImage(buffer: ArrayBuffer[], LUTLookup: LUTLookup,dicomViewer: DICOMViewer,webGl2Viewer:VolumeRayCast){
        let dicomParser = DICOM;
    try
    {
        buffer.forEach((a) => {
            let pixel_Data = this.getDICOMDataset(a,dicomParser,LUTLookup);
            //dicomViewer.setPixelData(pixel_Data);
            //dicomViewer.pixelData = pixel_Data;
        // webGl2Viewer.setPixelData(pixel_Data);
        // webGl2Viewer.pixelData = pixel_Data;
        });
      //dicomViewer.main();
        //dicomViewer.drawBrain();
        webGl2Viewer.main(this.data);
        //webGl2Viewer.loadTexture();//webglagain
       //webGl2Viewer.main();
    
              // UPDATING ALPHA
/*              var data = [];
  for ( var i = 3, k = 0; i < 512*512; i = i + 4, k = k + 2 ) {
  
                  // CONVERT 16-BIT TO 8-BIT ,BECAUSE WE CANNOT RENDER A 16-BIT VALUE TO THE CANVAS.
                  var res = ((pixel_Data[0][ k + 1 ] & 0xFF) << 8) | (pixelData[0][ k ] & 0xFF);
                  res = (res & 0xFFFF) >> 8;
                  data[ i ] = 255 - res;
              }*/
  
       
    }
    catch(ex)
    {
       
    }
      
   }
   
    getDICOMDataset(a: ArrayBuffer, dicomParser, LUTLookup):number []
    {
        var byteArray = new Uint8Array(a);
        
        var dataSet = dicomParser.parseDicom(byteArray/*, options */);
    
        // access a string element
        var studyInstanceUid = dataSet.string('x0020000d');
    
        // get the pixel data element (contains the offset and length of the data)
        var pixelDataElement = dataSet.elements.x7fe00010;
        var width = dataSet.uint16( 'x00280011' );
        var height = dataSet.uint16( 'x00280010' );
        //var bitsAllocated = dataSet.uint16('x00280100');
  
        //var LUTTable = this.LUTLookup.createLUT(75,50,16);
        var LUTTable = LUTLookup.createLUT(1319,622,16);
    
        // create a typed array on the pixel data (this example assumes 16 bit unsigned data)
        var buffer = dataSet.byteArray.buffer;
        var pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset,512*384/*pixelDataElement.length*/);
  
        var pixel_Data = []
        for(var i = 0; i < 384*512;i++ ){
          pixel_Data[i] = LUTTable[pixelData[i]];
        }
        return pixel_Data;
    }

    loadItems(files: string[]): Promise<{ images: ArrayBuffer[] }> {
        let myImages: ArrayBuffer[];
        myImages = [];
        return new Promise((resolve) => {
            files.forEach((file) => {
                let a: ArrayBuffer;
                this.fileLoader.fetch(file).then(
                (result: any) => {
                    a = result.buffer;
                    myImages.push(a);
                    if(myImages.length === files.length){
                    resolve({images: myImages});  
                    }   
            });     
            });
        });
    }

    loadFiles(): Promise<any>{
        var images = [];
        var files = this.t2.map(function(v) {
            return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
        });

      /*  Promise.all([loadItem(1), loadItem(2)])
    .then((res) => {
        [item1, item2] = res;
        console.log('done');
    });*/ 
        
       return Promise.all([this.loadItems(files)]);
    
    }
}