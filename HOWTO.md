# Cómo usar EduAgent AI

EduAgent AI es un tutor inteligente que se adapta a tu nivel educativo. Conecta tu aula virtual, sube tus apuntes y pregúntale lo que necesites — responde usando tus propios materiales de clase como fuente de verdad.

---

## Requisitos previos

- Una cuenta de correo electrónico para registrarte
- Una API key de [Anthropic](https://console.anthropic.com) o [Google Gemini](https://aistudio.google.com/app/apikey) para el chat

---

## 1. Crear tu cuenta

1. Abre la app en [https://eduagent-olive.vercel.app](https://eduagent-olive.vercel.app)
2. Haz clic en **Registrarse** e introduce tu correo y contraseña
3. Confirma tu correo si recibes un email de verificación
4. Inicia sesión

---

## 2. Añadir tu API key

El chat necesita una API key para funcionar. Sin ella, el agente no puede responder.

1. Ve a **Ajustes** (icono ⚙️ en el sidebar)
2. Pestaña **API Key**
3. Elige tu proveedor:
   - **Anthropic Claude** → clave empieza por `sk-ant-` · [Obtener clave](https://console.anthropic.com/settings/keys)
   - **Google Gemini** → clave empieza por `AIza` o `AQ.` · [Obtener clave gratis](https://aistudio.google.com/app/apikey)
4. Pega la clave y haz clic en **Guardar**

> La clave se cifra antes de guardarse y nunca se muestra en pantalla.

---

## 3. Completar tu perfil

El agente adapta el lenguaje según tu edad. Cuanto antes lo configures, mejor será la experiencia.

1. Ve a **Ajustes** → pestaña **Perfil**
2. Introduce tu nombre y edad
3. Haz clic en **Guardar cambios**

| Edad | Nivel asignado | Estilo de respuesta |
|---|---|---|
| 5–12 años | Infantil | Lenguaje simple, frases cortas |
| 13–17 años | Adolescente | Lenguaje natural, tecnicismos explicados |
| 18+ años | Adulto | Lenguaje técnico, respuestas densas |

---

## 4. Conectar tu aula virtual

Importa tus deberes y fechas de entrega automáticamente desde Moodle o Google Classroom.

### Moodle

1. Ve a **Aula Virtual** en el sidebar
2. En la sección **Moodle**, introduce:
   - **URL de Moodle** — ej: `https://moodle.miescuela.es`
   - **Token de servicio web** — se genera en Moodle → Administración → Plugins → Servicios web → Gestionar tokens
3. Haz clic en **Conectar**
4. Una vez conectado, pulsa **Sincronizar** para importar los deberes

### Google Classroom

1. Ve a **Aula Virtual** en el sidebar
2. Haz clic en **Conectar con Google**
3. Autoriza el acceso en la ventana de Google
4. Pulsa **Sincronizar** para importar el coursework

---

## 5. Subir documentos

Sube tus apuntes, PDFs o apuntes de clase para que el agente los use al responder.

1. Ve a **Documentos** en el sidebar
2. Haz clic en **Subir documento**
3. Selecciona un archivo PDF, DOCX o TXT (máx. 50 MB)
4. Espera a que el estado cambie a **Listo**

A partir de ese momento, cuando preguntes algo relacionado con ese temario, el agente buscará en tus documentos y citará la fuente al responder.

---

## 6. Chatear con el agente

1. Ve a **Chat** en el sidebar
2. Haz clic en **Nuevo chat** o continúa una conversación existente
3. Escribe tu pregunta y pulsa Enter

### Ejemplos de lo que puedes preguntar

| Tipo de consulta | Ejemplo |
|---|---|
| Explicación de concepto | *"Explícame qué es la fotosíntesis"* |
| Resumen de tema | *"Resume el tema 4 de biología"* |
| Ayuda con deberes | *"No entiendo el ejercicio 3 de matemáticas"* |
| Planificación | *"¿Qué deberes tengo esta semana?"* |
| Búsqueda en apuntes | *"¿Qué dice mi apunte sobre la Segunda Guerra Mundial?"* |

### Modo anti-trampa

Si pides ayuda con un ejercicio, el agente **nunca da la respuesta directa**. En su lugar:
1. Te pregunta qué parte no entiendes
2. Da pistas progresivas
3. Explica el concepto subyacente con un ejemplo diferente

---

## 7. Gestionar deberes

1. Ve a **Deberes** en el sidebar
2. Verás todas las tareas importadas desde tu aula virtual, ordenadas por fecha de entrega
3. Puedes marcarlas como completadas o cambiar su prioridad

---

## Preguntas frecuentes

**¿Mi API key es segura?**
Sí. Se cifra con Fernet antes de guardarse en la base de datos y nunca se envía al frontend ni aparece en los logs.

**¿Cuánto cuesta usar la app?**
La app es gratuita. Solo pagas el consumo de tu API key directamente a Anthropic o Google.

**¿El agente recuerda conversaciones anteriores?**
Sí, dentro de la misma sesión (hasta 20 turnos). Si inicias un nuevo chat, empieza sin contexto previo.

**¿Mis documentos son privados?**
Sí. Cada usuario solo accede a sus propios documentos — nunca se mezclan con los de otros usuarios.

**¿Puedo cambiar de proveedor LLM?**
Sí. En Ajustes → API Key puedes añadir claves de Anthropic y Gemini y cambiar el proveedor activo en cualquier momento.
