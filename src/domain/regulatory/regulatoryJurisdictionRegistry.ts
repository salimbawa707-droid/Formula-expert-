/**
 * ============================================================================
 * P2 — REGULATORY JURISDICTION REGISTRY
 * ============================================================================
 * First-class jurisdiction objects for India, European Union, United States,
 * and Global UN GHS. Designed to support clean addition of new jurisdictions.
 * ============================================================================
 */

import { RegulatoryJurisdiction, RegulatoryJurisdictionId } from './types';

export const JURISDICTION_REGISTRY: Record<RegulatoryJurisdictionId, RegulatoryJurisdiction> = {
  INDIA: {
    id: 'INDIA',
    name: 'India Central & BIS Framework',
    countryOrRegion: 'India',
    governingAuthorities: [
      'Bureau of Indian Standards (BIS)',
      'Department of Legal Metrology',
      'Central Pollution Control Board (CPCB)',
      'Ministry of Environment, Forest and Climate Change (MoEFCC)'
    ],
    primaryLanguages: ['en', 'hi'],
    effectiveDatePolicy: 'TRANSITION_PERIOD',
    defaultCurrency: 'INR',
    status: 'ACTIVE'
  },
  EU: {
    id: 'EU',
    name: 'European Union Chemical & Detergent Regulation',
    countryOrRegion: 'European Union',
    governingAuthorities: [
      'European Chemicals Agency (ECHA)',
      'European Commission Directorate-General for Environment',
      'National Poison Centres (PCN/UFI)'
    ],
    primaryLanguages: ['en', 'de', 'fr', 'es', 'it'],
    effectiveDatePolicy: 'STRICT_PUBLICATION',
    defaultCurrency: 'EUR',
    status: 'ACTIVE'
  },
  US_FEDERAL: {
    id: 'US_FEDERAL',
    name: 'United States Federal (EPA & OSHA)',
    countryOrRegion: 'United States',
    governingAuthorities: [
      'US Environmental Protection Agency (EPA)',
      'Occupational Safety and Health Administration (OSHA)',
      'Federal Trade Commission (FTC - Green Guides)'
    ],
    primaryLanguages: ['en'],
    effectiveDatePolicy: 'ENFORCEMENT_DATE',
    defaultCurrency: 'USD',
    status: 'ACTIVE'
  },
  US_CARB: {
    id: 'US_CARB',
    name: 'California Air Resources Board (CARB VOC)',
    countryOrRegion: 'United States - California',
    governingAuthorities: ['California Air Resources Board (CARB)'],
    primaryLanguages: ['en'],
    effectiveDatePolicy: 'ENFORCEMENT_DATE',
    defaultCurrency: 'USD',
    status: 'ACTIVE'
  },
  US_STATE_CA: {
    id: 'US_STATE_CA',
    name: 'California Proposition 65 & Safer Consumer Products',
    countryOrRegion: 'United States - California',
    governingAuthorities: ['OEHHA (Office of Environmental Health Hazard Assessment)'],
    primaryLanguages: ['en'],
    effectiveDatePolicy: 'ENFORCEMENT_DATE',
    defaultCurrency: 'USD',
    status: 'ACTIVE'
  },
  US_STATE_NY: {
    id: 'US_STATE_NY',
    name: 'New York Environmental Conservation Law (1,4-Dioxane)',
    countryOrRegion: 'United States - New York',
    governingAuthorities: ['New York Department of Environmental Conservation (DEC)'],
    primaryLanguages: ['en'],
    effectiveDatePolicy: 'ENFORCEMENT_DATE',
    defaultCurrency: 'USD',
    status: 'ACTIVE'
  },
  GLOBAL_UN_GHS: {
    id: 'GLOBAL_UN_GHS',
    name: 'United Nations GHS Rev 9 Baseline',
    countryOrRegion: 'Global',
    governingAuthorities: ['United Nations Sub-Committee of Experts on GHS'],
    primaryLanguages: ['en'],
    effectiveDatePolicy: 'STRICT_PUBLICATION',
    defaultCurrency: 'USD',
    status: 'ACTIVE'
  }
};

export class RegulatoryJurisdictionEngine {
  public static getJurisdiction(id?: RegulatoryJurisdictionId): RegulatoryJurisdiction {
    if (!id || !JURISDICTION_REGISTRY[id]) {
      return JURISDICTION_REGISTRY.GLOBAL_UN_GHS;
    }
    return JURISDICTION_REGISTRY[id];
  }

  public static getAllJurisdictions(): RegulatoryJurisdiction[] {
    return Object.values(JURISDICTION_REGISTRY);
  }
}
