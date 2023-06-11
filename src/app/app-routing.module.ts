import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundPageComponent } from './not-found/not-found-page/not-found-page.component';
import {HomeComponent} from "./home/home.component";
import {AppComponent} from "./app.component";
import {UserinfoComponent} from "./userinfo/userinfo.component";
import {UserProfileComponent} from "./user-profile/user-profile.component";
import {SocketTestComponent} from "./3d/socket/socket-test/socket-test.component";


const routes: Routes = [
  { path: 'user-login', loadComponent: () => import('./user-login/user-login-page/user-login-page.component').then((mod) => mod.UserLoginPageComponent)},
  { path: 'user-register', loadComponent: () => import('./user-register/user-register-page/user-register-page.component').then((mod) => mod.UserRegisterPageComponent)},
  { path: '3d-test', loadComponent: () => import('./3d/test/test.component').then((mod) => mod.TestComponent)},
  { path: 'home', component: HomeComponent},
  { path: 'user', component: UserinfoComponent},
  { path: 'profile', component: UserProfileComponent},
  { path: '**', component: NotFoundPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
