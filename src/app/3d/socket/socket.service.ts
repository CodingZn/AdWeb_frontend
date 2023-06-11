import {io, Socket} from "socket.io-client";
import {Injectable, OnDestroy, OnInit} from "@angular/core";
import {ClientEvent, ServerEvent} from "./Event";
import {ForwardMessageParams, UpdatePlayerParams} from "./model";

const socketUrl = "http://localhost:12345";

@Injectable()
export class SocketService {
  socket: Socket;
  constructor() {
    this.socket = io(socketUrl);
    console.log(0)

    let socket = this.socket;
    socket.on("connect", () => {
      console.log(socket.id);
    });

    socket.on("disconnect", () => {
      console.log(socket.id);
    });

    socket.on(ClientEvent.ReceiveMessage, onReceiveMessage)

    socket.on(ClientEvent.UpdatePlayer, onUpdatePlayer)

  }

  forwardMessage(data:ForwardMessageParams){
    this.socket.emit(ServerEvent.ForwardMessage, data);
  }

  updatePlayer(data: UpdatePlayerParams){
    this.socket.emit(ServerEvent.UpdatePlayer, data);
  }

}

function onReceiveMessage(data: ForwardMessageParams) {

}

function onUpdatePlayer(data: UpdatePlayerParams) {

}
