import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatToolbarModule } from '@angular/material/toolbar';
import { NotFoundPageComponent } from './not-found/not-found-page/not-found-page.component';
import { HomeComponent } from './home/home.component';
import {MatButtonModule} from "@angular/material/button";
import { UserinfoComponent } from './userinfo/userinfo.component';
import {MatCardModule} from "@angular/material/card";
import {MatSelectModule} from "@angular/material/select";
import {MatInputModule} from "@angular/material/input";
import {ReactiveFormsModule} from "@angular/forms";
import { UserProfileComponent } from './user-profile/user-profile.component';
import {RouterModule} from '@angular/router';
import { SocketTestComponent } from './3d/socket/socket-test/socket-test.component';
import {SocketService} from "./3d/socket/socket.service";

@NgModule({
  declarations: [
    AppComponent,
    NotFoundPageComponent,
    HomeComponent,
    UserinfoComponent,
    UserProfileComponent,
    SocketTestComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,

        HttpClientModule,

        MatToolbarModule,
        MatButtonModule,
        MatCardModule,
        MatSelectModule,
        MatInputModule,
        ReactiveFormsModule,
        RouterModule,
    ],
  providers: [SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
