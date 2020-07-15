import { Component } from '@angular/core';
import { Injectable } from '@angular/core'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
@Injectable({
  providedIn: 'root',
})

export class AppComponent {

  title = "angular-electron"
  constructor() {

  }

  ngOnInit() {
  }
   /*  const { ipcRenderer } = require('electron') */
    
   
}