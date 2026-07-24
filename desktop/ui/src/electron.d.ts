export interface IElectronAPI {
  request: (action: string, payload?: any) => Promise<any>;
  sendAction: (action: string, payload?: any) => void;
  onEvent: (callback: (payload: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
