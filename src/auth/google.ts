// google.ts
import { db } from "@/db";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { v4 as uuidv4 } from "uuid";

const options = {
  clientID: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackURL: `${process.env.BE_BASE_URL}/api/v1/customers/google/callback`,
};

async function verify(
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: VerifyCallback,
) {
  try {
    let user = await db.customer.findFirst({
      where: {
        accounts: {
          some: {
            providerAccountId: profile.id,
            provider: "GOOGLE",
          },
        },
      },
    });

    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(new Error("Email not found"));
    }

    if (!user) {
      user = await db.customer.findFirst({
        where: { email },
        include: { accounts: true },
      });

      if (user) {
        // link Google account
        await db.account.create({
          data: {
            userId: user.id,
            provider: "GOOGLE",
            providerAccountId: profile.id,
            accessToken,
            refreshToken,
          },
        });
      }

      user = await db.customer.create({
        data: {
          email,
          firstName: profile.name?.givenName || "",
          lastName: profile.name?.familyName || "",
          isVerified: true,
          accounts: {
            create: {
              providerAccountId: profile.id,
              provider: "GOOGLE",
              accessToken,
              refreshToken,
            },
          },
        },
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}

export default new GoogleStrategy(options, verify);
