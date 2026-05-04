CREATE TYPE "Role" AS ENUM ('ADMIN', 'HOST', 'GUEST');
CREATE TYPE "ListingType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'CABIN');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

CREATE TABLE "User" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "phone" TEXT,
  "password" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'GUEST',
  "avatar" TEXT,
  "avatarPublicId" TEXT,
  "resetToken" TEXT,
  "resetTokenExpiry" TIMESTAMP(3),
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Listing" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "pricePerNight" DOUBLE PRECISION NOT NULL,
  "guests" INTEGER NOT NULL DEFAULT 1,
  "type" "ListingType" NOT NULL DEFAULT 'APARTMENT',
  "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "rating" DOUBLE PRECISION,
  "hostId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingPhoto" (
  "id" SERIAL NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "listingId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" SERIAL NOT NULL,
  "listingId" INTEGER NOT NULL,
  "guestId" INTEGER NOT NULL,
  "checkIn" TIMESTAMP(3) NOT NULL,
  "checkOut" TIMESTAMP(3) NOT NULL,
  "guests" INTEGER NOT NULL DEFAULT 1,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
  "id" SERIAL NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "listingId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_name_idx" ON "User"("name");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Listing_hostId_idx" ON "Listing"("hostId");
CREATE INDEX "Listing_location_idx" ON "Listing"("location");
CREATE INDEX "Listing_type_idx" ON "Listing"("type");
CREATE INDEX "Listing_pricePerNight_idx" ON "Listing"("pricePerNight");
CREATE INDEX "Listing_guests_idx" ON "Listing"("guests");
CREATE INDEX "Listing_type_location_idx" ON "Listing"("type", "location");
CREATE INDEX "ListingPhoto_listingId_idx" ON "ListingPhoto"("listingId");
CREATE INDEX "Booking_listingId_idx" ON "Booking"("listingId");
CREATE INDEX "Booking_guestId_idx" ON "Booking"("guestId");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_checkIn_idx" ON "Booking"("checkIn");
CREATE INDEX "Booking_checkOut_idx" ON "Booking"("checkOut");
CREATE INDEX "Booking_listingId_checkIn_checkOut_idx" ON "Booking"("listingId", "checkIn", "checkOut");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_listingId_idx" ON "Review"("listingId");
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
