
export interface IntentLayers {
  commercial: string[];
  transactional: string[];
  informational: string[];
}

export interface Relationship {
  from: string;
  to: string;
  type: 'supports' | 'parent' | 'relates' | 'includes' | 'alternative' | 'complementary';
}

export interface SemanticMap {
  entities: string[];
  services: string[];
  intentLayers: IntentLayers;
  relationships: Relationship[];
}

export interface ArchitectureRun {
  id: string;
  created_at: string;
  business_name: string;
  service_domain: string;
  region?: string;
  debug_mode: boolean;
  semantic_map?: SemanticMap;
  ascii_tree: string;
}

export interface GenerateParams {
  businessName: string;
  serviceDomain: string;
  region?: string;
  debugMode: boolean;
}
