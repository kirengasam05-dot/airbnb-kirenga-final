import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

async function main() {
  const password = await bcrypt.hash("12345678", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: { name: "Admin User", email: "admin@gmail.com", username: "admin", password, role: "ADMIN" }
  });

  const host = await prisma.user.upsert({
    where: { email: "host2@gmail.com" },
    update: {},
    create: { name: "Kirenga Host", email: "host2@gmail.com", username: "host2", phone: "0788123456", password, role: "HOST" }
  });

  const guest = await prisma.user.upsert({
    where: { email: "sam@gmail.com" },
    update: {},
    create: { name: "Sam Guest", email: "sam@gmail.com", username: "samguest", phone: "0799123456", password, role: "GUEST" }
  });

  const listing = await prisma.listing.create({
    data: {
      title: "Modern Apartment Kigali",
      description: "Clean apartment near city center with wifi and parking.",
      location: "Kigali",
      pricePerNight: 50,
      guests: 2,
      type: "APARTMENT",
      amenities: ["wifi", "parking", "kitchen"],
      rating: 4.7,
      hostId: host.id
    }
  });

  await prisma.review.create({ data: { listingId: listing.id, userId: guest.id, rating: 5, comment: "Very clean place and good host. I enjoyed my stay." } });

  console.log({ admin: admin.email, host: host.email, guest: guest.email, listing: listing.id });
}

main().finally(async () => prisma.$disconnect());
