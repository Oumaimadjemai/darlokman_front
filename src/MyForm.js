import { useState } from "react";
export default function MyForm() {
  //const [nameInput, setNameInput] = useState("");
  //const [emailInput, setEmailInput] = useState("");
  const [formInputs, setformInput] = useState({
    name: "",
    email: "",
    generalInfo: "",
    isStudent: false,
    country: "ALG",
    status: "",
  });
  function handleCheckedBoxChanged(event) {
    console.log(event.target.checked);
    setformInput({ ...formInputs, isStudent: event.target.checked });
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        console.log(formInputs);
      }}
    >
      <label>name:</label>
      <input
        value={formInputs.name}
        onChange={(event) => {
          setformInput({ ...formInputs, name: event.target.value });
        }}
      />
      <hr />
      <label>Email:</label>
      <input
        value={formInputs.email}
        onChange={(event) => {
          setformInput({ ...formInputs, email: event.target.value });
        }}
      />
      <hr />
      <label>are you student?</label>
      <input
        type="checkbox"
        checked={formInputs.isStudent}
        onChange={handleCheckedBoxChanged}
      />
      <hr />
      <select
        value={formInputs.country}
        onChange={(event) => {
          setformInput({ ...formInputs, country: event.target.value });
        }}
      >
        <option>ALG</option>
        <option>KSA</option>
        <option>QAR</option>
        <option>EUA</option>
      </select>
      <hr />
      <div>
        <input
          type="radio"
          name=""
          checked={formInputs.status === "student"}
          value="student"
          onChange={(event) => {
            setformInput({ ...formInputs, status: event.target.value });
          }}
        />
        Student
        <input
          type="radio"
          name="status"
          checked={formInputs.status === "teacher"}
          value="teacher"
          onChange={(event) => {
            setformInput({ ...formInputs, status: event.target.value });
          }}
        />
        teacher
      </div>

      <hr />
      <label>General info</label>
      <textarea
        value={formInputs.generalInfo}
        onChange={(event) => {
          setformInput({ ...formInputs, generalInfo: event.target.value });
        }}
      />

      <hr />
      <button>Submit</button>
    </form>
  );
}
