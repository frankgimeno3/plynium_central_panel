# Requests hooks — contract (local — con dientes)

Hooks that provide request data (company, advertisement, other) for the requests section. **Critical:** data is **static JSON + in-memory state only**; there is no persistence.

---

## Propósito y ownership

- **Propósito:** Exponer la lista y el detalle de “requests” (company, advertisement, other) para las páginas de la sección requests, con operaciones de actualización de estado y comentarios que **solo afectan al estado en memoria**.
- **Este módulo posee:** useCompanyRequests, useAdvertisements, useOtherRequests y los tipos/estados que exportan. **No posee:** los archivos JSON (viven en app/contents); solo los importa. Tampoco posee las páginas que consumen los hooks (solo las consumen).

---

## Contrato (inputs/outputs/side effects)

- **useCompanyRequests**
  - **Inputs:** Ninguno (opcional: Provider para compartir estado entre list y detail).
  - **Outputs:** requests (array), getById(id), updateState(id, newState). Tipos: RequestState, CompanyRequest, CompanyContent, etc.
  - **Side effects:** Carga companyRequest.json una vez (useEffect). updateState actualiza solo el estado React; no hay llamada a API.
- **useAdvertisements**
  - **Inputs:** Ninguno.
  - **Outputs:** list, currentTab, setCurrentTab, currentPage, setCurrentPage, paginatedAdvertisements, counts, totalPages, updateAdvertisementState(id, state), addComment(id, comment). Tipos: AdvertisementRequest, AdvertisementState, etc.
  - **Side effects:** Carga advertisementRequest.json una vez. updateAdvertisementState y addComment solo actualizan estado local.
- **useOtherRequests**
  - **Inputs:** Ninguno.
  - **Outputs:** requests, getById(id), updateState(id, newState).
  - **Side effects:** Carga otherRequests.json una vez. updateState solo estado local.

---

## Flujo (estados y transiciones)

1. **Montaje:** El hook hace fetch/import del JSON, lo normaliza al shape esperado y lo guarda en useState (requests/advertisements).
2. **Estado estable:** Lista disponible; getById/paginatedAdvertisements derivan de esa lista. currentTab/currentPage filtran o paginan en memoria.
3. **Transición “update state” o “add comment”:** El hook hace setState actualizando el item correspondiente (por id). No hay persistencia; al recargar la página o volver a entrar, se vuelve a cargar el JSON original.
4. **Navegación:** Si hay Provider (ej. company requests), list y detail comparten el mismo estado; si no, cada página puede tener su propia instancia del hook y el “cambio” no se ve en la otra hasta recargar (depende de la implementación actual).

---

## Invariantes

- Los datos de requests **nunca** se persisten en backend en la implementación actual. Cualquier “cambio de estado” o “añadir comentario” es solo en memoria.
- El shape de los objetos (CompanyRequest, AdvertisementRequest, etc.) debe coincidir con el JSON en app/contents. Si cambias el JSON, debes actualizar el hook y los consumidores.
- Los hooks no llaman a app/service ni a /api; solo importan JSON estático.

---

## Puntos peligrosos / gotchas

- **Sin persistencia:** Cualquier “state change” o “add comment” en la UI solo actualiza React state. Tras refresh o salir y volver a la sección, los cambios se pierden. No asumir que estos hooks hablan con una API.
- **Shape del JSON:** El comportamiento y los tipos (CompanyRequest, AdvertisementRequest, etc.) dependen del shape de los JSON. Cambiar nombres o estructura en el JSON obliga a actualizar el hook y los componentes que consumen los tipos.
- **Ownership:** Los hooks poseen la “vista en memoria” de los datos de requests. Los archivos JSON son de app/contents; los hooks solo los importan. Si se renombra o mueve un JSON, actualizar el import en el hook.

---

## Cómo cambiarlo sin romper

- **Añadir un tipo de request nuevo:** Añadir JSON en app/contents; crear un hook nuevo siguiendo el mismo patrón (useState + carga desde JSON, setter tipo updateState). Conectar el hub de requests y las páginas list/detail al nuevo hook. No asumir persistencia salvo que se añada API + service.
- **Añadir persistencia:** Implicaría nuevas rutas API, servicios en app/service, y que estos hooks llamen a la API en lugar de (o además de) cargar JSON. Hoy está fuera de alcance; documentar la decisión si se implementa.
- **Cambiar el shape del JSON:** Actualizar el hook (mapeo, tipos exportados) y todos los componentes que usen esos tipos (tablas, formularios de detalle). Si el JSON tiene nuevos campos opcionales, el hook puede ignorarlos hasta que la UI los use.
- **Cambiar nombres de archivo JSON:** Actualizar el import en el hook correspondiente (useCompanyRequests → companyRequest.json, etc.).

---

## Tests relevantes y cómo ejecutarlos

No hay tests automatizados para estos hooks en el proyecto. Validar así:

- **Carga inicial:** Entrar a /logged/pages/requests/quotations, .../company, .../requests y comprobar que las listas se muestran sin error y que los datos coinciden con el contenido de advertisementRequest.json, companyRequest.json, otherRequests.json.
- **Update state / add comment:** En la UI, cambiar el estado de un request o añadir un comentario; comprobar que la lista o el detalle se actualizan en pantalla. Recargar la página y comprobar que los cambios **no** persisten (vuelve el estado del JSON).
- **Navegación list ↔ detail:** Abrir un request desde la lista, comprobar que el detalle muestra los mismos datos. Si hay Provider, cambiar estado en detalle y volver a la lista y comprobar que la lista refleja el cambio hasta que se recargue.
- **Cambio de JSON:** Si modificas un JSON, arrancar dev y comprobar que no hay errores de parsing y que la UI muestra los nuevos campos o valores (o que el hook no rompe si añades campos opcionales).
