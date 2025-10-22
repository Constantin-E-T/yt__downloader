import { FormEvent, useCallback } from "react";

export function useSearch(
    searchValue: string,
    setSearchValue: (value: string) => void,
    updateSearchParams: (updater: (params: URLSearchParams) => void) => void
) {
    const handleSearchSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const trimmed = searchValue.trim();
            updateSearchParams((params) => {
                if (trimmed) {
                    params.set("query", trimmed);
                } else {
                    params.delete("query");
                }
            });
        },
        [searchValue, updateSearchParams]
    );

    const handleClearSearch = useCallback(() => {
        setSearchValue("");
        updateSearchParams((params) => {
            params.delete("query");
        });
    }, [setSearchValue, updateSearchParams]);

    return {
        handleSearchSubmit,
        handleClearSearch,
    };
}
