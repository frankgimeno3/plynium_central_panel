# Logged components — contracts (local — con dientes)

Shared UI for the logged area. Use this when you **extend or integrate** a component; for “where is the date picker?” the folder tree is enough.

---

## Propósito y ownership

- **Propósito:** Definir contratos (props, inputs/outputs, side effects), invariantes y gotchas de los componentes compartidos del área logged para que se pueda integrar o extender sin abrir todo el código.
- **Este módulo posee:** Topnav, Leftnav, DatePicker, DateInputs, RichTextEditor (y subcomponentes), modals (EditUserModal, EditContentsModal, DeleteArticleModal, DeletePublicationModal, AddTagModal), iconos svg. **No posee:** componentes de página (article_components, banner_components, etc.), que viven junto a sus páginas.

---

## Contrato (inputs/outputs/side effects)

### RichTextEditor (RichTextEditor/, index)

- **Inputs:** value (HTML string), onChange(html), placeholder, className, minHeight. RichTextContent: htmlOrPlain, className, as (div|p|span). isRichTextEmpty(html).
- **Outputs:** RichTextEditor emite cambios vía onChange(html). RichTextContent renderiza; isRichTextEmpty → boolean.
- **Side effects:** contentEditable; toolbar usa document.execCommand. RichTextContent usa dangerouslySetInnerHTML cuando el contenido parece HTML.

### Modals

- **EditUserModal:** isOpen, initialUser (id_user, user_full_name, user_name, user_role, user_description), onSave(updatedUser), onCancel, saveError. Enter = save if changed; Escape = cancel.
- **EditContentsModal:** isOpen, initialValue, title, onSave(newValue), onCancel, isRichText. Muestra DateInputs, RichTextEditor o textarea según contexto. Enter save, Escape cancel.
- **DeleteArticleModal / DeletePublicationModal:** isOpen, articleTitle/publicationName, onConfirm, onCancel. Overlay o Escape = cancel.
- **AddTagModal:** isOpen, initialValue, onSave(newTag), onCancel. Un solo tag (string). Enter save si no vacío y cambiado.

Todos los modals son controlados: el padre posee open/close e initial values.

### DatePicker, DateInputs

- **DatePicker:** value (string), onChange, className, placeholder, min, max. Emite ISO date string. Click outside cierra.
- **DateInputs:** parseDateFields(dateStr) → { day, month, year }; buildDateStr(day, month, year) → ISO o "". Componente: inputs día/mes/año; opcionales error, inputClassName.

### Topnav, Leftnav

- **Topnav:** Título de app (link a /logged), Log out. Log out → AuthenticationService.logout() + router.replace('/').
- **Leftnav:** Secciones colapsables (Contents, Management, Requests, Plynium Network); links a cada página; estado activo desde usePathname(). Las secciones y links deben estar alineados con las rutas bajo `/logged/pages/`.

### SVG icons

ChevronUpSvg, ChevronDownSvg, PencilSvg — presentacionales, prop size opcional. Sin deps externas.

---

## Flujo (estados y transiciones)

- **Modals:** Cerrado → padre setea isOpen true e initialValue/initialUser → Abierto. Usuario edita → Save → onSave(...) → padre actualiza datos y cierra (isOpen false). Cancel/Escape → onCancel → padre cierra sin guardar.
- **RichTextEditor:** value controlado por padre → usuario escribe/pega → onChange(html) → padre actualiza value. Validación de “vacío” con isRichTextEmpty antes de submit.
- **Leftnav:** usePathname() determina sección y página activas; toggle de sección expandida/colapsada es estado local. Navegación por Link de Next.
- **Topnav:** Click en Log out → logout + redirect; no estado local relevante.

---

## Invariantes

- Los modals son siempre controlados: el padre decide isOpen y los valores iniciales. No usar con estado no controlado.
- RichTextEditor y RichTextContent esperan el mismo “shape” que se guarda: HTML o texto plano; el consumidor debe ser consistente.
- Leftnav debe incluir un link a cada ruta bajo `/logged/pages/` que se quiera accesible desde el menú; si añades una página nueva, añades el link aquí.
- DateInputs: parseDateFields y buildDateStr son la API pública para serialización; los inputs son solo UI para día/mes/año.

---

## Puntos peligrosos / gotchas

- **RichText:** El contenido guardado puede ser HTML o texto plano. Quien use RichTextEditor/RichTextContent debe pasar el mismo formato que almacena. EditContentsModal usa RichTextEditor cuando isRichText; bloques de artículo/contenido lo usan para el cuerpo.
- **Modals:** Si el padre no actualiza initialValue/initialUser al abrir, el modal puede mostrar datos viejos. Sincronizar en useEffect cuando isOpen pasa a true.
- **Leftnav:** Añadir una ruta nueva en `app/logged/pages/` sin añadir link en Leftnav deja la página inaccesible desde el menú.
- **RichTextContent:** Usa dangerouslySetInnerHTML cuando detecta HTML; no inyectar HTML no sanitizado de fuentes no confiables.

---

## Cómo cambiarlo sin romper

- **Añadir prop a un modal:** Añadir la prop al contrato aquí y al componente; asegurar que el padre pasa el valor y que el modal lo usa solo para lectura o para emitir por onSave. No romper la convención “controlled”.
- **Añadir una página bajo /logged/pages/:** Añadir el link correspondiente en Leftnav (misma sección o nueva) para que sea navegable.
- **Cambiar la forma de fecha en DateInputs:** Si cambias el formato de buildDateStr/parseDateFields, buscar todos los consumidores (eventos, EditContentsModal, etc.) y actualizar la serialización/parsing.
- **RichTextEditor:** Si cambias el formato almacenado (HTML vs plain), actualizar isRichTextEmpty y todos los sitios que validan “vacío” o muestran con RichTextContent.

---

## Tests relevantes y cómo ejecutarlos

No hay tests automatizados para estos componentes en el proyecto. Validar así:

- **Modals:** Abrir cada modal desde la UI (editar usuario, editar contenido, eliminar artículo/publicación, añadir tag). Comprobar que Save/Confirm aplica los cambios y Cancel/Escape cierra sin aplicar. Comprobar que initialValue/initialUser se reflejan al abrir.
- **RichTextEditor:** En una pantalla que lo use (ej. edición de bloque de contenido), escribir y pegar texto; comprobar que onChange se dispara y el valor se persiste. Comprobar que isRichTextEmpty devuelve true para contenido vacío o solo tags.
- **Leftnav:** Navegar a cada link del menú y comprobar que la ruta y la sección activa coinciden. Añadir una página nueva y comprobar que el link aparece y lleva a la ruta correcta.
- **Topnav:** Clic en Log out y comprobar redirección a `/` y que al volver a /logged pide login.
- **DatePicker / DateInputs:** En un formulario que los use (ej. evento), elegir fecha y comprobar que el valor enviado es el esperado (ISO o el formato documentado).
