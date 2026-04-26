import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";
import {
  BidStatus,
  CertificationStatus,
  ExperienceLevel,
  Gender,
  RequestStatus,
  UserType,
} from "../generated/prisma/enums.js";

const DEFAULT_PASSWORD = "Password123!";

const categorySeedData = [
  {
    name: "Errands",
    slug: "errands",
    icon: "basket-outline",
    color: "#22C55E",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Transportation",
    slug: "transportation",
    icon: "car-outline",
    color: "#3B82F6",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Health Support",
    slug: "health-support",
    icon: "medkit-outline",
    color: "#EF4444",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Home Help",
    slug: "home-help",
    icon: "home-outline",
    color: "#F59E0B",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Pet Care",
    slug: "pet-care",
    icon: "paw-outline",
    color: "#8B5CF6",
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Moving",
    slug: "moving",
    icon: "cube-outline",
    color: "#6366F1",
    sortOrder: 6,
    isActive: true,
  },
  {
    name: "Outdoor Help",
    slug: "outdoor-help",
    icon: "leaf-outline",
    color: "#10B981",
    sortOrder: 7,
    isActive: true,
  },
] as const;

const skillSeedData = [
  { name: "Cleaning", slug: "cleaning", categorySlug: "home-help" },
  { name: "Moving help", slug: "moving-help", categorySlug: "moving" },
  { name: "Delivery", slug: "delivery", categorySlug: "errands" },
  { name: "Pet care", slug: "pet-care", categorySlug: "pet-care" },
  { name: "Tutoring", slug: "tutoring", categorySlug: null },
  { name: "Elderly assistance", slug: "elderly-assistance", categorySlug: "health-support" },
  { name: "Repairs", slug: "repairs", categorySlug: "home-help" },
  { name: "Gardening", slug: "gardening", categorySlug: "outdoor-help" },
  { name: "Tech help", slug: "tech-help", categorySlug: null },
  { name: "Childcare", slug: "childcare", categorySlug: null },
] as const;

const userQualificationSeedData = [
  {
    email: "james.helper@example.com",
    skills: [
      { skillSlug: "delivery", experienceLevel: ExperienceLevel.ADVANCED, yearsExperience: 4, isPrimary: true },
      { skillSlug: "elderly-assistance", experienceLevel: ExperienceLevel.ADVANCED, yearsExperience: 5, isPrimary: true },
      { skillSlug: "moving-help", experienceLevel: ExperienceLevel.INTERMEDIATE, yearsExperience: 2, isPrimary: false },
    ],
    certifications: [
      {
        name: "First Aid Basics",
        issuer: "Community Safety Board",
        credentialId: "FA-2025-JL",
        proofUrl: "https://example.com/certifications/james-first-aid.png",
        status: CertificationStatus.APPROVED,
      },
    ],
  },
  {
    email: "mikko.helper@example.com",
    skills: [
      { skillSlug: "moving-help", experienceLevel: ExperienceLevel.EXPERT, yearsExperience: 8, isPrimary: true },
      { skillSlug: "gardening", experienceLevel: ExperienceLevel.ADVANCED, yearsExperience: 6, isPrimary: true },
      { skillSlug: "repairs", experienceLevel: ExperienceLevel.INTERMEDIATE, yearsExperience: 3, isPrimary: false },
    ],
    certifications: [
      {
        name: "Home Safety Handling",
        issuer: "Finnish Home Assist Network",
        credentialId: "HS-2024-MS",
        proofUrl: "https://example.com/certifications/mikko-home-safety.png",
        status: CertificationStatus.APPROVED,
      },
    ],
  },
] as const;

const users = [
  {
    email: "maria.requester@example.com",
    phone: "+15550000001",
    isVerified: true,
    profile: {
      fullName: "Maria Santos",
      bio: "Needs occasional neighborhood support.",
      userType: UserType.ELDERLY,
      gender: Gender.FEMALE,
      helpCount: 2,
      rating: 4.2,
      searchRadiusMeters: 1200,
      address: {
        latitude: 60.1708,
        longitude: 24.9375,
        addressLine1: "Kamppi",
        city: "Helsinki",
        state: "Uusimaa",
        postalCode: "00100",
        country: "Finland",
        formattedAddress: "Kamppi, 00100 Helsinki, Finland",
      },
    },
  },
  {
    email: "james.helper@example.com",
    phone: "+15550000002",
    isVerified: true,
    profile: {
      fullName: "James Lee",
      bio: "Happy to help with groceries, transport, and errands.",
      userType: UserType.GENERAL,
      gender: Gender.MALE,
      helpCount: 14,
      rating: 4.8,
      searchRadiusMeters: 5000,
      address: {
        latitude: 60.1695,
        longitude: 24.9354,
        addressLine1: "Punavuori",
        city: "Helsinki",
        state: "Uusimaa",
        postalCode: "00120",
        country: "Finland",
        formattedAddress: "Punavuori, 00120 Helsinki, Finland",
      },
    },
  },
  {
    email: "olivia.requester@example.com",
    phone: "+15550000003",
    isVerified: true,
    profile: {
      fullName: "Olivia Carter",
      bio: "Looking for occasional help with transportation and chores.",
      userType: UserType.GENERAL,
      gender: Gender.FEMALE,
      helpCount: 3,
      rating: 4.4,
      searchRadiusMeters: 2500,
      address: {
        latitude: 60.1887,
        longitude: 24.9632,
        addressLine1: "Kallio",
        city: "Helsinki",
        state: "Uusimaa",
        postalCode: "00530",
        country: "Finland",
        formattedAddress: "Kallio, 00530 Helsinki, Finland",
      },
    },
  },
  {
    email: "david.requester@example.com",
    phone: "+15550000004",
    isVerified: true,
    profile: {
      fullName: "David Kim",
      bio: "Needs support with moving and home maintenance tasks.",
      userType: UserType.GENERAL,
      gender: Gender.MALE,
      helpCount: 1,
      rating: 4.1,
      searchRadiusMeters: 3000,
      address: {
        latitude: 60.2055,
        longitude: 24.6559,
        addressLine1: "Tapiola",
        city: "Espoo",
        state: "Uusimaa",
        postalCode: "02100",
        country: "Finland",
        formattedAddress: "Tapiola, 02100 Espoo, Finland",
      },
    },
  },

  {
    email: "aino.requester@example.com",
    phone: "+15550000005",
    isVerified: true,
    profile: {
      fullName: "Aino Nieminen",
      bio: "Needs help with errands and home tasks in Tampere.",
      userType: UserType.GENERAL,
      gender: Gender.FEMALE,
      helpCount: 4,
      rating: 4.5,
      searchRadiusMeters: 2500,
      address: {
        latitude: 61.4978,
        longitude: 23.7610,
        addressLine1: "Keskusta",
        city: "Tampere",
        state: "Pirkanmaa",
        postalCode: "33100",
        country: "Finland",
        formattedAddress: "Keskusta, 33100 Tampere, Finland",
      },
    },
  },
  {
    email: "mikko.helper@example.com",
    phone: "+15550000006",
    isVerified: true,
    profile: {
      fullName: "Mikko Salonen",
      bio: "Available for moving, outdoor help, and transport around Tampere.",
      userType: UserType.GENERAL,
      gender: Gender.MALE,
      helpCount: 19,
      rating: 4.9,
      searchRadiusMeters: 8000,
      address: {
        latitude: 61.4991,
        longitude: 23.7871,
        addressLine1: "Kaleva",
        city: "Tampere",
        state: "Pirkanmaa",
        postalCode: "33540",
        country: "Finland",
        formattedAddress: "Kaleva, 33540 Tampere, Finland",
      },
    },
  },
  {
    email: "sofia.requester@example.com",
    phone: "+15550000007",
    isVerified: true,
    profile: {
      fullName: "Sofia Laakso",
      bio: "Looking for pet care and grocery support in Turku.",
      userType: UserType.GENERAL,
      gender: Gender.FEMALE,
      helpCount: 5,
      rating: 4.3,
      searchRadiusMeters: 2200,
      address: {
        latitude: 60.4518,
        longitude: 22.2666,
        addressLine1: "City Centre",
        city: "Turku",
        state: "Southwest Finland",
        postalCode: "20100",
        country: "Finland",
        formattedAddress: "City Centre, 20100 Turku, Finland",
      },
    },
  },
  {
    email: "pekka.requester@example.com",
    phone: "+15550000008",
    isVerified: true,
    profile: {
      fullName: "Pekka Virtanen",
      bio: "Needs support with health visits and home chores in Oulu.",
      userType: UserType.ELDERLY,
      gender: Gender.MALE,
      helpCount: 2,
      rating: 4.0,
      searchRadiusMeters: 2000,
      address: {
        latitude: 65.0121,
        longitude: 25.4651,
        addressLine1: "Tuira",
        city: "Oulu",
        state: "North Ostrobothnia",
        postalCode: "90500",
        country: "Finland",
        formattedAddress: "Tuira, 90500 Oulu, Finland",
      },
    },
  },
  {
    email: "emma.requester@example.com",
    phone: "+15550000009",
    isVerified: true,
    profile: {
      fullName: "Emma Hämäläinen",
      bio: "Needs occasional moving and errand help in Vantaa.",
      userType: UserType.GENERAL,
      gender: Gender.FEMALE,
      helpCount: 1,
      rating: 4.1,
      searchRadiusMeters: 3000,
      address: {
        latitude: 60.2934,
        longitude: 25.0378,
        addressLine1: "Tikkurila",
        city: "Vantaa",
        state: "Uusimaa",
        postalCode: "01300",
        country: "Finland",
        formattedAddress: "Tikkurila, 01300 Vantaa, Finland",
      },
    },
  },
  {
    email: "liam.requester@example.com",
    phone: "+15550000010",
    isVerified: true,
    profile: {
      fullName: "Liam Korhonen",
      bio: "Needs outdoor and transportation help around Jyväskylä.",
      userType: UserType.GENERAL,
      gender: Gender.MALE,
      helpCount: 3,
      rating: 4.2,
      searchRadiusMeters: 3500,
      address: {
        latitude: 62.2426,
        longitude: 25.7473,
        addressLine1: "Matkakeskus",
        city: "Jyväskylä",
        state: "Central Finland",
        postalCode: "40100",
        country: "Finland",
        formattedAddress: "Matkakeskus, 40100 Jyväskylä, Finland",
      },
    },
  },
  {
    email: "noora.requester@example.com",
    phone: "+15550000011",
    isVerified: true,
    profile: {
      fullName: "Noora Heikkinen",
      bio: "Looking for pet care and home help in Kuopio.",
      userType: UserType.GENERAL,
      gender: Gender.FEMALE,
      helpCount: 2,
      rating: 4.4,
      searchRadiusMeters: 2400,
      address: {
        latitude: 62.8924,
        longitude: 27.6782,
        addressLine1: "Kuopio Centre",
        city: "Kuopio",
        state: "North Savo",
        postalCode: "70100",
        country: "Finland",
        formattedAddress: "Kuopio Centre, 70100 Kuopio, Finland",
      },
    },
  },
  {
    email: "otto.requester@example.com",
    phone: "+15550000012",
    isVerified: true,
    profile: {
      fullName: "Otto Lehtinen",
      bio: "Needs moving and errand support in Lahti.",
      userType: UserType.GENERAL,
      gender: Gender.MALE,
      helpCount: 2,
      rating: 4.0,
      searchRadiusMeters: 3000,
      address: {
        latitude: 60.9827,
        longitude: 25.6615,
        addressLine1: "Lahti Center",
        city: "Lahti",
        state: "Päijät-Häme",
        postalCode: "15110",
        country: "Finland",
        formattedAddress: "Lahti Center, 15110 Lahti, Finland",
      },
    },
  },
  {
    email: "elin.requester@example.com",
    phone: "+15550000013",
    isVerified: true,
    profile: {
      fullName: "Elin Johansson",
      bio: "Needs practical support with winter tasks in Rovaniemi.",
      userType: UserType.GENERAL,
      gender: Gender.FEMALE,
      helpCount: 1,
      rating: 4.3,
      searchRadiusMeters: 3500,
      address: {
        latitude: 66.5039,
        longitude: 25.7294,
        addressLine1: "Rovaniemi Centre",
        city: "Rovaniemi",
        state: "Lapland",
        postalCode: "96200",
        country: "Finland",
        formattedAddress: "Rovaniemi Centre, 96200 Rovaniemi, Finland",
      },
    },
  },
] as const;

const requestSeedData = [
  {
    requesterEmail: "maria.requester@example.com",
    title: "Need help picking up groceries",
    description:
      "Looking for someone to help pick up essentials from a nearby store this afternoon.",
    categorySlug: "errands",
    budget: 20,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2000,
    location: {
      latitude: 60.1712,
      longitude: 24.9412,
      addressLine1: "Forum Shopping Area",
      city: "Helsinki",
      state: "Uusimaa",
      postalCode: "00100",
      country: "Finland",
      formattedAddress: "Forum Shopping Area, 00100 Helsinki, Finland",
    },
  },
  {
    requesterEmail: "maria.requester@example.com",
    title: "Need a ride to clinic appointment",
    description: "Need transport to and from a clinic appointment on Friday morning.",
    categorySlug: "transportation",
    budget: 25,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 5000,
    location: {
      latitude: 60.1841,
      longitude: 24.9502,
      addressLine1: "Töölö Health Center",
      city: "Helsinki",
      state: "Uusimaa",
      postalCode: "00260",
      country: "Finland",
      formattedAddress: "Töölö Health Center, 00260 Helsinki, Finland",
    },
  },
  {
    requesterEmail: "maria.requester@example.com",
    title: "Help with organizing medicine box",
    description: "Need someone patient to help sort weekly medications and labels.",
    categorySlug: "health-support",
    budget: 15,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1200,
    location: {
      latitude: 60.1708,
      longitude: 24.9375,
      addressLine1: "Kamppi Residence",
      city: "Helsinki",
      state: "Uusimaa",
      postalCode: "00100",
      country: "Finland",
      formattedAddress: "Kamppi Residence, 00100 Helsinki, Finland",
    },
  },
  {
    requesterEmail: "maria.requester@example.com",
    title: "Need help watering balcony plants",
    description:
      "Looking for someone to water and check my balcony plants while I recover at home.",
    categorySlug: "home-help",
    budget: 10,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1000,
    location: {
      latitude: 60.1709,
      longitude: 24.9378,
      addressLine1: "Kamppi Apartment",
      city: "Helsinki",
      state: "Uusimaa",
      postalCode: "00100",
      country: "Finland",
      formattedAddress: "Kamppi Apartment, 00100 Helsinki, Finland",
    },
  },

  {
    requesterEmail: "olivia.requester@example.com",
    title: "Need assistance assembling a bookshelf",
    description: "Bought a flat-pack shelf and need help assembling it safely.",
    categorySlug: "home-help",
    budget: 30,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1500,
    location: {
      latitude: 60.1892,
      longitude: 24.964,
      addressLine1: "Kallio Apartment",
      city: "Helsinki",
      state: "Uusimaa",
      postalCode: "00530",
      country: "Finland",
      formattedAddress: "Kallio Apartment, 00530 Helsinki, Finland",
    },
  },
  {
    requesterEmail: "olivia.requester@example.com",
    title: "Looking for dog walking support",
    description: "Need help walking my small dog in the evenings this week.",
    categorySlug: "pet-care",
    budget: 12,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1800,
    location: {
      latitude: 60.1903,
      longitude: 24.9661,
      addressLine1: "Karhupuisto Area",
      city: "Helsinki",
      state: "Uusimaa",
      postalCode: "00530",
      country: "Finland",
      formattedAddress: "Karhupuisto Area, 00530 Helsinki, Finland",
    },
  },
  {
    requesterEmail: "olivia.requester@example.com",
    title: "Need help with airport drop-off",
    description:
      "Looking for a reliable ride to the airport early Saturday morning with two suitcases.",
    categorySlug: "transportation",
    budget: 35,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 10000,
    location: {
      latitude: 60.3172,
      longitude: 24.9633,
      addressLine1: "Helsinki Airport Departures",
      city: "Vantaa",
      state: "Uusimaa",
      postalCode: "01530",
      country: "Finland",
      formattedAddress: "Helsinki Airport, 01530 Vantaa, Finland",
    },
  },
  {
    requesterEmail: "olivia.requester@example.com",
    title: "Need grocery delivery from local market",
    description:
      "Need a few grocery items picked up from the neighborhood market before dinner.",
    categorySlug: "errands",
    budget: 18,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2000,
    location: {
      latitude: 60.1884,
      longitude: 24.9627,
      addressLine1: "Hakaniemi Market Hall",
      city: "Helsinki",
      state: "Uusimaa",
      postalCode: "00530",
      country: "Finland",
      formattedAddress: "Hakaniemi Market Hall, 00530 Helsinki, Finland",
    },
  },

  {
    requesterEmail: "david.requester@example.com",
    title: "Need help moving boxes this weekend",
    description: "Need one person to help move packed boxes to a storage unit.",
    categorySlug: "moving",
    budget: 40,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 4000,
    location: {
      latitude: 60.2055,
      longitude: 24.6559,
      addressLine1: "Tapiola Apartment",
      city: "Espoo",
      state: "Uusimaa",
      postalCode: "02100",
      country: "Finland",
      formattedAddress: "Tapiola Apartment, 02100 Espoo, Finland",
    },
  },
  {
    requesterEmail: "david.requester@example.com",
    title: "Need basic yard cleanup",
    description:
      "Need help raking leaves and bagging small branches in the front yard.",
    categorySlug: "outdoor-help",
    budget: 28,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2500,
    location: {
      latitude: 60.2072,
      longitude: 24.6594,
      addressLine1: "Detached Home Yard",
      city: "Espoo",
      state: "Uusimaa",
      postalCode: "02100",
      country: "Finland",
      formattedAddress: "Detached Home Yard, 02100 Espoo, Finland",
    },
  },
  {
    requesterEmail: "david.requester@example.com",
    title: "Looking for furniture lifting help",
    description:
      "Need an extra pair of hands to move a sofa and dining table within the apartment.",
    categorySlug: "moving",
    budget: 22,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1800,
    location: {
      latitude: 60.2061,
      longitude: 24.6571,
      addressLine1: "Tapiola Flat",
      city: "Espoo",
      state: "Uusimaa",
      postalCode: "02100",
      country: "Finland",
      formattedAddress: "Tapiola Flat, 02100 Espoo, Finland",
    },
  },

  {
    requesterEmail: "aino.requester@example.com",
    title: "Need pharmacy pickup and delivery",
    description:
      "Need someone to collect a prescription from the pharmacy and bring it home this evening.",
    categorySlug: "errands",
    budget: 16,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2500,
    location: {
      latitude: 61.4982,
      longitude: 23.7608,
      addressLine1: "Hämeenkatu Pharmacy",
      city: "Tampere",
      state: "Pirkanmaa",
      postalCode: "33100",
      country: "Finland",
      formattedAddress: "Hämeenkatu Pharmacy, 33100 Tampere, Finland",
    },
  },
  {
    requesterEmail: "aino.requester@example.com",
    title: "Need help carrying groceries upstairs",
    description:
      "Need help bringing heavy grocery bags up to the third floor, no elevator.",
    categorySlug: "home-help",
    budget: 14,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1200,
    location: {
      latitude: 61.4975,
      longitude: 23.7615,
      addressLine1: "Central Apartment Building",
      city: "Tampere",
      state: "Pirkanmaa",
      postalCode: "33100",
      country: "Finland",
      formattedAddress: "Central Apartment Building, 33100 Tampere, Finland",
    },
  },
  {
    requesterEmail: "aino.requester@example.com",
    title: "Need a ride to Tampere University Hospital",
    description:
      "Looking for help getting to a morning appointment and back home afterward.",
    categorySlug: "transportation",
    budget: 26,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 7000,
    location: {
      latitude: 61.5030,
      longitude: 23.8123,
      addressLine1: "Tampere University Hospital",
      city: "Tampere",
      state: "Pirkanmaa",
      postalCode: "33521",
      country: "Finland",
      formattedAddress: "Tampere University Hospital, 33521 Tampere, Finland",
    },
  },
  {
    requesterEmail: "aino.requester@example.com",
    title: "Need spring balcony cleanup",
    description:
      "Would like help sweeping the balcony and moving a few flower pots.",
    categorySlug: "outdoor-help",
    budget: 18,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1500,
    location: {
      latitude: 61.5001,
      longitude: 23.7702,
      addressLine1: "Keskusta Balcony",
      city: "Tampere",
      state: "Pirkanmaa",
      postalCode: "33100",
      country: "Finland",
      formattedAddress: "Keskusta Balcony, 33100 Tampere, Finland",
    },
  },

  {
    requesterEmail: "sofia.requester@example.com",
    title: "Need cat sitting for one weekend",
    description:
      "Looking for someone to feed my cat and clean the litter box during a weekend trip.",
    categorySlug: "pet-care",
    budget: 25,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 3000,
    location: {
      latitude: 60.4526,
      longitude: 22.2662,
      addressLine1: "Turku Centre Apartment",
      city: "Turku",
      state: "Southwest Finland",
      postalCode: "20100",
      country: "Finland",
      formattedAddress: "Turku Centre Apartment, 20100 Turku, Finland",
    },
  },
  {
    requesterEmail: "sofia.requester@example.com",
    title: "Need help buying groceries from market hall",
    description:
      "Need fresh vegetables, bread, and milk picked up from the market hall.",
    categorySlug: "errands",
    budget: 17,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2200,
    location: {
      latitude: 60.4513,
      longitude: 22.2692,
      addressLine1: "Turku Market Hall",
      city: "Turku",
      state: "Southwest Finland",
      postalCode: "20100",
      country: "Finland",
      formattedAddress: "Turku Market Hall, 20100 Turku, Finland",
    },
  },
  {
    requesterEmail: "sofia.requester@example.com",
    title: "Need help assembling a dining table",
    description:
      "Need someone with basic tools to assemble a new dining table.",
    categorySlug: "home-help",
    budget: 32,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2500,
    location: {
      latitude: 60.4540,
      longitude: 22.2630,
      addressLine1: "Port Arthur Apartment",
      city: "Turku",
      state: "Southwest Finland",
      postalCode: "20100",
      country: "Finland",
      formattedAddress: "Port Arthur Apartment, 20100 Turku, Finland",
    },
  },

  {
    requesterEmail: "pekka.requester@example.com",
    title: "Need transport to Oulu health center",
    description:
      "Need a reliable ride for a checkup and help getting back home safely.",
    categorySlug: "transportation",
    budget: 24,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 6000,
    location: {
      latitude: 65.0115,
      longitude: 25.4710,
      addressLine1: "Oulu Health Center",
      city: "Oulu",
      state: "North Ostrobothnia",
      postalCode: "90100",
      country: "Finland",
      formattedAddress: "Oulu Health Center, 90100 Oulu, Finland",
    },
  },
  {
    requesterEmail: "pekka.requester@example.com",
    title: "Need help changing bed linens",
    description:
      "Need help with changing bed sheets and a quick tidy-up in the bedroom.",
    categorySlug: "home-help",
    budget: 15,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1500,
    location: {
      latitude: 65.0124,
      longitude: 25.4647,
      addressLine1: "Tuira Apartment",
      city: "Oulu",
      state: "North Ostrobothnia",
      postalCode: "90500",
      country: "Finland",
      formattedAddress: "Tuira Apartment, 90500 Oulu, Finland",
    },
  },
  {
    requesterEmail: "pekka.requester@example.com",
    title: "Need help organizing medication reminders",
    description:
      "Looking for patient support to sort medicine strips and set reminders.",
    categorySlug: "health-support",
    budget: 18,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1800,
    location: {
      latitude: 65.0130,
      longitude: 25.4662,
      addressLine1: "Tuira Residence",
      city: "Oulu",
      state: "North Ostrobothnia",
      postalCode: "90500",
      country: "Finland",
      formattedAddress: "Tuira Residence, 90500 Oulu, Finland",
    },
  },

  {
    requesterEmail: "emma.requester@example.com",
    title: "Need help taking boxes to storage",
    description:
      "Need help loading boxes into a van and unloading at a nearby storage unit.",
    categorySlug: "moving",
    budget: 34,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 4500,
    location: {
      latitude: 60.2937,
      longitude: 25.0391,
      addressLine1: "Tikkurila Apartment",
      city: "Vantaa",
      state: "Uusimaa",
      postalCode: "01300",
      country: "Finland",
      formattedAddress: "Tikkurila Apartment, 01300 Vantaa, Finland",
    },
  },
  {
    requesterEmail: "emma.requester@example.com",
    title: "Need grocery pickup before evening",
    description:
      "Need a few essentials picked up from the local supermarket before 7 PM.",
    categorySlug: "errands",
    budget: 15,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1800,
    location: {
      latitude: 60.2948,
      longitude: 25.0402,
      addressLine1: "Tikkurila Station Area",
      city: "Vantaa",
      state: "Uusimaa",
      postalCode: "01300",
      country: "Finland",
      formattedAddress: "Tikkurila Station Area, 01300 Vantaa, Finland",
    },
  },
  {
    requesterEmail: "emma.requester@example.com",
    title: "Need help with airport luggage pickup",
    description:
      "Need someone to help collect luggage and assist with transport home from the airport.",
    categorySlug: "transportation",
    budget: 30,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 12000,
    location: {
      latitude: 60.3172,
      longitude: 24.9633,
      addressLine1: "Helsinki Airport Arrivals",
      city: "Vantaa",
      state: "Uusimaa",
      postalCode: "01530",
      country: "Finland",
      formattedAddress: "Helsinki Airport Arrivals, 01530 Vantaa, Finland",
    },
  },

  {
    requesterEmail: "liam.requester@example.com",
    title: "Need help clearing leaves from yard",
    description:
      "Looking for help raking leaves and cleaning a small front yard.",
    categorySlug: "outdoor-help",
    budget: 21,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 3000,
    location: {
      latitude: 62.2434,
      longitude: 25.7480,
      addressLine1: "Residential Yard",
      city: "Jyväskylä",
      state: "Central Finland",
      postalCode: "40100",
      country: "Finland",
      formattedAddress: "Residential Yard, 40100 Jyväskylä, Finland",
    },
  },
  {
    requesterEmail: "liam.requester@example.com",
    title: "Need a ride to railway station",
    description:
      "Need early morning transport to the station with one suitcase.",
    categorySlug: "transportation",
    budget: 19,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 5000,
    location: {
      latitude: 62.2418,
      longitude: 25.7595,
      addressLine1: "Jyväskylä Travel Centre",
      city: "Jyväskylä",
      state: "Central Finland",
      postalCode: "40100",
      country: "Finland",
      formattedAddress: "Jyväskylä Travel Centre, 40100 Jyväskylä, Finland",
    },
  },
  {
    requesterEmail: "liam.requester@example.com",
    title: "Need help picking up hardware supplies",
    description:
      "Need paint rollers, tape, and cleaning supplies picked up from a hardware store.",
    categorySlug: "errands",
    budget: 16,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2500,
    location: {
      latitude: 62.2442,
      longitude: 25.7469,
      addressLine1: "City Hardware Store",
      city: "Jyväskylä",
      state: "Central Finland",
      postalCode: "40100",
      country: "Finland",
      formattedAddress: "City Hardware Store, 40100 Jyväskylä, Finland",
    },
  },

  {
    requesterEmail: "noora.requester@example.com",
    title: "Need rabbit feeding help while away",
    description:
      "Need someone to feed my rabbit and refresh water for two days.",
    categorySlug: "pet-care",
    budget: 20,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2200,
    location: {
      latitude: 62.8932,
      longitude: 27.6778,
      addressLine1: "Kuopio Apartment",
      city: "Kuopio",
      state: "North Savo",
      postalCode: "70100",
      country: "Finland",
      formattedAddress: "Kuopio Apartment, 70100 Kuopio, Finland",
    },
  },
  {
    requesterEmail: "noora.requester@example.com",
    title: "Need help mounting curtains",
    description:
      "Need help installing curtain rods and hanging curtains in one bedroom.",
    categorySlug: "home-help",
    budget: 22,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1800,
    location: {
      latitude: 62.8929,
      longitude: 27.6794,
      addressLine1: "Kuopio Centre Flat",
      city: "Kuopio",
      state: "North Savo",
      postalCode: "70100",
      country: "Finland",
      formattedAddress: "Kuopio Centre Flat, 70100 Kuopio, Finland",
    },
  },
  {
    requesterEmail: "noora.requester@example.com",
    title: "Need medicine pickup from nearby pharmacy",
    description:
      "Need over-the-counter cold medicine and a few essentials picked up.",
    categorySlug: "health-support",
    budget: 14,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2000,
    location: {
      latitude: 62.8940,
      longitude: 27.6801,
      addressLine1: "Kuopio Pharmacy",
      city: "Kuopio",
      state: "North Savo",
      postalCode: "70100",
      country: "Finland",
      formattedAddress: "Kuopio Pharmacy, 70100 Kuopio, Finland",
    },
  },

  {
    requesterEmail: "otto.requester@example.com",
    title: "Need help moving a wardrobe",
    description:
      "Need one strong helper to move a wardrobe between apartments in the same building.",
    categorySlug: "moving",
    budget: 29,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2500,
    location: {
      latitude: 60.9822,
      longitude: 25.6622,
      addressLine1: "Lahti Apartment Block",
      city: "Lahti",
      state: "Päijät-Häme",
      postalCode: "15110",
      country: "Finland",
      formattedAddress: "Lahti Apartment Block, 15110 Lahti, Finland",
    },
  },
  {
    requesterEmail: "otto.requester@example.com",
    title: "Need groceries delivered from city center",
    description:
      "Need bread, fruit, and household items delivered this afternoon.",
    categorySlug: "errands",
    budget: 15,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2200,
    location: {
      latitude: 60.9830,
      longitude: 25.6611,
      addressLine1: "Lahti Market Square",
      city: "Lahti",
      state: "Päijät-Häme",
      postalCode: "15110",
      country: "Finland",
      formattedAddress: "Lahti Market Square, 15110 Lahti, Finland",
    },
  },
  {
    requesterEmail: "otto.requester@example.com",
    title: "Need help clearing small storage room",
    description:
      "Need help carrying old boxes and reorganizing a small basement storage area.",
    categorySlug: "home-help",
    budget: 20,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 1800,
    location: {
      latitude: 60.9818,
      longitude: 25.6604,
      addressLine1: "Residential Storage Room",
      city: "Lahti",
      state: "Päijät-Häme",
      postalCode: "15110",
      country: "Finland",
      formattedAddress: "Residential Storage Room, 15110 Lahti, Finland",
    },
  },

  {
    requesterEmail: "elin.requester@example.com",
    title: "Need snow shoveling help at entrance",
    description:
      "Need help clearing snow from the front entrance and walkway.",
    categorySlug: "outdoor-help",
    budget: 27,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2500,
    location: {
      latitude: 66.5046,
      longitude: 25.7289,
      addressLine1: "Rovaniemi House Entrance",
      city: "Rovaniemi",
      state: "Lapland",
      postalCode: "96200",
      country: "Finland",
      formattedAddress: "Rovaniemi House Entrance, 96200 Rovaniemi, Finland",
    },
  },
  {
    requesterEmail: "elin.requester@example.com",
    title: "Need help getting to station in snowy weather",
    description:
      "Looking for reliable local transport to the station during icy conditions.",
    categorySlug: "transportation",
    budget: 23,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 6000,
    location: {
      latitude: 66.4960,
      longitude: 25.7065,
      addressLine1: "Rovaniemi Railway Station",
      city: "Rovaniemi",
      state: "Lapland",
      postalCode: "96100",
      country: "Finland",
      formattedAddress: "Rovaniemi Railway Station, 96100 Rovaniemi, Finland",
    },
  },
  {
    requesterEmail: "elin.requester@example.com",
    title: "Need help bringing firewood indoors",
    description:
      "Need assistance carrying stacked firewood from outside storage to the shed.",
    categorySlug: "home-help",
    budget: 18,
    isPaid: true,
    status: RequestStatus.OPEN,
    serviceRadiusMeters: 2000,
    location: {
      latitude: 66.5035,
      longitude: 25.7305,
      addressLine1: "Residential Yard Shed",
      city: "Rovaniemi",
      state: "Lapland",
      postalCode: "96200",
      country: "Finland",
      formattedAddress: "Residential Yard Shed, 96200 Rovaniemi, Finland",
    },
  },
] as const;

const upsertCategories = async () => {
  for (const category of categorySeedData) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: null,
        icon: category.icon ?? null,
        color: category.color ?? null,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: null,
        icon: category.icon ?? null,
        color: category.color ?? null,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
    });
  }

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  return new Map(categories.map((category) => [category.slug, category]));
};

const upsertSkills = async (
  categoryMap: Map<string, { id: string; slug: string; name: string }>
) => {
  for (const skill of skillSeedData) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        isActive: true,
        categoryId: skill.categorySlug ? categoryMap.get(skill.categorySlug)?.id ?? null : null,
      },
      create: {
        name: skill.name,
        slug: skill.slug,
        isActive: true,
        categoryId: skill.categorySlug ? categoryMap.get(skill.categorySlug)?.id ?? null : null,
      },
    });
  }

  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return new Map(skills.map((skill) => [skill.slug, skill]));
};

const upsertUsersAndProfiles = async (passwordHash: string) => {
  const createdUsers: Record<string, { id: string; email: string }> = {};

  for (const userData of users) {
    const user = await prisma.userModel.upsert({
      where: { email: userData.email },
      update: {
        phone: userData.phone,
        isVerified: userData.isVerified,
        passwordHash,
      },
      create: {
        email: userData.email,
        phone: userData.phone,
        isVerified: userData.isVerified,
        passwordHash,
      },
    });

    createdUsers[userData.email] = {
      id: user.id,
      email: user.email,
    };

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { address: true },
    });

    let addressId = existingProfile?.addressId ?? null;

    if (existingProfile?.addressId) {
      await prisma.location.update({
        where: { id: existingProfile.addressId },
        data: {
          latitude: userData.profile.address.latitude,
          longitude: userData.profile.address.longitude,
          addressLine1: userData.profile.address.addressLine1,
          city: userData.profile.address.city,
          state: userData.profile.address.state,
          postalCode: userData.profile.address.postalCode,
          country: userData.profile.address.country,
          formattedAddress: userData.profile.address.formattedAddress,
        },
      });
    } else {
      const address = await prisma.location.create({
        data: {
          latitude: userData.profile.address.latitude,
          longitude: userData.profile.address.longitude,
          addressLine1: userData.profile.address.addressLine1,
          city: userData.profile.address.city,
          state: userData.profile.address.state,
          postalCode: userData.profile.address.postalCode,
          country: userData.profile.address.country,
          formattedAddress: userData.profile.address.formattedAddress,
        },
      });

      addressId = address.id;
    }

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        fullName: userData.profile.fullName,
        bio: userData.profile.bio,
        userType: userData.profile.userType,
        gender: userData.profile.gender,
        helpCount: userData.profile.helpCount,
        rating: userData.profile.rating,
        searchRadiusMeters: userData.profile.searchRadiusMeters,
        addressId,
      },
      create: {
        userId: user.id,
        fullName: userData.profile.fullName,
        bio: userData.profile.bio,
        userType: userData.profile.userType,
        gender: userData.profile.gender,
        helpCount: userData.profile.helpCount,
        rating: userData.profile.rating,
        searchRadiusMeters: userData.profile.searchRadiusMeters,
        addressId,
      },
    });
  }

  return createdUsers;
};

const upsertHelpRequests = async (
  createdUsers: Record<string, { id: string; email: string }>,
  categoryMap: Map<string, { id: string; slug: string; name: string }>
) => {
  const helpRequests = [];

  for (const requestData of requestSeedData) {
    const requester = createdUsers[requestData.requesterEmail];

    if (!requester) {
      throw new Error(`Requester not found for email: ${requestData.requesterEmail}`);
    }

    const category = categoryMap.get(requestData.categorySlug);

    if (!category) {
      throw new Error(`Category not found for slug: ${requestData.categorySlug}`);
    }

    const existingRequest = await prisma.helpRequest.findFirst({
      where: {
        requesterId: requester.id,
        title: requestData.title,
      },
      include: {
        location: true,
        category: true,
      },
    });

    if (existingRequest) {
      if (existingRequest.locationId && existingRequest.location) {
        await prisma.location.update({
          where: { id: existingRequest.locationId },
          data: {
            latitude: requestData.location.latitude,
            longitude: requestData.location.longitude,
            addressLine1: requestData.location.addressLine1,
            city: requestData.location.city,
            state: requestData.location.state,
            postalCode: requestData.location.postalCode,
            country: requestData.location.country,
            formattedAddress: requestData.location.formattedAddress,
          },
        });

        const updatedRequest = await prisma.helpRequest.update({
          where: { id: existingRequest.id },
          data: {
            description: requestData.description,
            category: {
              connect: { id: category.id },
            },
            budget: requestData.budget,
            isPaid: requestData.isPaid,
            status: requestData.status,
            serviceRadiusMeters: requestData.serviceRadiusMeters,
          },
          include: {
            location: true,
            category: true,
          },
        });

        helpRequests.push(updatedRequest);
      } else {
        const newLocation = await prisma.location.create({
          data: {
            latitude: requestData.location.latitude,
            longitude: requestData.location.longitude,
            addressLine1: requestData.location.addressLine1,
            city: requestData.location.city,
            state: requestData.location.state,
            postalCode: requestData.location.postalCode,
            country: requestData.location.country,
            formattedAddress: requestData.location.formattedAddress,
          },
        });

        const updatedRequest = await prisma.helpRequest.update({
          where: { id: existingRequest.id },
          data: {
            description: requestData.description,
            category: {
              connect: { id: category.id },
            },
            budget: requestData.budget,
            isPaid: requestData.isPaid,
            status: requestData.status,
            serviceRadiusMeters: requestData.serviceRadiusMeters,
            location: {
              connect: { id: newLocation.id },
            },
          },
          include: {
            location: true,
            category: true,
          },
        });

        helpRequests.push(updatedRequest);
      }
    } else {
      const createdRequest = await prisma.helpRequest.create({
        data: {
          requester: {
            connect: { id: requester.id },
          },
          title: requestData.title,
          description: requestData.description,
          category: {
            connect: { id: category.id },
          },
          budget: requestData.budget,
          isPaid: requestData.isPaid,
          status: requestData.status,
          serviceRadiusMeters: requestData.serviceRadiusMeters,
          location: {
            create: {
              latitude: requestData.location.latitude,
              longitude: requestData.location.longitude,
              addressLine1: requestData.location.addressLine1,
              city: requestData.location.city,
              state: requestData.location.state,
              postalCode: requestData.location.postalCode,
              country: requestData.location.country,
              formattedAddress: requestData.location.formattedAddress,
            },
          },
        },
        include: {
          location: true,
          category: true,
        },
      });

      helpRequests.push(createdRequest);
    }
  }

  return helpRequests;
};

const upsertUserQualifications = async (
  createdUsers: Record<string, { id: string; email: string }>,
  skillMap: Map<string, { id: string; slug: string }>
) => {
  for (const entry of userQualificationSeedData) {
    const user = createdUsers[entry.email];

    if (!user) {
      continue;
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      continue;
    }

    await prisma.userSkill.deleteMany({
      where: { userId: user.id },
    });

    await prisma.userCertification.deleteMany({
      where: { userId: user.id },
    });

    if (entry.skills.length > 0) {
      await prisma.userSkill.createMany({
        data: entry.skills
          .map((skill) => {
            const mappedSkill = skillMap.get(skill.skillSlug);
            if (!mappedSkill) {
              return null;
            }

            return {
              userId: user.id,
              profileId: profile.id,
              skillId: mappedSkill.id,
              experienceLevel: skill.experienceLevel,
              yearsExperience: skill.yearsExperience,
              isPrimary: skill.isPrimary,
            };
          })
          .filter(Boolean) as any[],
      });
    }

    for (const certification of entry.certifications) {
      await prisma.userCertification.create({
        data: {
          userId: user.id,
          profileId: profile.id,
          name: certification.name,
          issuer: certification.issuer,
          credentialId: certification.credentialId,
          proofUrl: certification.proofUrl,
          status: certification.status,
          reviewedAt: certification.status === CertificationStatus.APPROVED ? new Date() : null,
        },
      });
    }
  }
};

const seedBid = async (
  createdUsers: Record<string, { id: string; email: string }>,
  helpRequests: Array<{ id: string; title: string }>
) => {
  const helper = createdUsers["james.helper@example.com"];

  if (!helper) {
    throw new Error("Helper james.helper@example.com not found");
  }

  const primaryHelpRequest =
    helpRequests.find((request) => request.title === "Need help picking up groceries") ??
    helpRequests[0];

  if (!primaryHelpRequest) {
    throw new Error("No help requests available to seed a bid");
  }

  const existingBid = await prisma.bid.findFirst({
    where: {
      helperId: helper.id,
      helpRequestId: primaryHelpRequest.id,
    },
  });

  if (!existingBid) {
    await prisma.bid.create({
      data: {
        helperId: helper.id,
        helpRequestId: primaryHelpRequest.id,
        message: "I can help this afternoon around 4 PM.",
        amount: 18,
        status: BidStatus.PENDING,
      },
    });
  }
};

const seed = async () => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const categoryMap = await upsertCategories();
  const skillMap = await upsertSkills(categoryMap);
  const createdUsers = await upsertUsersAndProfiles(passwordHash);
  await upsertUserQualifications(createdUsers, skillMap);
  const helpRequests = await upsertHelpRequests(createdUsers, categoryMap);

  await seedBid(createdUsers, helpRequests);

  console.log("Seed complete:");
  console.log(`- Categories: ${categoryMap.size}`);
  console.log(`- Skills: ${skillMap.size}`);
  console.log(`- Users: ${Object.keys(createdUsers).length}`);
  console.log(`- Seeded Help Requests: ${helpRequests.length}`);
  console.log(`- Default Password: ${DEFAULT_PASSWORD}`);
};

seed()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
