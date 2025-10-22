import { useCallback } from "react";
import { useRouter, useSearchParams as useNextSearchParams } from "next/navigation";

export function useSearchParamsManager() {
    const router = useRouter();
    const searchParams = useNextSearchParams();

    const updateSearchParams = useCallback(
        (updater: (params: URLSearchParams) => void) => {
            // Get fresh params from window.location.search to avoid dependency on searchParams
            const currentParams = new URLSearchParams(window.location.search);
            updater(currentParams);
            router.replace(`?${currentParams.toString()}`, { scroll: false });
        },
        [router]
    );

    return {
        searchParams,
        updateSearchParams,
    };
}
