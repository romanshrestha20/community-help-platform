import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";
import { BidStatus, Gender, RequestStatus, UserType } from "../generated/prisma/enums.js";

const seed = async () => {
    const requesterEmail = "maria.requester@example.com";
    const helperEmail = "james.helper@example.com";
    const secondRequesterEmail = "olivia.requester@example.com";
    const thirdRequesterEmail = "david.requester@example.com";

    const requesterPasswordHash = await bcrypt.hash("Password123!", 10);
    const helperPasswordHash = await bcrypt.hash("Password123!", 10);

    const requester = await prisma.userModel.upsert({
        where: { email: requesterEmail },
        update: {
            phone: "+15550000001",
            isVerified: true,
            passwordHash: requesterPasswordHash,
        },
        create: {
            email: requesterEmail,
            phone: "+15550000001",
            isVerified: true,
            passwordHash: requesterPasswordHash,
        },
    });

    const helper = await prisma.userModel.upsert({
        where: { email: helperEmail },
        update: {
            phone: "+15550000002",
            isVerified: true,
            passwordHash: helperPasswordHash,
        },
        create: {
            email: helperEmail,
            phone: "+15550000002",
            isVerified: true,
            passwordHash: helperPasswordHash,
        },
    });

    const secondRequester = await prisma.userModel.upsert({
        where: { email: secondRequesterEmail },
        update: {
            phone: "+15550000003",
            isVerified: true,
            passwordHash: requesterPasswordHash,
        },
        create: {
            email: secondRequesterEmail,
            phone: "+15550000003",
            isVerified: true,
            passwordHash: requesterPasswordHash,
        },
    });

    const thirdRequester = await prisma.userModel.upsert({
        where: { email: thirdRequesterEmail },
        update: {
            phone: "+15550000004",
            isVerified: true,
            passwordHash: requesterPasswordHash,
        },
        create: {
            email: thirdRequesterEmail,
            phone: "+15550000004",
            isVerified: true,
            passwordHash: requesterPasswordHash,
        },
    });

    await prisma.profile.upsert({
        where: { userId: requester.id },
        update: {
            fullName: "Maria Santos",
            bio: "Needs occasional neighborhood support.",
            userType: UserType.ELDERLY,
            gender: Gender.FEMALE,
            helpCount: 2,
        },
        create: {
            userId: requester.id,
            fullName: "Maria Santos",
            bio: "Needs occasional neighborhood support.",
            userType: UserType.ELDERLY,
            gender: Gender.FEMALE,
            helpCount: 2,
        },
    });

    await prisma.profile.upsert({
        where: { userId: helper.id },
        update: {
            fullName: "James Lee",
            bio: "Happy to help with groceries and errands.",
            userType: UserType.GENERAL,
            gender: Gender.MALE,
            helpCount: 14,
            rating: 4.8,
        },
        create: {
            userId: helper.id,
            fullName: "James Lee",
            bio: "Happy to help with groceries and errands.",
            userType: UserType.GENERAL,
            gender: Gender.MALE,
            helpCount: 14,
            rating: 4.8,
        },
    });

    await prisma.profile.upsert({
        where: { userId: secondRequester.id },
        update: {
            fullName: "Olivia Carter",
            bio: "Looking for occasional help with transportation and chores.",
            userType: UserType.GENERAL,
            gender: Gender.FEMALE,
            helpCount: 3,
        },
        create: {
            userId: secondRequester.id,
            fullName: "Olivia Carter",
            bio: "Looking for occasional help with transportation and chores.",
            userType: UserType.GENERAL,
            gender: Gender.FEMALE,
            helpCount: 3,
        },
    });

    await prisma.profile.upsert({
        where: { userId: thirdRequester.id },
        update: {
            fullName: "David Kim",
            bio: "Needs support with moving and home maintenance tasks.",
            userType: UserType.GENERAL,
            gender: Gender.MALE,
            helpCount: 1,
        },
        create: {
            userId: thirdRequester.id,
            fullName: "David Kim",
            bio: "Needs support with moving and home maintenance tasks.",
            userType: UserType.GENERAL,
            gender: Gender.MALE,
            helpCount: 1,
        },
    });

    const requestSeedData = [
        {
            requesterId: requester.id,
            title: "Need help picking up groceries",
            description: "Looking for someone to help pick up essentials from a nearby store.",
            category: "Errands",
            budget: 20,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: requester.id,
            title: "Need a ride to clinic appointment",
            description: "Need transport to and from a clinic appointment on Friday morning.",
            category: "Transportation",
            budget: 25,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: requester.id,
            title: "Help with organizing medicine box",
            description: "Need someone patient to help sort weekly medications and labels.",
            category: "Health Support",
            budget: 15,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: requester.id,
            title: "Need help watering balcony plants",
            description: "Looking for someone to water and check my balcony plants while I recover at home.",
            category: "Home Help",
            budget: 10,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: secondRequester.id,
            title: "Need assistance assembling a bookshelf",
            description: "Bought a flat-pack shelf and need help assembling it safely.",
            category: "Home Help",
            budget: 30,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: secondRequester.id,
            title: "Looking for dog walking support",
            description: "Need help walking my small dog in the evenings this week.",
            category: "Pet Care",
            budget: 12,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: secondRequester.id,
            title: "Need help with airport drop-off",
            description: "Looking for a reliable ride to the airport early Saturday morning with two suitcases.",
            category: "Transportation",
            budget: 35,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: secondRequester.id,
            title: "Need grocery delivery from local market",
            description: "Need a few grocery items picked up from the neighborhood market before dinner.",
            category: "Errands",
            budget: 18,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: thirdRequester.id,
            title: "Need help moving boxes this weekend",
            description: "Need one person to help move packed boxes to a storage unit.",
            category: "Moving",
            budget: 40,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: thirdRequester.id,
            title: "Need basic yard cleanup",
            description: "Need help raking leaves and bagging small branches in the front yard.",
            category: "Outdoor Help",
            budget: 28,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
        {
            requesterId: thirdRequester.id,
            title: "Looking for furniture lifting help",
            description: "Need an extra pair of hands to move a sofa and dining table within the apartment.",
            category: "Moving",
            budget: 22,
            isPaid: true,
            status: RequestStatus.OPEN,
        },
    ];

    const helpRequests = [];

    for (const requestData of requestSeedData) {
        const existingRequest = await prisma.helpRequest.findFirst({
            where: {
                requesterId: requestData.requesterId,
                title: requestData.title,
            },
        });

        const request =
            existingRequest ??
            (await prisma.helpRequest.create({
                data: requestData,
            }));

        helpRequests.push(request);
    }

    const primaryHelpRequest =
        helpRequests.find((request) => request.title === "Need help picking up groceries") ?? helpRequests[0];

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
    console.log(`- Requester: ${requester.email}`);
    console.log(`- Requester: ${secondRequester.email}`);
    console.log(`- Requester: ${thirdRequester.email}`);
    console.log(`- Helper: ${helper.email}`);
    console.log(`- Seeded Help Requests: ${helpRequests.length}`);
}

seed()
    .catch((error) => {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
