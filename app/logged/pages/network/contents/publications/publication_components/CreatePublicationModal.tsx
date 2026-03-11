"use client";

import React, { FC, useState, useEffect } from "react";
import { PublicationService } from "@/app/service/PublicationService";
import DatePicker from "@/app/logged/logged_components/date_components/DatePicker";

interface CreatePublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePublicationModal: FC<CreatePublicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [idPublication, setIdPublication] = useState("");
  const [redirectionLink, setRedirectionLink] = useState("");
  const [date, setDate] = useState("");
  const [magazine, setMagazine] = useState("");
  const [numero, setNumero] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);

  const handleReset = () => {
    setIdPublication("");
    setRedirectionLink("");
    setDate("");
    setMagazine("");
    setNumero("");
    setShowConfirm(false);
    setConfirmStep(1);
    setIsCreating(false);
    setCreationSuccess(false);
    onClose();
  };

  const handleConfirm = async () => {
    setConfirmStep(2);
    setIsCreating(true);
    setCreationSuccess(false);

    try {
      const publicationData = {
        id_publication: idPublication,
        redirectionLink,
        date,
        magazine,
        número: Number(numero),
      };

      await PublicationService.createPublication(publicationData);

      setIsCreating(false);
      setCreationSuccess(true);

      setTimeout(() => {
        onSuccess();
        handleReset();
      }, 2000);
    } catch (e) {
      setIsCreating(false);
      alert(`Error creating the publication: ${e}`);
      setShowConfirm(false);
      setConfirmStep(1);
    }
  };

  const isFormValid =
    idPublication && redirectionLink && date && magazine && numero;

  /* ESC para cerrar */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleReset();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
      onClick={handleReset} // 👈 click en el fondo cierra
    >
      <div
        className="relative flex flex-col p-6 bg-white shadow-xl rounded-xl gap-6 text-gray-700 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h1 className="text-2xl font-bold">Create New Publication</h1>
          <button
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <div className="flex flex-col gap-4">
          {[
            ["Publication ID", idPublication, setIdPublication, "text"],
            ["Redirect link", redirectionLink, setRedirectionLink, "text"],
            ["Revista", magazine, setMagazine, "text"],
            ["Number", numero, setNumero, "number"],
          ].map(([label, value, setter, inputType]: any) => (
            <div key={label} className="space-y-2">
              <label className="font-bold text-lg">{label}</label>
              <input
                type={inputType}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
              />
            </div>
          ))}

          <div className="space-y-2">
            <label className="font-bold text-lg">Fecha</label>
            <DatePicker
              value={date}
              onChange={setDate}
              className="w-full"
              placeholder="Select date"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleReset}
              className="w-full bg-gray-300 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!isFormValid}
              className={`w-full py-2 rounded-xl ${
                isFormValid
                  ? "bg-blue-950 text-white"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              Create publication
            </button>
          </div>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-xl">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
              {confirmStep === 1 ? (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    Confirm creation
                  </h2>
                  <p><strong>ID:</strong> {idPublication}</p>
                  <p><strong>Revista:</strong> {magazine}</p>
                  <p><strong>Number:</strong> {numero}</p>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 bg-gray-300 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 bg-blue-950 text-white py-2 rounded-xl"
                    >
                      Confirm
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center">
                  {isCreating
                    ? "Creating publication..."
                    : "Publication created!"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePublicationModal;
