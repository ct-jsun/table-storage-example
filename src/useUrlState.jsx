import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export function useUrlState({ arrayKeys = [] }) {
  const arrayKeysSet = new Set(arrayKeys);
  const [searchParams, setSearchParams] = useSearchParams();

  const params = Object.fromEntries(
    Array.from(arrayKeysSet).map((key) => {
      return [key, searchParams.getAll(key)];
    })
  );

  const setParams = useCallback(
    // expect newParams to be in the same format as params
    (newParams) => {
      // This allows for a function to be passed in to setParams
      // e.g., setParams((prevParams) => ({ ...prevParams, foo: "bar" }))
      const nextParams =
        typeof newParams === "function" ? newParams(params) : newParams;
      const newSearchParams = new URLSearchParams(
        Object.entries(nextParams).flatMap(([key, values]) => {
          return values.map((value) => [key, value]);
        })
      );
      setSearchParams(new URLSearchParams(newSearchParams));
    },
    [setSearchParams, params]
  );

  return [params, setParams];
}
