import { useQuery } from "@tanstack/react-query";
import { getVersion } from "../api/version";

export const useVersion = () => {
    return useQuery({ queryKey: ["version"], queryFn: getVersion });
};
