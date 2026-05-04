export const passwordResetEmail = (name: string, resetUrl: string) => `
  <h2>Password Reset</h2>
  <p>Hello ${name},</p>
  <p>Click the link below to reset your password:</p>
  <a href="${resetUrl}">${resetUrl}</a>
`;

export const bookingConfirmationEmail = (name: string, listing: string, location: string, checkIn: string, checkOut: string, total: number) => `
  <h2>Booking Confirmed</h2>
  <p>Hello ${name}, your booking for <strong>${listing}</strong> in ${location} is confirmed.</p>
  <p>Check-in: ${checkIn}</p>
  <p>Check-out: ${checkOut}</p>
  <p>Total: $${total}</p>
`;

export const bookingCancellationEmail = (name: string, listing: string, checkIn: string, checkOut: string) => `
  <h2>Booking Cancelled</h2>
  <p>Hello ${name}, your booking for <strong>${listing}</strong> has been cancelled.</p>
  <p>${checkIn} to ${checkOut}</p>
`;
