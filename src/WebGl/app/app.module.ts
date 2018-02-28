import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {HttpModule} from '@angular/http';


import { AppComponent } from './app.component';
import {AppLoadFile} from './app.loadFileComponent';
import {Graph} from './app.graphs'
import {MultiTextureLoader} from './app.multiTexture'



@NgModule({
  declarations: [
    [AppComponent,MultiTextureLoader]
  ],
  imports: [
    BrowserModule,
    HttpModule //need to import during bootup
  ],
  exports: [HttpModule],
  providers: [],
//bootstrap: [AppComponent]
bootstrap: [MultiTextureLoader]//
})
export class AppModule { }
