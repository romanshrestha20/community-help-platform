import { useState } from "react";

export const useModal = () => {
  const [visible, setVisible] = useState(false);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return { visible, open, close };
};