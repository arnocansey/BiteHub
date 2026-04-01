import "dotenv/config";
import { prisma } from "../src/config/prisma";
import { UserRole } from "../src/generated/prisma/client";

function readArg(flag: string) {
  const index = process.argv.findIndex((value) => value === flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function requiredValue(flag: string, envKey: string) {
  const value = readArg(flag) ?? process.env[envKey];
  if (!value?.trim()) {
    throw new Error(`Missing ${flag}. Pass it as ${flag} <value> or set ${envKey}.`);
  }

  return value.trim();
}

async function main() {
  const existingAdminCount = await prisma.user.count({
    where: { role: UserRole.ADMIN }
  });

  if (existingAdminCount > 0) {
    throw new Error("An admin account already exists. This bootstrap script only creates the first admin.");
  }

  const email = requiredValue("--email", "ADMIN_EMAIL").toLowerCase();
  const title = (readArg("--title") ?? process.env.ADMIN_TITLE ?? "Platform Administrator").trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      customerProfile: true,
      adminProfile: true
    }
  });

  if (!existingUser) {
    throw new Error("No user with that email exists. Create a customer account first, then run this upgrade.");
  }

  if (existingUser.role !== UserRole.CUSTOMER || !existingUser.customerProfile) {
    throw new Error("Only an existing customer account can be upgraded to admin.");
  }

  const admin = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      role: UserRole.ADMIN,
      adminProfile: existingUser.adminProfile
        ? { update: { title } }
        : {
            create: {
              title
            }
          }
    },
    include: {
      adminProfile: true
    }
  });

  console.log("Customer upgraded to first admin successfully.");
  console.log(`Email: ${admin.email}`);
  console.log(`Name: ${admin.firstName} ${admin.lastName}`);
  console.log(`Title: ${admin.adminProfile?.title ?? title}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to bootstrap admin.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
