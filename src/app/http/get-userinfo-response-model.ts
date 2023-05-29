export interface GetUserinfoResponse{
  id: number;
  username: string;
  nickname: string;
  phone: string | null;
  email: string | null;
  profileID: number;
}
