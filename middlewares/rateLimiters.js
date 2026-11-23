import rateLimit from "express-rate-limit";

export function rateLimiter(attempts, minutes) {
	return rateLimit({
		windowMs: minutes * 60 * 1000,
		max: attempts,
		message: {
			message: "Too many requests",
		},
		standardHeaders: true,
		legacyHeaders: false,
	});
}
