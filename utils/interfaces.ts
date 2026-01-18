export interface LifiTool {
  key: string;
  name: string;
  logoURI: string;
  supportedChains: number[];
}

export interface ToolsResponse {
  bridges: LifiTool[];
  exchanges: LifiTool[];
}