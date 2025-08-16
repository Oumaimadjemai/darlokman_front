import { useState } from "react";
export default function MyInput() {
  const [myInputValue, setMyInputValue] = useState("");
  function handleInputChange(event) {
    setMyInputValue(event.target.value);
  }
  return (
    <div>
      <label>your name: </label>
      <input value={myInputValue} onChange={handleInputChange} />
      <p>{myInputValue}</p>
    </div>
  );
}
