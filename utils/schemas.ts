
/**
  * This schema mirrors the LI.FI v1 Quote documentation. It validates that IDs are strings, 
  * chain IDs are integers, and required objects like estimate are always present.
  */
export const QuoteSchema = {
  type: "object",
  required: ["id", "type", "tool", "action", "estimate", "transactionRequest"],
  properties: {
    id: { type: "string" },
    type: { type: "string", enum: ["lifi"] },
    tool: { type: "string" },
    action: {
      type: "object",
      required: ["fromChainId", "toChainId", "fromToken", "toToken"],
      properties: {
        fromChainId: { type: "integer" },
        toChainId: { type: "integer" },
        fromToken: { type: "object" },
        toToken: { type: "object" }
      }
    },
    estimate: {
      type: "object",
      required: ["fromAmount", "toAmount", "feeCosts", "gasCosts"],
      properties: {
        fromAmount: { type: "string" }, // BigInts are returned as strings in JSON
        toAmount: { type: "string" },
        executionDuration: { type: "integer" },
        feeCosts: { type: "array" },
        gasCosts: { type: "array" }
      }
    },
    transactionRequest: {
      type: "object",
      required: ["data", "to", "value", "from", "chainId"]
    }
  }
};

export const ToolsSchema = {
  type: "object",
  required: ["bridges", "exchanges"],
  properties: {
    bridges: {
      type: "array",
      items: {
        type: "object",
        required: ["key", "name", "logoURI", "supportedChains"],
        properties: {
          key: { type: "string" },
          name: { type: "string" },
          logoURI: { type: "string", format: "uri" },
          // Bridges use an array of FROM/TO objects
          supportedChains: {
            type: "array",
            items: {
              type: "object",
              required: ["fromChainId", "toChainId"],
              properties: {
                fromChainId: { type: "integer" },
                toChainId: { type: "integer" }
              }
            }
          }
        }
      }
    },
    exchanges: {
      type: "array",
      items: {
        type: "object",
        required: ["key", "name", "logoURI", "supportedChains"],
        properties: {
          key: { type: "string" },
          name: { type: "string" },
          logoURI: { type: "string", format: "uri" },
          // Exchanges use a simple array of integers
          supportedChains: {
            type: "array",
            items: { type: "integer" }
          }
        }
      }
    }
  }
};