import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeadComponent } from './head/head.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AddressAssetsComponent } from './address-assets/address-assets.component';

@NgModule({
  declarations: [
    AppComponent,
    HeadComponent,
    DashboardComponent,
    AddressAssetsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgSelectModule, FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
