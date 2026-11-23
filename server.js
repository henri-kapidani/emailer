import "dotenv/config";

process.on("unhandledRejection", (reason, promise) => {
	console.error(reason, "Unhandled Rejection at Promise", promise);
});
process.on("uncaughtException", (error) => {
	console.error(error, "Uncaught Exception thrown");
});

const SHUTDOWN_TIMEOUT_MS = 10000;
let shuttingDown = false;

async function gracefulShutdown(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`${signal} received`);

	const forceExit = setTimeout(() => {
		console.error("Graceful shutdown timed out, forcing exit");
		process.exit(1);
	}, SHUTDOWN_TIMEOUT_MS);
	forceExit.unref();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import { rateLimiter } from "./middlewares/rateLimiters.js";

import createHttpError from "http-errors";
// import { htmlToText } from "html-to-text";
// import Handlebars from "handlebars";
import Joi from "joi";

import { sendMail } from "./email.js";
import { app, httpServer } from "./httpServer.js";

app.set("query parser", "extended");
app.set("x-powered-by", false);
const port = process.env.PORT || 30100;

app.use(morgan("combined"));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// Origins come from CORS_ORIGINS (comma-separated). Absent -> open (dev default).
const corsOrigins = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean)
	: undefined;
app.use(cors(corsOrigins ? { origin: corsOrigins } : undefined));

if (process.env.NODE_ENV === "production" && !corsOrigins) {
	console.warn(
		JSON.stringify({
			timestamp: new Date().toISOString(),
			level: "warn",
			component: "cors",
			message:
				"CORS_ORIGINS is empty/unset in production: CORS is fail-open (Access-Control-Allow-Origin: *)",
		}),
	);
}

app.get("/emailer/healthcheck", (_request, response) =>
	response.status(204).send(),
);

app.post(
	"/emailer/v1/send",
	rateLimiter(5, 60),
	async function sendEmailForFront(request, response, next) {
		const origin = request.headers.origin;
		let schema, error, value;
		let objResponse;

		schema = Joi.array().items(
			Joi.object({
				name: Joi.string().required(),
				value: Joi.any().required(),
			}),
		);

		({ error, value } = schema.validate(request.body));
		if (error) return next(createHttpError.BadRequest(error));
		request.validatedBody = value;
		const bodyData = request.validatedBody;

		// const template = Handlebars.compile(`
		// 	<p>Richiesta di trial da parte di:</p>
		// 	<ul>
		// 		<li>userId: {{userId}}</li>
		// 		<li>email: {{email}}</li>
		// 		<li>first_name: {{first_name}}</li>
		// 		<li>last_name: {{last_name}}</li>
		// 		<li>company: {{company}}</li>
		// 		<li>position: {{position}}</li>
		// 		<li>phone_number: {{phone_number}}</li>
		// 	</ul>
		// `);

		// const templateData = {
		// 	userId: request.authUser.id,
		// 	email: request.authUser.email,
		// 	...bodyData,
		// };

		const text = bodyData
			.map((item) => `${item.name}: ${item.value}`)
			.join("\n\n");

		const toEmails = "info@houseofinnovation.tech";
		const subjectLine = "Request of info from the website";
		// const htmlContent = template(templateData);

		await sendMail({
			from: {
				name: origin,
				address: "info@houseofinnovation.tech",
			},
			to: toEmails,
			subject: subjectLine,
			text: text,
			// text: htmlToText(htmlContent),
			// html: htmlContent,
		});

		objResponse = { sent: true };
		response.status(200).send(objResponse);
	},
);

app.use((error, _request, response, next) => {
	if (!error.status || error.status >= 500) console.log(error);
	if (error.status === 404) return next();
	response.status(error.status || 500);
	return response.send({
		message: error.message,
	});
});

app.use((_request, response) => {
	return response.status(404).send();
});

//const serverExpress =
httpServer.listen(port, () => {
	console.log(`SERVER RUNNING ON PORT ${port}`);
});
