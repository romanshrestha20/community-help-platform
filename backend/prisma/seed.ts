import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";
import { BidStatus, Gender, RequestStatus, UserType } from "../generated/prisma/enums.js";

const seed = async () => {
    const requesterEmail = "maria.requester@example.com";
    const helperEmail = "james.helper@example.com";

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

    const existingRequest = await prisma.helpRequest.findFirst({
        where: {
            requesterId: requester.id,
            title: "Need help picking up groceries",
        },
    });

    const helpRequest =
        existingRequest ??
        (await prisma.helpRequest.create({
            data: {
                requesterId: requester.id,
                title: "Need help picking up groceries",
                description: "Looking for someone to help pick up essentials from a nearby store.",
                category: "Errands",
                budget: 20,
                isPaid: true,
                status: RequestStatus.OPEN,
            },
        }));

    const existingBid = await prisma.bid.findFirst({
        where: {
            helperId: helper.id,
            helpRequestId: helpRequest.id,
        },
    });

    if (!existingBid) {
        await prisma.bid.create({
            data: {
                helperId: helper.id,
                helpRequestId: helpRequest.id,
                message: "I can help this afternoon around 4 PM.",
                amount: 18,
                status: BidStatus.PENDING,
            },
        });
    }

    console.log("Seed complete:");
    console.log(`- Requester: ${requester.email}`);
    console.log(`- Helper: ${helper.email}`);
    console.log(`- Help Request: ${helpRequest.title}`);
}

seed()
    .catch((error) => {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });