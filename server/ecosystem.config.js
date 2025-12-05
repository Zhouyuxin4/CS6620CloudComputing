module.exports = {
  apps: [
    {
      name: "yop-api",
      script: "./server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "~/.pm2/logs/yop-api-error.log",
      out_file: "~/.pm2/logs/yop-api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "yop-socket",
      script: "./socketServer.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        SOCKET_PORT: 3001,
      },
      error_file: "~/.pm2/logs/yop-socket-error.log",
      out_file: "~/.pm2/logs/yop-socket-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
