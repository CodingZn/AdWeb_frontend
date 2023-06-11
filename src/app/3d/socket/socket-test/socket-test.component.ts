import { Component } from '@angular/core';
import {SocketService} from "../socket.service";

@Component({
  selector: 'app-socket-test',
  templateUrl: './socket-test.component.html',
  styleUrls: ['./socket-test.component.css']
})
export class SocketTestComponent {

  constructor(private socketService : SocketService) {
  }

}
