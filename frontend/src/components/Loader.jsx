import { useEffect, useState } from "react";

const Loader = ({ delay, children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return <div className="fade-up">{children}</div>;
};

export default Loader;
