import { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendEmail } from "../config/email.js";
import {
  bookingConfirmationEmail,
  bookingCancellationEmail,
} from "../templates/emails.js";
import { pageData, meta } from "../utils/pagination.js";

const bookingInclude = {
  guest: {
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
    },
  },

  listing: {
    include: {
      photos: true,

      host: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* =========================================================
   GET ALL BOOKINGS
========================================================= */

export const getAllBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { page, limit, skip } = pageData(req);

    let whereClause = {};

    // ADMIN → all bookings
    if (req.role === "ADMIN") {
      whereClause = {};
    }

    // HOST → bookings on his listings
    else if (req.role === "HOST") {
      whereClause = {
        listing: {
          hostId: req.userId,
        },
      };
    }

    // GUEST → own bookings
    else if (req.role === "GUEST") {
      whereClause = {
        guestId: req.userId,
      };
    }

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: bookingInclude,

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.booking.count({
        where: whereClause,
      }),
    ]);

    return res.status(200).json({
      data,

      meta: meta(total, page, limit),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

/* =========================================================
   GET BOOKING BY ID
========================================================= */

export const getBookingById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },

      include: bookingInclude,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const isAdmin = req.role === "ADMIN";

    const isGuestOwner =
      booking.guestId === req.userId;

    const isListingHost =
      booking.listing.hostId === req.userId;

    if (
      !isAdmin &&
      !isGuestOwner &&
      !isListingHost
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    return res.status(200).json(booking);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

/* =========================================================
   GET MY BOOKINGS
========================================================= */

export const getMyBookings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { page, limit, skip } = pageData(req);

    let whereClause = {};

    // HOST → bookings on his listings
    if (req.role === "HOST") {
      whereClause = {
        listing: {
          hostId: req.userId,
        },
      };
    }

    // GUEST → own bookings
    else {
      whereClause = {
        guestId: req.userId,
      };
    }

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: bookingInclude,

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.booking.count({
        where: whereClause,
      }),
    ]);

    return res.status(200).json({
      data,

      meta: meta(total, page, limit),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch my bookings",
      error: error.message,
    });
  }
};

/* =========================================================
   GET BOOKINGS BY USER ID
========================================================= */

export const getBookingsByUserId = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = Number(req.params.id);

    const { page, limit, skip } = pageData(req);

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          guestId: userId,
        },

        skip,
        take: limit,

        include: bookingInclude,

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.booking.count({
        where: {
          guestId: userId,
        },
      }),
    ]);

    return res.status(200).json({
      userId,
      data,

      meta: meta(total, page, limit),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch user bookings",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE BOOKING
========================================================= */

export const createBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      req.role !== "GUEST" &&
      req.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Only guests can create bookings",
      });
    }

    const {
      listingId,
      checkIn,
      checkOut,
      guests = 1,
    } = req.body;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({
        message:
          "listingId, checkIn and checkOut are required",
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid date format",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        message:
          "checkOut must be after checkIn",
      });
    }

    const booking = await prisma.$transaction(
      async (tx) => {
        const listing =
          await tx.listing.findUnique({
            where: {
              id: Number(listingId),
            },
          });

        if (!listing) {
          throw new Error("LISTING_NOT_FOUND");
        }

        // prevent booking own listing
        if (listing.hostId === req.userId) {
          throw new Error("OWN_LISTING");
        }

        // guest capacity validation
        if (
          Number(guests) > listing.guests
        ) {
          throw new Error("TOO_MANY_GUESTS");
        }

        // overlapping booking validation
        const conflict =
          await tx.booking.findFirst({
            where: {
              listingId:
                Number(listingId),

              status: {
                not: "CANCELLED",
              },

              checkIn: {
                lt: end,
              },

              checkOut: {
                gt: start,
              },
            },
          });

        if (conflict) {
          throw new Error(
            "BOOKING_CONFLICT"
          );
        }

        const nights = Math.ceil(
          (end.getTime() -
            start.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        return tx.booking.create({
          data: {
            listingId:
              Number(listingId),

            guestId: req.userId,

            checkIn: start,
            checkOut: end,

            guests:
              Number(guests),

            totalPrice:
              nights *
              listing.pricePerNight,

            status: "PENDING",
          },

          include: {
            guest: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },

            listing: true,
          },
        });
      }
    );

    await sendEmail(
      booking.guest.email,

      "Booking Request Received",

      bookingConfirmationEmail(
        booking.guest.name,
        booking.listing.title,
        booking.listing.location,
        formatDate(booking.checkIn),
        formatDate(booking.checkOut),
        booking.totalPrice
      )
    );

    return res.status(201).json({
      message:
        "Booking created and waiting for host confirmation",

      booking,
    });
  } catch (error: any) {
    if (
      error.message ===
      "LISTING_NOT_FOUND"
    ) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    if (
      error.message === "OWN_LISTING"
    ) {
      return res.status(400).json({
        message:
          "You cannot book your own listing",
      });
    }

    if (
      error.message ===
      "TOO_MANY_GUESTS"
    ) {
      return res.status(400).json({
        message:
          "Guests exceed listing capacity",
      });
    }

    if (
      error.message ===
      "BOOKING_CONFLICT"
    ) {
      return res.status(409).json({
        message:
          "Booking conflict: dates already booked",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create booking",

      error: error.message,
    });
  }
};

/* =========================================================
   CANCEL BOOKING
========================================================= */

export const cancelBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const booking =
      await prisma.booking.findUnique({
        where: {
          id,
        },

        include: {
          guest: true,
          listing: true,
        },
      });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const isAdmin =
      req.role === "ADMIN";

    const isGuestOwner =
      booking.guestId === req.userId;

    const isListingHost =
      booking.listing.hostId ===
      req.userId;

    if (
      !isAdmin &&
      !isGuestOwner &&
      !isListingHost
    ) {
      return res.status(403).json({
        message:
          "You are not allowed to cancel this booking",
      });
    }

    if (
      booking.status === "CANCELLED"
    ) {
      return res.status(400).json({
        message:
          "Booking is already cancelled",
      });
    }

    const updated =
      await prisma.booking.update({
        where: {
          id,
        },

        data: {
          status: "CANCELLED",
        },

        include: {
          guest: true,
          listing: true,
        },
      });

    await sendEmail(
      updated.guest.email,

      "Booking Cancelled",

      bookingCancellationEmail(
        updated.guest.name,
        updated.listing.title,
        formatDate(updated.checkIn),
        formatDate(updated.checkOut)
      )
    );

    return res.status(200).json({
      message: "Booking cancelled",

      booking: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      message:
        "Failed to cancel booking",

      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE BOOKING STATUS
========================================================= */

export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const { status } = req.body;

    if (
      ![
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
      ].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid booking status",
      });
    }

    const booking =
      await prisma.booking.findUnique({
        where: {
          id,
        },

        include: {
          listing: true,
        },
      });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const isAdmin =
      req.role === "ADMIN";

    const isListingHost =
      booking.listing.hostId ===
      req.userId;

    if (
      !isAdmin &&
      !isListingHost
    ) {
      return res.status(403).json({
        message:
          "You can update only bookings on your listings",
      });
    }

    const updatedBooking =
      await prisma.booking.update({
        where: {
          id,
        },

        data: {
          status,
        },

        include: bookingInclude,
      });

    return res.status(200).json({
      message:
        "Booking status updated",

      booking: updatedBooking,
    });
  } catch (error: any) {
    return res.status(500).json({
      message:
        "Failed to update booking status",

      error: error.message,
    });
  }
};