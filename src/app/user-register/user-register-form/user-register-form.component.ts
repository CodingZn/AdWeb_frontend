import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RegisterRequest } from 'src/app/http/register-request.model';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CheckUsernameRequest } from 'src/app/http/check-username-request.model';
import { mergeMap } from 'rxjs';
import { RegisterAPI } from 'src/app/http/register-api';
import { CheckUsernameAPI } from 'src/app/http/check-username-api';
import {Router} from "@angular/router";

type UserRegisterData = RegisterRequest

@Component({
  selector: 'app-user-register-form',
  templateUrl: './user-register-form.component.html',
  styleUrls: ['./user-register-form.component.css'],

  standalone: true,
  imports: [
    ReactiveFormsModule,

    HttpClientModule,

    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
})
export class UserRegisterFormComponent implements OnInit {
  userRegisterForm = this.formBuilder.group({
    username: [''],
    nickname: [''],
    password: [''],
    phone: [''],
    email: [''],
  });

  private userRegisterData: UserRegisterData = {
    username: '',
    password: '',
    nickname: '',
    phone: '',
    email: '',
  };

  @Output() showError = new EventEmitter<string>();

  constructor(
    private formBuilder: FormBuilder,
    private httpClient: HttpClient,
    private router: Router) { }

  ngOnInit(): void {
    // subscribe to values changae of the form
    this.userRegisterForm.valueChanges.subscribe((userRegisterData) => {
      // look silly but safe
      if (userRegisterData.username) this.userRegisterData.username = userRegisterData.username;
      if (userRegisterData.password) this.userRegisterData.password = userRegisterData.password;
      if (userRegisterData.nickname) this.userRegisterData.nickname = userRegisterData.nickname;
      if (userRegisterData.phone) this.userRegisterData.phone = userRegisterData.phone;
      if (userRegisterData.email) this.userRegisterData.email = userRegisterData.email;
    });
  }

  onSubmit() {
    // check username before do actual register
    const checkUsernameRequest: CheckUsernameRequest = {
      username: this.userRegisterData.username
    };

    new CheckUsernameAPI(this.httpClient)
      .createObservable(checkUsernameRequest)
      .pipe(
        mergeMap(() => new RegisterAPI(this.httpClient).createObservable(this.userRegisterData))
      )
      .subscribe({
        next: () => {
          // register successfully
          // TODO: do redirect here...
          window.alert('register successfully');
          this.router.navigateByUrl('user-login');
        },

        // username conclict or others error
        error: (err: HttpErrorResponse) => {
          this.showError.emit(err.error.message);
        }
      });
  }
}
