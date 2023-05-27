import { Component } from '@angular/core';
import { UserLoginFormComponent } from '../user-login-form/user-login-form.component';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-login-page',
  templateUrl: './user-login-page.component.html',
  styleUrls: ['./user-login-page.component.css'],

  standalone: true,
  imports: [
    UserLoginFormComponent,

    MatSnackBarModule,
  ],

})
export class UserLoginPageComponent {
  constructor(private snackBar: MatSnackBar) {}

  showError(message: string) {
    console.debug(message);
    this.snackBar.open(message, 'Dismiss', {
      duration: 1500,
    });
  }
}
