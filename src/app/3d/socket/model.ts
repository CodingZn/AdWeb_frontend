type UserID = string;

export type ForwardMessageParams ={
  sender: UserID;
  receiver: UserID;
  message: string;
};

export type UpdatePlayerParams = {
  id: string;
  name: string;
  profileID: number;

  x: number;
  y: number;
  z: number;
  h: number;
  pb: number;

  action: string;
};
