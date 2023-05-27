import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundPageComponent } from './not-found/not-found-page/not-found-page.component';

const routes: Routes = [
  { path: 'user-login', loadComponent: () => import('./user-login/user-login-page/user-login-page.component').then((mod) => mod.UserLoginPageComponent)},
  { path: 'user-register', loadComponent: () => import('./user-register/user-register-page/user-register-page.component').then((mod) => mod.UserRegisterPageComponent)},
  { path: '**', component: NotFoundPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
