module.exports = {
    apps: [{
      name: 'mi-aplicacion',
      script: 'server.js', // Aquí especificas el nombre de tu archivo principal
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }]
  };
  