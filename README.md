# Inventario & Finanzas + Tienda Online

Sistema de gestión de inventario, costos, ventas y caja para un negocio de
producción y venta de productos (pensado inicialmente para Yerba Mate, pero
100% genérico y configurable: todo se modela como `Producto` / `Variante` /
`Atributo`). Incluye además una **tienda pública** con catálogo, ofertas,
carrito y checkout por WhatsApp, y un **panel de administración** protegido
por contraseña.

## Stack técnico

- **Next.js 14** (App Router) full-stack: páginas React + API Routes en el
  mismo proyecto. Se despliega en **Netlify**.
- **Prisma ORM** + **PostgreSQL** (pensado para un proyecto gratuito de
  [Supabase](https://supabase.com), aunque funciona con cualquier Postgres:
  Neon, Railway, RDS, etc.).
- **Tailwind CSS** para el frontend, con una identidad visual rústica/de
  campo (verde monte, terracota, papel/madera) pensada para un negocio de
  producción y venta de Yerba Mate, con soporte de modo claro/oscuro.
- **Recharts** para los gráficos del dashboard.
- **Zod** para validación exhaustiva de datos de entrada.
- Autenticación de administrador simple (contraseña única + cookie firmada),
  pensada para un único dueño de negocio.

## Estructura del proyecto

```
prisma/
  schema.prisma        # Modelo de datos (Producto/Variante/Atributo, stock, ventas, caja, costos)
  seed.ts               # Datos de ejemplo (Yerba Mate)
src/
  app/
    page.tsx            # Tienda pública (catálogo, ofertas, carrito, WhatsApp)
    admin/
      login/page.tsx    # Login del panel de administración
      (protected)/      # Todo lo que requiere sesión de administrador
        page.tsx         # Dashboard
        productos/       # Catálogo: productos, variantes, categorías, atributos
        inventario/       # Movimientos de stock (entradas/salidas) + historial
        finanzas/         # Costos fijos + márgenes (PPP)
        ventas/           # Punto de venta (POS)
        caja/             # Apertura/cierre de caja + movimientos manuales
        configuracion/    # Etiquetas de la interfaz + datos del negocio
    api/                 # Endpoints REST (uno por recurso)
      public/            # Endpoints públicos usados por la tienda (catálogo, pedidos)
      admin/              # Login/logout de administrador
  components/
    layout/              # Sidebar, Header del panel admin
    store/                # Componentes de la tienda pública
    ui/                   # Modal, StatCard, etc.
    providers/            # Tema (claro/oscuro) y configuración dinámica (etiquetas/settings)
  lib/
    stock.ts              # Lógica transaccional de stock, ventas, PPP y márgenes
    auth.ts               # Firma/verificación de la sesión de administrador
    enums.ts              # Tipos de los campos "enum" (Postgres vía Prisma se modela como String)
    validations.ts         # Esquemas Zod de cada endpoint
  middleware.ts           # Protege /admin/* y la API contra acceso sin sesión
netlify.toml              # Build command + plugin de Netlify para Next.js
```

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- Una base de datos PostgreSQL. Este proyecto ya viene con un proyecto
  gratuito de Supabase creado (`yerba-inventario-finanzas`, región
  `sa-east-1`) — solo falta que obtengas su contraseña (ver abajo). También
  podés usar cualquier otro Postgres (Neon, Railway, uno local, etc.).

## Instalación

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Obtené la cadena de conexión de la base de datos:

   - Entrá a [supabase.com/dashboard](https://supabase.com/dashboard), abrí el
     proyecto **yerba-inventario-finanzas**.
   - Andá a **Project Settings > Database > Connection string**.
   - Copiá la cadena en modo **Transaction pooler** (puerto `6543`) para
     `DATABASE_URL`, y la de modo **Session/Direct** (puerto `5432`) para
     `DIRECT_URL`. Ambas usan la misma contraseña de la base (la que elegiste
     o generaste al crear el proyecto).

3. Configurar variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Editá `.env` y completá:

   - `DATABASE_URL` y `DIRECT_URL`: las cadenas de conexión del paso anterior.
   - `ADMIN_PASSWORD`: la contraseña para entrar a `/admin`. **Cambiala por una propia.**
   - `ADMIN_SESSION_SECRET`: una cadena larga y aleatoria para firmar la sesión
     (podés generarla con `openssl rand -hex 32`).

4. Aplicar las migraciones (crea todas las tablas en la base):

   ```bash
   npx prisma migrate deploy
   ```

5. Cargar datos de ejemplo (categorías, productos, un costo fijo y una venta
   de muestra, todo con la Yerba Mate como caso de uso):

   ```bash
   npx prisma db seed
   ```

## Correr en modo desarrollo

```bash
npm run dev
```

- Tienda pública: http://localhost:3000
- Panel de administración: http://localhost:3000/admin (pide la contraseña
  definida en `ADMIN_PASSWORD`)

## Desplegar en Netlify (gratis)

1. Subí este repositorio a GitHub (o el proveedor que uses).
2. En [Netlify](https://app.netlify.com), **Add new site > Import an existing
   project**, y elegí el repositorio. Netlify detecta Next.js automáticamente
   y usa el `netlify.toml` incluido (que ya define el build command y el
   plugin `@netlify/plugin-nextjs`).
3. En **Site settings > Environment variables**, cargá:
   - `DATABASE_URL` y `DIRECT_URL` (las mismas del paso de instalación local).
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
4. Desplegá. El build corre automáticamente `prisma generate` y
   `prisma migrate deploy` antes de compilar, así que la base queda al día en
   cada deploy sin pasos manuales.
5. Una vez desplegado, entrá a `/admin/configuracion` y cargá el nombre del
   negocio, moneda y número de WhatsApp real de la tienda.

**Sobre la base de datos gratuita:** los proyectos gratuitos de Supabase se
pausan automáticamente tras ~1 semana sin actividad (no se pierden datos,
pero hay que reactivarlos a mano desde el dashboard). Para que esto no
interrumpa la tienda, se configuró una rutina que hace un chequeo semanal
automático a la base para mantenerla activa.

## Scripts disponibles

| Comando                  | Descripción                                          |
| ------------------------ | ----------------------------------------------------- |
| `npm run dev`             | Corre la app en modo desarrollo                        |
| `npm run build`           | Build de producción                                    |
| `npm run start`           | Corre el build de producción                           |
| `npm run prisma:studio`   | Abre Prisma Studio para ver/editar datos visualmente   |
| `npm run prisma:migrate`  | Crea y aplica una nueva migración                       |
| `npm run prisma:seed`     | Vuelve a cargar los datos de ejemplo                    |
| `npm run db:reset`        | Borra la base, la recrea y la vuelve a sembrar          |

## Cómo funciona cada módulo

### 1. Arquitectura genérica y configurable

El modelo de datos no menciona "yerba" en ningún lado: usa `Product`,
`ProductVariant`, `Attribute` y `AttributeValue`. Desde **Configuración del
sistema** (`/admin/configuracion`) se pueden renombrar las etiquetas visibles
de la interfaz (por ejemplo, cambiar "Producto" por "Variante de Yerba" o
"Categoría" por "Tipo de Molienda") sin tocar código: los cambios se guardan
en la tabla `FieldLabel` y se cargan dinámicamente en todo el frontend a
través de `AppConfigProvider`.

### 2. Inventario

Cada entrada o salida de stock se registra como un `StockMovement` dentro de
una transacción de base de datos (`src/lib/stock.ts`). Las salidas (venta,
merma, muestra) validan que haya stock suficiente **antes** de descontar, por
lo que el stock nunca puede quedar negativo de forma inconsistente. Las
entradas (producción propia, compra, devolución) registran costo unitario,
costo adicional del lote, cantidad y lote opcional. Todo el historial es
consultable con filtros en `/admin/inventario`.

### 3. Costos y finanzas

- Costos fijos (alquiler, sueldos, etc.) con frecuencia configurable.
- El costo promedio ponderado (PPP) de cada variante se calcula a partir de
  todas sus entradas históricas (cantidad × costo unitario + costos
  adicionales del lote), y se compara contra el precio de venta vigente para
  mostrar el margen real en `/admin/finanzas`.
- Cada ítem de venta guarda una "foto" del PPP al momento de vender, para que
  los reportes históricos de rentabilidad no cambien retroactivamente cuando
  cambian los costos futuros.

### 4. Ventas y caja

- POS en `/admin/ventas`: selección rápida de variantes, descuento, método de
  pago (efectivo/transferencia/tarjeta). Al confirmar, se descuenta stock real
  dentro de la misma transacción que crea la venta.
- Caja en `/admin/caja`: apertura y cierre de caja con conteo de efectivo
  esperado vs. contado, y movimientos manuales de dinero (ingresos/egresos no
  asociados a una venta).

### 5. Dashboard y reportes

`/admin` muestra ventas y ganancia neta por período (7/30/90 días), el Top 5
de productos más vendidos, alertas de stock por debajo del mínimo y el
balance general histórico (ingresos − costo de mercadería − costos fijos =
utilidad neta).

### 6. Tienda pública + WhatsApp

La página `/` es la tienda pública: lee el catálogo real desde la base de
datos (`/api/public/catalog`), muestra una sección de ofertas (variantes
marcadas "en oferta" desde `/admin/productos`) y un carrito de compras que
valida el stock disponible. Al confirmar el pedido:

1. Se crea una venta real en el sistema (`/api/public/orders`) y se descuenta
   el stock correspondiente — el precio siempre se recalcula en el servidor,
   nunca se confía en lo que envía el navegador.
2. Se abre WhatsApp (`wa.me`) con un mensaje prearmado con el detalle del
   pedido y el total, al número configurado en **Configuración del sistema**
   (`whatsapp_number`).

### 7. Acceso de administrador

El panel `/admin` está protegido por una única contraseña (`ADMIN_PASSWORD`).
Al iniciar sesión se genera una cookie firmada (HMAC-SHA256) con expiración
de 12 horas; un middleware (`src/middleware.ts`) valida esa cookie en todas
las rutas de `/admin/*` y en la API de administración, dejando abiertos solo
los endpoints públicos de la tienda (`/api/public/*`) y la lectura de
configuración general.

## Notas y próximos pasos sugeridos

- El proyecto usa Next.js 14.2.35 (última versión de la rama 14.2 al momento
  de escribir esto). `npm audit` puede seguir mostrando avisos de funciones
  que esta app no usa (optimización de imágenes, WebSockets, i18n); si más
  adelante querés actualizar, se puede migrar a Next 15/16.
- La autenticación de administrador es intencionalmente simple (una sola
  contraseña compartida, sin roles ni múltiples usuarios), pensada para un
  solo dueño de negocio.
- El concepto de "oferta" es por variante (precio promocional + marca
  on/off). No incluye promociones combinadas por cantidad (ej. "3x2" o
  descuentos por volumen); se puede sumar más adelante como un módulo aparte.
- **Row Level Security (RLS) de Supabase:** la base tiene RLS deshabilitado
  en todas las tablas. Esto normalmente sería un riesgo si el frontend usara
  el cliente `supabase-js` con la clave pública (anon key), porque esa clave
  expondría las tablas directamente al navegador. Esta app **no hace eso**:
  toda la base se accede exclusivamente desde el servidor (Prisma + rutas
  `/api/*` de Next.js), usando la conexión directa a Postgres, nunca la
  anon key ni el cliente de Supabase en el navegador. Si en el futuro
  agregás `supabase-js` en el frontend o Supabase Auth, activá RLS con
  políticas antes de hacerlo.
