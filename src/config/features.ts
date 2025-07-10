/**
 * Feature flags configuration
 * 
 * This file controls which features/sections of the application are currently active.
 * To enable a feature, set its value to true.
 */

const features = {
  // Main navigation sections
  feed: false,        // Coastline Chatter
  vibeGroups: false,  // Vibe Groups
  properties: false,  // Properties
  market: false,      // Coastline Market
  directory: true,    // Local Directory (currently active)

  // Other features
  notifications: false,
  messaging: false,
  events: false,
};

export default features; 