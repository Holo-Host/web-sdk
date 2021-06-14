import { AppInfoResponse, AppSignalCb } from "@holochain/conductor-api";

export type Branding = {
  app_name: string;
  logo_url?: string;
  info_link?: string;
  publisher_name?: string;
};

export declare class Connection {
  constructor(
    chaperone_url: string,
    signalHandler: AppSignalCb,
    branding: Branding
  );

  zomeCall(
    dna_handle: string,
    zome_name: string,
    fn_name: string,
    payload: any
  ): Promise<any>;

  appInfo(installed_app_info: string): Promise<AppInfoResponse>;
}
