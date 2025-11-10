module.exports = {
  apps: [
    {
      name: "yop-backend",
      script: "./server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      error_file: "~/.pm2/logs/yop-backend-error.log",
      out_file: "~/.pm2/logs/yop-backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
