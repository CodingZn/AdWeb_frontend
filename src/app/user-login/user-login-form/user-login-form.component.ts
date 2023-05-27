import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserSessionService } from 'src/app/user-session.service';
import { LoginRequest } from 'src/app/http/login-request.model';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// just a local type alias
type UserLoginData = LoginRequest;

@Component({
  selector: 'app-user-login-form',
  templateUrl: './user-login-form.component.html',
  styleUrls: ['./user-login-form.component.css'],

  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
})
export class UserLoginFormComponent implements OnInit {
  userLoginForm = this.formBuilder.group({
    username: [''],
    password: [''],
  });

  private userLoginData: UserLoginData = {
    username: '',
    password: '',
  };

  @Output() showError = new EventEmitter<string>();

  constructor(
    private formBuilder: FormBuilder,
    private userSessionService: UserSessionService) { }

  ngOnInit(): void {
    // subscribe to values changae of the form
    this.userLoginForm.valueChanges.subscribe((userLoginData) => {
      // look silly but safe
      if(userLoginData.username) this.userLoginData.username = userLoginData.username;
      if(userLoginData.password) this.userLoginData.password = userLoginData.password;
    });
  }

  onSubmit() {
    this.userSessionService.login(this.userLoginData).subscribe({
      next: (response) => {
        // login successfully
        // TODO: do redirect here...
      },
    
      error: (err: HttpErrorResponse) => {
        this.showError.emit(err.message);
      }
    });
  }
}
