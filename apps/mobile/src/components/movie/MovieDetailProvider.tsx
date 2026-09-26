import { createContext, useContext, useState } from "react";
import { MovieDetailView } from "./MovieDetailView";

export interface MovieDetailOptions {
  showLikedBy?: boolean;
  sessionCode?: string | null;
  mediaType?: "movie" | "tv";
}

export interface MovieSelection extends MovieDetailOptions {
  id: string;
}

interface MovieDetailContextValue {
  openMovie: (id: string, options?: MovieDetailOptions) => void;
  closeMovie: () => void;
}

const MovieDetailContext = createContext<MovieDetailContextValue | null>(null);

export function MovieDetailProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<MovieSelection | null>(null);
  const closeMovie = () => setSelection(null);
  const value: MovieDetailContextValue = {
    openMovie: (id, options = {}) => setSelection({ id, ...options }),
    closeMovie,
  };

  return (
    <MovieDetailContext.Provider value={value}>
      {children}
      <MovieDetailView selection={selection} onClose={closeMovie} />
    </MovieDetailContext.Provider>
  );
}

export function useMovieDetail() {
  const context = useContext(MovieDetailContext);
  if (!context) throw new Error("useMovieDetail must be used within a MovieDetailProvider");
  return context;
}

