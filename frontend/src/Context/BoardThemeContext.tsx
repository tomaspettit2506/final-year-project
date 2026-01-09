import React, { createContext, useContext, useState, useEffect } from "react";

type BoardTheme = "classic" | "modern" | "wooden";
type PieceSet = "standard" | "fancy" | "minimal";

interface BoardThemeContextType {
  boardTheme: BoardTheme;
  setBoardTheme: (theme: BoardTheme) => void;
  pieceSet: PieceSet;
  setPieceSet: (set: PieceSet) => void;
}

const BoardThemeContext = createContext<BoardThemeContextType | undefined>(undefined);

export const useBoardTheme = () => {
  const context = useContext(BoardThemeContext);
  if (!context) throw new Error("useBoardTheme must be used within BoardThemeProvider");
  return context;
};

export const BoardThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(
    (localStorage.getItem("boardTheme") as BoardTheme) || "classic"
  );
  const [pieceSet, setPieceSet] = useState<PieceSet>(
    (localStorage.getItem("pieceSet") as PieceSet) || "standard"
  );

  useEffect(() => {
    localStorage.setItem("boardTheme", boardTheme);
  }, [boardTheme]);

  useEffect(() => {
    localStorage.setItem("pieceSet", pieceSet);
  }, [pieceSet]);

  return (
    <BoardThemeContext.Provider value={{ boardTheme, setBoardTheme, pieceSet, setPieceSet }}>
      {children}
    </BoardThemeContext.Provider>
  );
};