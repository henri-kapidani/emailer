import path from "node:path";
import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

export default transporter.sendMail.bind(transporter);

export async function sendMail(mailOptions) {
	if (process.env.SEND_EMAILS) {
		await transporter.sendMail(mailOptions);
	} else {
		const emailsDir = path.join(__dirname, "logs", "emails");
		mkdirSync(emailsDir, { recursive: true });
		const date = new Date().toISOString();
		writeFileSync(
			path.join(
				emailsDir,
				date
					.replaceAll("-", "")
					.replaceAll(":", "")
					.replaceAll(".", "M") +
					"_" +
					Math.floor(Math.random() * 100000) +
					".txt",
			),
			JSON.stringify(mailOptions, null, 4),
		);
	}
}
