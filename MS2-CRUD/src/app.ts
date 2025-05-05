import express, {Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import profileRoutes from './routes/profile.routes';
import cors from 'cors';
import xss from 'xss-clean';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { config } from './config'

//env
const {PORT, MONGO_URI, CORS_ORIGIN, NODE_ENV} = config;

// Express application
const app: Application = express();

//parse JSON request bodies
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded request bodies

// Rate limiting middleware to limit the number of requests from a single IP address
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Demasiadas solicitudes desde esta dirección IP, por favor intente de nuevo más tarde.',
});

///Middleware Security
app.use(helmet()); // Middleware to set security-related HTTP headers
app.use(helmet.contentSecurityPolicy(
    {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            
        },
    }
)); 

//cors
app.use(cors(
    {
        origin: CORS_ORIGIN || '*', // Allow all origins by default
        credentials: true, // Allow credentials (cookies, authorization headers, etc.)
        allowedHeaders:  ['Content-Type', 'Authorization', 'X-Api-Key'],
    }
));
app.use((req, _res, next) => {
    // clonamos el query actual
    const queryClone = { ...req.query };
    // definimos una propiedad propia "query" que sea mutable
    Object.defineProperty(req, 'query', {
      configurable: true,
      enumerable:   true,
      writable:     true,
      value:        queryClone,
    });
    next();
  });
// sanitización
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use('/api/v1', limiter); 

// Routes
app.use('/api/v1', profileRoutes); 
// Health check route
app.use((_req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' }); // Handle 404 errors
});

//Error global

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {  
    console.error('Error:', err.message);
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    const message = status === 500 ? 'Error interno del servidor' : err.message;
    res.status(status).json({ message });
  });
  

if (NODE_ENV !== 'test') {
    mongoose
    .connect(MONGO_URI as string)
    .then(() => {
        console.log('Conectado a MongoDB');
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error al conectar a MongoDB:', error);
    });
}

export default app;