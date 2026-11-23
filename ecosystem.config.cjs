module.exports = {
	apps: [
		{
			name: `emailer-api`,
			appendEnvToName: true,
			script: "./server.js",

			time: true,
			error_file: "./logs/error.log",
			out_file: "./logs/out.log",
			merge_logs: true,

			env_prod: {
				NODE_ENV: "production",
			},

			env_dev: {
				NODE_ENV: "development",
			},
		},
	],
};
