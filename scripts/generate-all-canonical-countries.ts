// ============================================================
// Script to generate src/data/countries/canonicalCountries.ts
// covering all 195 sovereign nations recognized by the UN
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { COUNTRY_METADATA } from '../src/data/questions/countryMetadata';
import { CountryRecord } from '../src/data/countries/types';

// Let's create a builder that has the complete canonical 195 sovereign states
// with verified data:
