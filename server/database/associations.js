let associationsAlreadyDefined = false;

export function defineAssociations() {
    if (associationsAlreadyDefined) return;
    associationsAlreadyDefined = true;

    // TimeLog and Modification models/tables removed; no associations to define for them.
}