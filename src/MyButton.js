import { useState } from "react";
//let name = "oumaima";
export default function MyButton() {
  console.log("render");
  const [name, setName] = useState("oumaima");
  //console.log(name);
  function buttonClicked() {
    if (name === "oumaima") {
      setName("imi");
    } else {
      setName("oumaima");
    }
  }
  return (
    <div>
      <button onClick={buttonClicked}>Click me</button>
      <h1>{name}</h1>
    </div>
  );
}
