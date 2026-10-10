/**
 * aperiron: The Passport Paradox
 * Compiled Passport Index Dataset
 *
 * Source: https://github.com/imorte/passport-index-data
 * License information: see src/data/passport-index/README.md
 * Catalog subset: 12 passports x 30 destinations.
 */

import type { CountryId } from '../shared/contracts';

import type { PassportIndexEntry } from './passportIndexData';
export type { PassportIndexEntry } from './passportIndexData';

export const PASSPORT_INDEX_DATA: Record<CountryId, Record<CountryId, PassportIndexEntry>> = {
  "SG": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "KR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "VN": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "AE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GB": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IT": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ES": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "CH": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "CA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "MX": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "NZ": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "DE": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "VN": {
      "accessLevel": "visa_free",
      "maxStayDays": 45,
      "rawRequirement": "45"
    },
    "AE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "GB": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FR": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "visa free"
    },
    "IT": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "visa free"
    },
    "ES": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "visa free"
    },
    "CH": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "visa free"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "CA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MX": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "NZ": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "JP": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "IN": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "VN": {
      "accessLevel": "visa_free",
      "maxStayDays": 45,
      "rawRequirement": "45"
    },
    "AE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GB": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IT": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ES": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "CH": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "CA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MX": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "NZ": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "US": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "VN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GB": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IT": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ES": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "CH": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "CA": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "BR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "MX": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "NZ": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "GB": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "VN": {
      "accessLevel": "visa_free",
      "maxStayDays": 45,
      "rawRequirement": "45"
    },
    "AE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GB": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "FR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IT": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ES": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "CH": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "CA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MX": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "NZ": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "AE": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IN": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "VN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AE": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "QA": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "visa free"
    },
    "DE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GB": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IT": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ES": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "CH": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "US": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MX": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "EG": {
      "accessLevel": "visa_free",
      "maxStayDays": 180,
      "rawRequirement": "180"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NZ": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "BR": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ID": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "KR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "VN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GB": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IT": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ES": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "CH": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "MX": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NZ": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "ZA": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "IN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "VN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GB": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "IT": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ES": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CH": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "TR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MX": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NZ": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "IN": {
    "SG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "JP": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "IN": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "VN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GB": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "IT": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ES": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CH": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "TR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GE": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "US": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "BR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "MX": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "AR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ZA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "EG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NZ": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "TR": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "IN": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "KR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "VN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "QA": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "DE": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GB": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "IT": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ES": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CH": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "TR": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "GE": {
      "accessLevel": "visa_free",
      "maxStayDays": 360,
      "rawRequirement": "360"
    },
    "US": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MX": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "AR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "ZA": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "EG": {
      "accessLevel": "visa_on_arrival",
      "maxStayDays": null,
      "rawRequirement": "visa on arrival"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NZ": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "PH": {
    "SG": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "JP": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "IN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "TH": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "ID": {
      "accessLevel": "visa_free",
      "maxStayDays": 30,
      "rawRequirement": "30"
    },
    "KR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "VN": {
      "accessLevel": "visa_free",
      "maxStayDays": 21,
      "rawRequirement": "21"
    },
    "AE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "QA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "DE": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GB": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "IT": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ES": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CH": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "TR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "US": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "BR": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "MX": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "AR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ZA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "EG": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "KE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "eta"
    },
    "MA": {
      "accessLevel": "visa_free",
      "maxStayDays": 90,
      "rawRequirement": "90"
    },
    "NG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NZ": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  },
  "NG": {
    "SG": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "JP": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "IN": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "TH": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "ID": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "KR": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "VN": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "AE": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "QA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "DE": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GB": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "IT": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ES": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CH": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "TR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "GE": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "US": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "CA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "BR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "MX": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "AR": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "ZA": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "EG": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "KE": {
      "accessLevel": "visa_free",
      "maxStayDays": 60,
      "rawRequirement": "60"
    },
    "MA": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "NG": {
      "accessLevel": "visa_free",
      "maxStayDays": null,
      "rawRequirement": "-1"
    },
    "AU": {
      "accessLevel": "evisa",
      "maxStayDays": null,
      "rawRequirement": "e-visa"
    },
    "NZ": {
      "accessLevel": "visa_required",
      "maxStayDays": null,
      "rawRequirement": "visa required"
    },
    "FJ": {
      "accessLevel": "visa_free",
      "maxStayDays": 120,
      "rawRequirement": "120"
    }
  }
};

/**
 * Resolves entry requirements from the bundled third-party Passport Index snapshot.
 */
export function getPassportIndexEntry(
  passportId: CountryId,
  destinationId: CountryId
): PassportIndexEntry | undefined {
  if (passportId === destinationId) {
    return {
      accessLevel: 'visa_free',
      maxStayDays: null,
      rawRequirement: 'Domestic entry'
    };
  }
  return PASSPORT_INDEX_DATA[passportId]?.[destinationId];
}
