# CONSCORE ERP IA

Plataforma ERP : CRM, cotizaciones, pedidos, inventario, almacenes,
compras, logística, finanzas, RH, servicio al cliente, gobierno corporativo,
automatización BPM e inteligencia predictiva.

Frontend en React 19 + Vite + Tailwind v4. Backend en Express con TypeScript.

---

## Requisitos

Node.js 20 o superior.


## Producción

```bash
npm install
npm run build
npm start
```

Antes de desplegar hay que definir `SESSION_SECRET`. Sin esa variable el
servidor arranca igual, pero genera un secreto al vuelo y todas las sesiones
se caen en cada reinicio.
