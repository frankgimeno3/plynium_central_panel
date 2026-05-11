"use client";

type Props = {
  name: string;
  description: string;
  nameExists: boolean;
  nameTrimmed: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  portals: { id: number; name: string }[];
  selectedPortals: number[];
  submitting: boolean;
  error: string;
  onTogglePortal: (portalId: number) => void;
};

export function CreateCompanyCategoryFormFields({
  name,
  description,
  nameExists,
  nameTrimmed,
  onNameChange,
  onDescriptionChange,
  portals,
  selectedPortals,
  submitting,
  error,
  onTogglePortal,
}: Props) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Company category name"
          className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {nameTrimmed && nameExists && <p className="mt-1 text-xs text-red-600">This name already exists</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description"
          rows={3}
          className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Portals (required)</label>
        <div className="flex flex-wrap gap-2">
          {portals.map((p) => (
            <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedPortals.includes(p.id)}
                onChange={() => onTogglePortal(p.id)}
                className="rounded border-gray-300"
                disabled={submitting}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
        {selectedPortals.length === 0 && <p className="mt-1 text-xs text-gray-500">Select at least one portal</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </>
  );
}
