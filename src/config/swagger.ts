import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const PRODUCTION_URL = "https://airbnb-kirenga-final.onrender.com";
const LOCAL_URL = "http://localhost:3000";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Airbnb Kirenga API",
      version: "1.0.0",
      description:
        "Airbnb backend API with authentication, users, listings, bookings, reviews, and AI features.",
    },

    servers: [
      {
        url: PRODUCTION_URL,
        description: "Production server",
      },
      {
        url: LOCAL_URL,
        description: "Local development server",
      },
    ],

    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User endpoints" },
      { name: "Listings", description: "Listing endpoints" },
      { name: "Bookings", description: "Booking endpoints" },
      { name: "Reviews", description: "Review endpoints" },
      { name: "AI", description: "AI endpoints" },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste token like: Bearer your_token_here",
        },
      },

      schemas: {
        RegisterInput: {
          type: "object",
          required: ["name", "email", "username", "password"],
          properties: {
            name: { type: "string", example: "Sam Host" },
            email: { type: "string", example: "samhost2@example.com" },
            username: { type: "string", example: "samhost2" },
            phone: { type: "string", example: "0781234567" },
            password: { type: "string", example: "Password123" },
            role: {
              type: "string",
              enum: ["GUEST", "HOST", "ADMIN"],
              example: "HOST",
            },
          },
        },

        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "samhost@example.com" },
            password: { type: "string", example: "Password123" },
          },
        },

        ListingInput: {
          type: "object",
          required: [
            "title",
            "description",
            "location",
            "price",
            "guests",
            "type",
          ],
          properties: {
            title: { type: "string", example: "Modern Apartment Kigali" },
            description: {
              type: "string",
              example: "Clean and beautiful apartment near Kigali city center",
            },
            location: { type: "string", example: "Kigali" },
            price: { type: "number", example: 50 },
            guests: { type: "integer", example: 2 },
            type: {
              type: "string",
              enum: ["APARTMENT", "HOUSE", "VILLA", "CABIN"],
              example: "APARTMENT",
            },
            amenities: {
              type: "array",
              items: { type: "string" },
              example: ["wifi", "parking", "kitchen"],
            },
          },
        },

        BookingInput: {
          type: "object",
          required: ["listingId", "checkIn", "checkOut", "guests"],
          properties: {
            listingId: { type: "string", example: "paste-listing-id-here" },
            checkIn: { type: "string", example: "2026-05-10" },
            checkOut: { type: "string", example: "2026-05-15" },
            guests: { type: "integer", example: 2 },
          },
        },

        ReviewInput: {
          type: "object",
          required: ["rating", "comment"],
          properties: {
            rating: { type: "integer", example: 5 },
            comment: { type: "string", example: "Very nice place!" },
          },
        },

        AIListingDescriptionInput: {
          type: "object",
          required: ["title", "location", "type", "amenities"],
          properties: {
            title: { type: "string", example: "Modern Apartment Kigali" },
            location: { type: "string", example: "Kigali" },
            type: { type: "string", example: "APARTMENT" },
            amenities: {
              type: "array",
              items: { type: "string" },
              example: ["wifi", "parking", "kitchen", "security"],
            },
            tone: { type: "string", example: "professional" },
          },
        },

        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Something went wrong" },
            error: { type: "string", example: "Error details" },
          },
        },
      },
    },
  },

  apis: ["src/routes/**/*.ts", "dist/routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Express): void {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
        displayRequestDuration: true,
      },
    })
  );
}