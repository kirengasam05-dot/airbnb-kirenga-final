import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 3000;

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://airbnb-kirenga-final.onrender.com"
    : `http://localhost:${PORT}`;

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb Kirenga API",
      version: "1.0.0",
      description: "API documentation for Airbnb backend with Prisma, JWT authentication, listings, bookings, reviews, and users.",
    },

    servers: [
      {
        url: BASE_URL,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Local development server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token like: Bearer your_token_here",
        },
      },

      schemas: {
        RegisterInput: {
          type: "object",
          required: ["name", "email", "username", "password"],
          properties: {
            name: {
              type: "string",
              example: "Kirenga Sam",
            },
            email: {
              type: "string",
              example: "sam@example.com",
            },
            username: {
              type: "string",
              example: "kirengasam",
            },
            phone: {
              type: "string",
              example: "+250788000000",
            },
            password: {
              type: "string",
              example: "password123",
            },
            role: {
              type: "string",
              enum: ["GUEST", "HOST", "ADMIN"],
              example: "GUEST",
            },
          },
        },

        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "sam@example.com",
            },
            password: {
              type: "string",
              example: "password123",
            },
          },
        },

        ListingInput: {
          type: "object",
          required: ["title", "description", "location", "price", "guests", "type"],
          properties: {
            title: {
              type: "string",
              example: "Modern Apartment Kigali",
            },
            description: {
              type: "string",
              example: "Clean and beautiful apartment in Kigali",
            },
            location: {
              type: "string",
              example: "Kigali",
            },
            price: {
              type: "number",
              example: 50,
            },
            guests: {
              type: "number",
              example: 2,
            },
            type: {
              type: "string",
              enum: ["APARTMENT", "HOUSE", "VILLA", "CABIN"],
              example: "APARTMENT",
            },
            amenities: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["wifi", "parking"],
            },
          },
        },

        BookingInput: {
          type: "object",
          required: ["listingId", "startDate", "endDate"],
          properties: {
            listingId: {
              type: "number",
              example: 1,
            },
            startDate: {
              type: "string",
              format: "date",
              example: "2026-06-01",
            },
            endDate: {
              type: "string",
              format: "date",
              example: "2026-06-05",
            },
          },
        },

        ReviewInput: {
          type: "object",
          required: ["listingId", "rating", "comment"],
          properties: {
            listingId: {
              type: "number",
              example: 1,
            },
            rating: {
              type: "number",
              example: 5,
            },
            comment: {
              type: "string",
              example: "Very nice place",
            },
          },
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [
    "./src/routes/*.ts",
    "./src/routes/**/*.ts",
    "./src/controllers/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);