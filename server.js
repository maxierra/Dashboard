const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configura body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar Express para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'test_unicef' && password === 'test_unicef') {
    res.redirect('/dashboard');
  } else {
    res.redirect('/');
  }
});

app.get('/main', (req, res) => {
  res.render('main', { navbar: 'navbar', content: 'dashboard' });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  setInterval(() => {
    const transaction = generateRandomTransaction();
    socket.emit('new_transaction', transaction);
  }, 6000);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});
// Función para generar un ID aleatorio
const generateRandomId = () => {
  return Math.floor(Math.random() * 1000000); // Genera un ID aleatorio entre 0 y 999999
};

// Función para generar transacciones aleatorias
const generateRandomTransaction = () => {
  const statuses = ['paymentinvoice_succeeded', 'payment_invoice_failed'];
  const isSuccess = Math.random() < 0.58;
  const status = isSuccess ? statuses[0] : statuses[1];
  const currentTime = new Date();
  const amPM = currentTime.getHours() >= 12 ? 'PM' : 'AM'; // Determinar si es AM o PM
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const timestamp = `${formattedTime} ${amPM}`; // Agregar AM o PM al final de la hora
  const message = isSuccess ? 'Donation processed successfully' : 'Donation failed';
  return {
    id: generateRandomId(),
    status,
    timestamp,
    message
  };
};


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
