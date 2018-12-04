export const COLLECTION_LOCATIONS: {
  [key: string]: { category: string; locations: string[] };
} = {
  clinic: {
    category: "Clinics",
    locations: [
      "University of Washington",
      "Harborview",
      "Northwest Hospital",
      "Seattle Children's",
      "Fred Hutch",
      "UW Fremont Clinic",
    ],
  },
  communityClinic: {
    category: "Clinical Sites",
    locations: ["Seamar So. King County", "UW Healthcare Equity"],
  },
  childcare: {
    category: "Childcare Facilities",
    locations: ["Hutch Kids", "UW Daycare"],
  },
  homeless: {
    category: "Homeless Shelters",
    locations: ["Health Care for the Homeless", "King County Public Health"],
  },
  pharmacy: {
    category: "Pharmacies",
    locations: ["Bartell", "Walgreens"],
  },
  port: {
    category: "International Ports",
    locations: [
      "Domestic Arrivals (SeaTac)",
      "Alaska Cruises",
      "International Arrivals (CDC)",
      "Alaska Airlines",
    ],
  },
  workplace: {
    category: "Workplaces",
    locations: ["Boeing", "Microsoft", "Amazon", "Other"],
  },
};
