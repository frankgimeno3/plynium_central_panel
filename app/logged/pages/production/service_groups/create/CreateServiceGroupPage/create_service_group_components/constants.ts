import type { ServiceGroupChannelOption } from "./types";

export const BASE = "/logged/pages/production/service_groups";

export const CHANNEL_OPTIONS: { value: Exclude<ServiceGroupChannelOption, "">; label: string }[] = [
    { value: "dem", label: "Newsletter (dem)" },
    { value: "portal", label: "Portal" },
    { value: "magazine", label: "Magazine" },
];
