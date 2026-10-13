# Rumbo — asistente para viajar por Argentina (MVP)

MVP académico de un asistente digital para turistas que organizan sus propios viajes dentro de Argentina.
Reúne, filtra y personaliza alojamientos, actividades, lugares, gastronomía y transporte según cada viaje,
y deriva al usuario al **proveedor externo** para reservar o contratar.

> Rumbo **no** es una agencia ni un sistema de reservas: es un intermediario entre el turista y los prestadores.

## Recorrido de la demo

```
Inicio → Preferencias del viaje (6 pasos + resumen) → Recomendaciones personalizadas
      → Explorar y filtrar → Guardar (favoritos) o comparar → Elegir una → Ir al proveedor ↗
```

| Ruta | Pantalla |
|---|---|
| `/` | Inicio: hero, beneficios y destinos |
| `/planificar` | Formulario por pasos con barra de progreso y validación |
| `/resultados` | Recomendaciones ordenadas por % de coincidencia, filtros por categoría y orden |
| `/recomendacion/[id]` | Detalle con galería, info útil y desglose del puntaje |
| `/favoritos` | Favoritos agrupados por destino y categoría |
| `/comparar` | Tabla comparativa de 2 o 3 opciones de la misma categoría |

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Sin backend: datos en archivos locales (`/data`)
- Preferencias, borrador del formulario, favoritos y comparación en `localStorage`

## Correr localmente

Requisitos: **Node.js 20.9 o superior** (https://nodejs.org).

```bash
npm install
npm run dev
```

Abrí http://localhost:3000.

Para probar la versión de producción:

```bash
npm run build
npm start
```

## Desplegar en Vercel

**Opción A — desde GitHub (recomendada)**
1. Subí el proyecto a un repositorio de GitHub.
2. En https://vercel.com → *Add New… → Project* → importá el repositorio.
3. Vercel detecta Next.js automáticamente. No hace falta configurar variables de entorno. Tocá **Deploy**.

**Opción B — desde la terminal**

```bash
npx vercel
```

y para producción `npx vercel --prod`.

## Cambiar el nombre del proyecto

El nombre está en una sola constante: [`lib/config.ts`](lib/config.ts)

```ts
export const APP_NAME = "Rumbo";
```

Se actualiza en el encabezado, el título de la pestaña, el aviso de salida y el pie de página.
(Las claves de `localStorage` también derivan del nombre, así que al cambiarlo se empieza con favoritos vacíos.)

## Estructura

```
app/                 páginas (App Router)
components/          Header, TarjetaRecomendacion, FiltroCategorias, Stepper, ModalSalida, BarraComparar…
data/
  recomendaciones.ts datos demo (73 recomendaciones en 7 destinos)
  destinos.ts        destinos disponibles
  imagenes.ts        URLs de fotos (generado por scripts/generar-imagenes.ps1)
lib/
  repository.ts      ÚNICA puerta de acceso a los datos
  scoring.ts         lógica de personalización
  storage.ts         localStorage (preferencias, favoritos, comparación)
  etiquetas.ts       textos y formatos (categorías, intereses, precios en ARS)
  config.ts          nombre de la app y aviso de demo
types/index.ts       modelo de datos
```

## Reemplazar los datos demo por una API

Toda la UI accede a los datos **solo** a través de [`lib/repository.ts`](lib/repository.ts), cuyas funciones
ya son `async`. Para conectar una API real, cambiá el cuerpo de esas funciones manteniendo las firmas:

```ts
const API = process.env.NEXT_PUBLIC_API_URL;

export async function getRecomendaciones(filtros: FiltrosRecomendaciones = {}): Promise<Recomendacion[]> {
  const qs = new URLSearchParams(filtros as Record<string, string>);
  const res = await fetch(`${API}/recomendaciones?${qs}`);
  return res.json();
}

export async function getById(id: string): Promise<Recomendacion | null> {
  const res = await fetch(`${API}/recomendaciones/${id}`);
  return res.ok ? res.json() : null;
}
// …igual para getByIds, getDestinos, getDestino, getAllIds, getImagenPortada
```

La API debe devolver objetos con la forma de `Recomendacion` y `Destino` definidos en [`types/index.ts`](types/index.ts).
Después podés borrar la carpeta `/data`. Si la API tiene muchos ítems, en
`app/recomendacion/[id]/page.tsx` podés quitar `generateStaticParams` para que el detalle se genere a demanda.

## Lógica de personalización

En [`lib/scoring.ts`](lib/scoring.ts), sin IA:

| Regla | Puntos |
|---|---|
| Destino distinto al elegido | se excluye |
| Cada interés que coincide | +10 |
| Mismo nivel de presupuesto / nivel más barato / más caro | +15 / +5 / 0 |
| Monto indicado y `precioMin` dentro del monto | +5 |
| Movilidad compatible | +10 |
| Sin auto (transporte público o traslados) y la opción requiere vehículo | −15 |
| Tipo de viajero coincide | +8 |

El porcentaje es `puntaje / máximo posible`. La función devuelve también los motivos, con los que se arma
la frase “¿Por qué te lo recomendamos?” y el desglose del detalle.

**Ejemplo para validar en la demo:** Bariloche + Intermedio + Naturaleza y Aventura + Transporte público
→ arriba aparece *Circuito Chico en bicicleta* (100 %) y *Trekking al Refugio Frey*; la *Ruta de los Siete Lagos*
y el *Cerro Tronador* (requieren auto) bajan al fondo. Cambiando la movilidad a “Auto alquilado” suben.

## Datos de demostración

- Lugares y atractivos reales; **precios, valoraciones y horarios son aproximados** y no se actualizan.
- `urlProveedor` apunta a la página principal pública del proveedor o a sitios oficiales de turismo.
- Fotos de **Wikimedia Commons** (licencias libres). Si una no carga, se muestra un degradado con el nombre.
  Para regenerarlas (Windows PowerShell): `./scripts/generar-imagenes.ps1 -OutFile data/imagenes.ts`.

## Fuera de alcance

Pagos o reservas propias, cuentas de usuario o proveedores, vuelos o viajes internacionales,
funciones para agencias, IA o APIs externas.
