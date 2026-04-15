import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Página no encontrada</h1>
      <p className="text-sm text-gray-600">La ruta que intentas abrir no existe o no tienes acceso.</p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
