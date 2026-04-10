import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";
import {
    BidStatus,
    Gender,
    RequestStatus,
    UserType,
} from "../generated/prisma/enums.js";

const DEFAULT_PASSWORD = "Password123!";

const seed = async () => {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const users = [
        {
            email: "maria.requester@example.com",
            phone: "+15550000001",
            isVerified: true,
            passwordHash,
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
            passwordHash,
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
            passwordHash,
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
            passwordHash,
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
    ];

    const createdUsers: Record<string, { id: string; email: string }> = {};

    for (const userData of users) {
        const user = await prisma.userModel.upsert({
            where: { email: userData.email },
            update: {
                phone: userData.phone,
                isVerified: userData.isVerified,
                passwordHash: userData.passwordHash,
            },
            create: {
                email: userData.email,
                phone: userData.phone,
                isVerified: userData.isVerified,
                passwordHash: userData.passwordHash,
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

    const requestSeedData = [
        {
            requesterEmail: "maria.requester@example.com",
            title: "Need help picking up groceries",
            description:
                "Looking for someone to help pick up essentials from a nearby store this afternoon.",
            category: "Errands",
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
            description:
                "Need transport to and from a clinic appointment on Friday morning.",
            category: "Transportation",
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
            description:
                "Need someone patient to help sort weekly medications and labels.",
            category: "Health Support",
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
            category: "Home Help",
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
            description:
                "Bought a flat-pack shelf and need help assembling it safely.",
            category: "Home Help",
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
            description:
                "Need help walking my small dog in the evenings this week.",
            category: "Pet Care",
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
            category: "Transportation",
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
            category: "Errands",
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
            description:
                "Need one person to help move packed boxes to a storage unit.",
            category: "Moving",
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
            category: "Outdoor Help",
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
            category: "Moving",
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
    ];

    const helpRequests = [];

    for (const requestData of requestSeedData) {
        const requester = createdUsers[requestData.requesterEmail];

        if (!requester) {
            throw new Error(
                `Requester not found for email: ${requestData.requesterEmail}`
            );
        }

        const existingRequest = await prisma.helpRequest.findFirst({
            where: {
                requesterId: requester.id,
                title: requestData.title,
            },
            include: {
                location: true,
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
                        category: requestData.category,
                        budget: requestData.budget,
                        isPaid: requestData.isPaid,
                        status: requestData.status,
                        serviceRadiusMeters: requestData.serviceRadiusMeters,
                    },
                    include: {
                        location: true,
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
                        category: requestData.category,
                        budget: requestData.budget,
                        isPaid: requestData.isPaid,
                        status: requestData.status,
                        serviceRadiusMeters: requestData.serviceRadiusMeters,
                        locationId: newLocation.id,
                    },
                    include: {
                        location: true,
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
                    category: requestData.category,
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
                },
            });

            helpRequests.push(createdRequest);
        }
    }

    const helper = createdUsers["james.helper@example.com"];

    const primaryHelpRequest =
        helpRequests.find(
            (request) => request.title === "Need help picking up groceries"
        ) ?? helpRequests[0];

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

    console.log("Seed complete:");
    console.log(`- Requester: maria.requester@example.com`);
    console.log(`- Requester: olivia.requester@example.com`);
    console.log(`- Requester: david.requester@example.com`);
    console.log(`- Helper: james.helper@example.com`);
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