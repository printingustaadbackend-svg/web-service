module.exports = {
  apps: [
    {
      name: 'printing-ustad-api',
      script: 'server.cjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // Load env from .env.server on the EC2 instance
      env_file: '.env.server',
      error_file: './logs/err.log',
      out_file:   './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      // Graceful restart: wait for current requests to finish
      kill_timeout: 5000,
    }
  ]
};
