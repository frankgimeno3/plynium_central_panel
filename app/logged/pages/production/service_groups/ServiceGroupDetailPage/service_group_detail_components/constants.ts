export type ServiceGroupDetailChannel = "dem" | "portal" | "magazine";

export const CHANNEL_OPTIONS: { value: ServiceGroupDetailChannel; label: string }[] = [
    { value: "dem", label: "Newsletter (dem)" },
    { value: "portal", label: "Portal" },
    { value: "magazine", label: "Magazine" },
];
