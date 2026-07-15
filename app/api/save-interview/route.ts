import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { feedback } = body;

    if (!feedback) {
      return new NextResponse('Missing feedback data', { status: 400 });
    }

    // Ensure user exists in our DB (upsert them based on clerk ID)
    // We don't have their email here directly unless we fetch from Clerk API,
    // so we'll just store the clerkUserId for now. 
    // If the schema requires email, we'd fetch it, but let's assume we can just upsert.
    // Actually, looking at schema.prisma, email is required and unique.
    // To simplify for this prototype since we don't have clerk backend API set up,
    // let's update schema.prisma to make email optional or just mock it, OR fetch it from Clerk.
    // For now, let's just create the InterviewResult directly using clerkUserId.
    // Wait, the schema has userId linking to User.id. Let's just create the InterviewResult directly if we change schema,
    // but Prisma expects `userId` to be a valid `User.id`. Let's upsert the user with a dummy email if needed.
    
    // Instead of upserting a user, since this is an MVP, let's just make the Prisma relation simpler.
    // I will write the Prisma saving logic here and update the schema to not strictly require email.
    
    // For now, let's use Prisma to upsert user
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: {
        clerkUserId: userId,
        email: `${userId}@clerk.placeholder.com` // Mock email since we don't have clerk client here
      }
    });

    const result = await prisma.interviewResult.create({
      data: {
        userId: user.id,
        companyMode: feedback.companyMode || 'General',
        overallScore: feedback.overallScore,
        overallGrade: feedback.overallGrade,
        fullFeedbackJson: feedback,
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving interview:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
