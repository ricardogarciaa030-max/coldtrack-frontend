# 🎨 ColdTrack Frontend

Interfaz web para el sistema de monitoreo de temperatura de cámaras de frío.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno
Editar `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-firebase
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

## 🔐 Acceso al Sistema

### Credenciales de Prueba
- **Email**: x3_for_riid@live.cl
- **Contraseña**: (configurada en Firebase Auth)

### Roles de Usuario
- **ADMIN**: Acceso completo a todas las funciones
- **ENCARGADO**: Gestión de su sucursal asignada
- **SUBJEFE**: Solo lectura de su sucursal

## 📱 Funcionalidades

### 🏠 Dashboard
- **KPIs en tiempo real**: Cámaras activas, eventos del día, etc.
- **Gráfico de eventos**: Últimos 7 días
- **Eventos recientes**: Lista de eventos más recientes
- **Actualización automática**: Datos se actualizan en tiempo real

### ⏰ Tiempo Real
- **Monitoreo en vivo**: Estado actual de las cámaras
- **Selección de cámara**: Filtro por cámara específica
- **Temperaturas actuales**: Lecturas en tiempo real
- **Eventos activos**: Alertas y fallas en curso

### 📊 Histórico
- **Búsqueda por fechas**: Filtros de fecha desde/hasta
- **Tabla de eventos**: Historial completo de eventos
- **Exportar CSV**: Descarga de datos históricos
- **Filtros avanzados**: Por tipo, estado, cámara

### 👥 Gestión
- **Usuarios**: Lista y gestión de usuarios del sistema
- **Cámaras**: Configuración de cámaras de frío
- **Sucursales**: Gestión de sucursales

## 🛠️ Tecnologías

### Stack Principal
- **React 18** - Framework principal
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos y diseño
- **Firebase Auth** - Autenticación de usuarios

### Librerías Principales
- **React Router** - Navegación entre páginas
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos
- **Date-fns** - Manejo de fechas

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes base (botones, inputs)
│   │   └── layout/         # Layout y navegación
│   ├── pages/              # Páginas principales
│   │   ├── auth/           # Login y autenticación
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── realtime/       # Monitoreo en tiempo real
│   │   └── historico/      # Búsqueda histórica
│   ├── contexts/           # Context providers (Auth, etc.)
│   ├── services/           # Servicios API
│   └── utils/              # Utilidades y helpers
├── public/                 # Archivos estáticos
└── package.json           # Dependencias y scripts
```

## 🔧 Configuración

### Variables de Entorno
```env
# API Backend
VITE_API_URL=http://localhost:8000

# Firebase Configuration
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-firebase
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter ESLint
```

## 🎨 Diseño

### Tema y Colores
- **Tema oscuro** por defecto
- **Colores principales**: Azul (#3B82F6) y gris oscuro
- **Responsive**: Adaptado para desktop y móvil
- **Iconografía**: Lucide React icons

### Componentes UI
- **Botones**: Variantes primary, secondary, outline
- **Inputs**: Con validación y estados de error
- **Cards**: Para mostrar información agrupada
- **Tablas**: Con paginación y filtros
- **Gráficos**: Charts responsivos con Recharts

## 📡 Integración con Backend

### Autenticación
- Login con Firebase Auth
- Token JWT enviado en headers
- Renovación automática de tokens
- Logout y limpieza de sesión

### APIs Consumidas
```javascript
// Dashboard
GET /api/dashboard/kpis/
GET /api/dashboard/eventos-recientes/
GET /api/dashboard/eventos-por-dia/

// Histórico
GET /api/eventos/?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD

// Usuarios y configuración
GET /api/users/
GET /api/camaras/
GET /api/sucursales/
```

## 🔄 Estado y Contextos

### AuthContext
- Manejo de autenticación global
- Estado del usuario logueado
- Funciones de login/logout
- Protección de rutas

### Actualización en Tiempo Real
- Polling automático cada 30 segundos
- Actualización de KPIs y eventos
- Indicadores visuales de carga

## 🛠️ Comandos Útiles

### Desarrollo
```bash
npm run dev          # Iniciar desarrollo
npm run build        # Build producción
npm run preview      # Preview build
```

### Verificación
```bash
npm run lint         # Verificar código
npm audit            # Verificar vulnerabilidades
```

## 📝 Notas Importantes

- **Backend requerido**: El frontend necesita que el backend esté corriendo
- **Puerto 5173**: Puerto por defecto de Vite
- **Hot reload**: Cambios se reflejan automáticamente
- **CORS**: Configurado en el backend para este dominio