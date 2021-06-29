import { AppInfoResponse, AppSignalCb } from "@holochain/conductor-api";

export type Branding = {
  app_name: string;
  logo_url?: string;
  info_link?: string;
  publisher_name?: string;
};

export type WebSdkEvent =
  | "signin"
  | "signup"
  | "signout"
  | "canceled"
  | "connected"
  | "disconnected";

export declare class Connection {
  constructor(
    chaperone_url: string | null,
    signalHandler: AppSignalCb,
    branding: Branding
  );

  ready(): Promise<void>;
  signIn(): Promise<boolean>;
  signUp(): Promise<boolean>;
  signOut(): Promise<boolean>;
  context(): Promise<number>;
  holoInfo(): Promise<{ url: string }>;
  on(event: WebSdkEvent, callback: (event: any) => {}): void;

  zomeCall(
    dna_handle: string,
    zome_name: string,
    fn_name: string,
    payload: any
  ): Promise<any>;

  appInfo(installed_app_info?: string): Promise<AppInfoResponse>;
}
