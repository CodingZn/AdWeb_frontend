import { Component } from '@angular/core';
import { UserRegisterFormComponent } from '../user-register-form/user-register-form.component';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-register-page',
  templateUrl: './user-register-page.component.html',
  styleUrls: ['./user-register-page.component.css'],

  standalone: true,
  imports: [
    UserRegisterFormComponent,

    MatSnackBarModule,
  ]
})
export class UserRegisterPageComponent {
  constructor(private snackBar: MatSnackBar) {}

  showError(message: string) {
    console.debug(message);
    this.snackBar.open(message, 'Dismiss', {
      duration: 1500,
    });
  }
}
