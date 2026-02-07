/**
 * Provider capabilities for feature detection.
 * Views use this to conditionally show/hide UI elements.
 */
export interface ProviderCapabilities {
  hasNamespaces: boolean
  hasIntentions: boolean
  hasConfigEntries: boolean
  hasSessions: boolean
  hasMcp: boolean
  hasAgents: boolean
  hasAuditLog: boolean
  hasPlugins: boolean
}

export const batataCapabilities: ProviderCapabilities = {
  hasNamespaces: true,
  hasIntentions: false,
  hasConfigEntries: false,
  hasSessions: false,
  hasMcp: true,
  hasAgents: true,
  hasAuditLog: true,
  hasPlugins: true,
}

export const consulCapabilities: ProviderCapabilities = {
  hasNamespaces: false,
  hasIntentions: true,
  hasConfigEntries: true,
  hasSessions: true,
  hasMcp: false,
  hasAgents: false,
  hasAuditLog: false,
  hasPlugins: false,
}
