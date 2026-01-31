import { Children } from "react";
import Loader from "./Loader";

const Stagger = ({ children, baseDelay = 0.15 }) => {
  return (
    <>
      {Children.map(children, (child, index) => (
        <Loader delay={index * baseDelay}>
          {child}
        </Loader>
      ))}
    </>
  );
};

export default Stagger;
