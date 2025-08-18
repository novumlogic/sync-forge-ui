import { DnDContext } from "@/providers/dnd_provider";
import { useContext } from "react";

const useDnD = () => {
  const context = useContext(DnDContext);
  if (!context) {
    throw new Error("useDnD Hook must be used within the DnD Provider");
  }
  return context;
};

export default useDnD;
