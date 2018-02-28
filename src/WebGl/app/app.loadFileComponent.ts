import { Component } from '@angular/core';


export class AppLoadFile{

    constructor() { }

public fetch(url) {

    return new Promise(function (resolve, reject) {
      var request = new XMLHttpRequest();
      request.open('GET', url);
     // request..crossOrigin = true;
      request.responseType = 'arraybuffer';

      /*request.onloadstart = function (event) {
        // emit 'fetch-start' event
        _this2.emit('fetch-start', {
          file: url,
          time: new Date()
        });
      };*/

      request.onload = function (event) {
        if (request.status === 200) {
        //  _this2._loaded = event.loaded;
        //  _this2._totalLoaded = event.total;

          // will be removed after eventer set up
        //  if (_this2._progressBar) {
        //    _this2._progressBar.update(_this2._loaded, _this2._totalLoaded, 'load');
        //  }

          var buffer = request.response;
          var response = {
            url: url,
            buffer: buffer
          };
          
          // emit 'fetch-success' event
         /* _this2.emit('fetch-success', {
            file: url,
            time: new Date(),
            totalLoaded: event.total
          });*/

          resolve(response);
        } else {
          reject(request.statusText);
        }
      };

      request.onerror = function () {
        // emit 'fetch-error' event
       // _this2.emit('fetch-error', {
       //   file: url,
       //   time: new Date()
       // });

        reject(request.statusText);
      };

      request.onabort = function (event) {
        // emit 'fetch-start' event
       // _this2.emit('fetch-abort', {
       //   file: url,
       //   time: new Date()
       // });

        reject(request.statusText);
      };

      request.ontimeout = function () {
        // emit 'fetch-timeout' event
       
        reject(request.statusText);
      };

      request.onprogress = function (event) {
       
      };

      request.onloadend = function (event) {
        // emit 'fetch-end' event
               // just use onload when success and onerror when failure, etc onabort
        // reject(request.statusText);
      };

      request.send();
    });
  }
}