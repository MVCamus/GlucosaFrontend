# 🐾 DiabetesVet / Glucosa Frontend

> **Aplicación móvil y PWA (React + TailwindCSS + Capacitor) para el control integral de glucosa, insulina, alimentación y tratamientos en mascotas diabéticas.**

<div align="center">

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.x-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange)](https://github.com/pmndrs/zustand)

</div>

---

## 📸 Vistas Reales de la Aplicación

Todas las capturas a continuación fueron tomadas directamente de los componentes e interfaz real de la aplicación:

### 1. Panel de Control y Monitoreo Continuo (Dashboard)
<div align="center">
  <img src="public/screenshots/02_dashboard.png" alt="Dashboard Principal" width="275" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
  <p><em>Curva interactiva de glucosa en tiempo real con zonas objetivo (80-180 mg/dL), marcas de insulina y comida, estado del sensor y métricas del día.</em></p>
</div>

---

### 2. Registro Rápido de Eventos Diarios
<div align="center">
  <table>
    <tr>
      <td align="center" width="50%" valign="top">
        <b>🩸 Registro de Glucosa</b><br/><br/>
        <img src="public/screenshots/03_registrar_glucosa.png" alt="Registro de Glucosa" width="275" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
      </td>
      <td align="center" width="50%" valign="top">
        <b>💉 Registro de Insulina con Protección</b><br/><br/>
        <img src="public/screenshots/04_registrar_insulina.png" alt="Registro de Insulina" width="275" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
      </td>
    </tr>
  </table>
</div>

---

### 3. Tratamientos e Historial Diario
<div align="center">
  <table>
    <tr>
      <td align="center" width="50%" valign="top">
        <b>💊 Remedios y Horarios</b><br/><br/>
        <img src="public/screenshots/05_remedios.png" alt="Gestión de Medicamentos" width="275" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
      </td>
      <td align="center" width="50%" valign="top">
        <b>📅 Historial Diario</b><br/><br/>
        <img src="public/screenshots/06_historial.png" alt="Historial Diario" width="275" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
      </td>
    </tr>
  </table>
</div>

---

### 4. Autenticación y Acceso Seguro
<div align="center">
  <img src="public/screenshots/01_login.png" alt="Pantalla de Inicio de Sesión" width="275" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />
  <p><em>Inicio de sesión con selección de cuidador o modo Administrador y soporte de cuenta nueva (Signup).</em></p>
</div>

---

## 🚀 Funcionalidades del Sistema

### 1. Ingesta y Conexión de Sensores
El dueño de la mascota vincula sus credenciales de LibreLinkUp en la aplicación. A partir de ese momento, el sistema se conecta automáticamente a los servidores en la nube para importar las lecturas de glucosa sin intervención manual.

* **Integración con LibreLinkUp API (`@diakem/libre-link-up-api-client`)**: Cliente HTTP que interactúa con los servicios de LibreLinkUp, procesando las lecturas periódicamente en segundo plano cada 5 minutos.
* **Banner de estado del sensor y días restantes**: Muestra en la pantalla principal el modelo del sensor activo y el cálculo exacto de días calendario restantes de vida útil, con colores preventivos (verde, amarillo o rojo) cuando el sensor está por caducar o caducado.
* **Registro manual de respaldo**: Permite ingresar mediciones manuales de glucómetro tradicional indicando el valor en mg/dL y la fecha/hora en caso de no contar con sensor continuo.

---

### 2. Panel Principal (Dashboard) y Visualización Clínica
* **Glucosa en tiempo real**: Muestra la última medición resaltada visualmente en rojo para hipoglucemias (<70 mg/dL), verde para rango objetivo (70–250 mg/dL) o amarillo/naranja para hiperglucemias (>250 mg/dL).
* **Gráfico interactivo de curvas glucémicas**: Visualización continua de las curvas de glucosa a lo largo del día con zonas que delimitan los rangos seguros configurados para la mascota.
* **Marcadores visuales de eventos**: Sitúa marcadores en el momento exacto en que se administró una dosis de insulina o se registró una comida, correlacionando el impacto en la curva glucémica.

---

### 3. Registro Clínico y Seguridad de Insulina
* **Algoritmo de prevención de doble dosis**: Si se intenta registrar una dosis habiéndose administrado otra en las últimas 8 horas, el sistema bloquea la acción de inmediato alertando de una posible doble dosis.
* **Modal de alerta crítica de sobredosis**: Despliega advertencia mostrando hora exacta, unidades aplicadas y cuidador responsable, con opciones de cancelación o confirmación estricta.
* **Calculadora rápida de unidades**: Selector interactivo con ajuste fino (±0.1 U) para ingresar con precisión decimal la cantidad de insulina y tipo de fármaco.

---

### 4. Control Horario de Medicamentos
* **Organizador de tomas diarias**: Calcula y lista las tomas del día según su frecuencia (1 vez al día, 2 veces o personalizado).
* **Marcado interactivo con un toque**: Botón de verificación rápida para marcar como "Dado", guardando hora exacta y nombre del cuidador.
* **Ventana de cortesía y estado de puntualidad**: Margen de tolerancia de ±45 minutos. Si se supera, se etiqueta como "Tarde (+X min/hrs)", manteniendo en pendiente los horarios futuros.
* **Soporte para medicamentos estrictos**: Recalcula dinámicamente la hora recomendada para la siguiente dosis en caso de retrasos previos.

---

### 5. Bitácora de Alimentación e Historial
* **Registro de comidas y porciones**: Categorización por tipo (pellet, casera, mix), cantidad exacta y notas de comportamiento o apetito.
* **Historial unificado y filtros por fecha**: Línea de tiempo cronológica completa que consolida lecturas de glucosa, insulina, comidas y medicamentos de cualquier fecha.

---

### 6. Sistema de Notificaciones y Cuentas Familiares
* **Alertas Push automáticas (Firebase FCM)**: Despacho inmediato de notificaciones push de alta prioridad ante hipoglucemias severas, hiperglucemias y recordatorios de medicación.
* **Gestión de roles y cuidadores compartidos**: Accesos diferenciados (Owner y Family) para que múltiples miembros del hogar registren cuidados con permisos protegidos.
* **Sincronización Offline-First**: Permite registrar eventos sin internet y sincronizarlos automáticamente con el servidor central al recuperar la conexión mediante identificadores únicos.

---

## 🛠️ Stack Tecnológico

| Capa | Herramientas / Librerías |
|---|---|
| **Frontend Base** | React 19, TypeScript, Vite 6 |
| **Diseño y Estilos** | TailwindCSS 4, Lucide React Icons |
| **Gestión de Estado** | Zustand (con middleware de persistencia) |
| **Gráficos** | Recharts |
| **Móvil / PWA** | Capacitor 8, Local Notifications, Push Notifications |
| **Fechas y Horarios** | date-fns, date-fns-tz (Zona horaria Chile `America/Santiago`) |

---
