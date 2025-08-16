// //import logo from "./logo.svg";
// import { useState } from "react";
// import "./App.css";
// //import MyButton from "./MyButton";
// //import MyInput from "./MyInput";
// //import MyForm from "./MyForm";
// let nextId = 5;
// function App() {
//   // const tasks = [
//   //   { id: 1, title: "dooing my homework" },
//   //   { id: 2, title: "reading a book" },
//   //   { id: 3, title: "studying" },
//   //   { id: 4, title: "cleaning my room" },
//   // ];
//   // const myTasksList = tasks.map((task) => {
//   //   return (
//   //     <li style={{ background: "green" }} key={task.id}>
//   //       {task.title}
//   //     </li>
//   //   );
//   // });
//   const [deviceName, setDeviceName] = useState("");
//   const [devices, setDevices] = useState([
//     { id: 1, name: "iphone" },
//     { id: 2, name: "mac" },
//     { id: 3, name: "samsung" },
//     { id: 4, name: "windows" },
//   ]);
//   const devicesList = devices.map((device) => {
//     return (
//       <li key={device.id}>
//         {device.name}{" "}
//         <button
//           onClick={() => {
//             handleDeleteClick(device.id);
//           }}
//         >
//           Delete
//         </button>
//       </li>
//     );
//   });
//   function handleDeleteClick(id) {
//     // const newDevices = [...devices];

// import { useState } from "react";

//     // let index = 0;
//     // let selectedIndex = 0;
//     // for (let device of newDevices) {
//     //   if (device.id === id) {
//     //     selectedIndex = index;
//     //   }
//     //   index++;
//     // }
//     // newDevices.splice(selectedIndex, 1);
//     const newDevices = devices.filter((device) => {
//       // if (device.id === id) {
//       //   return false;
//       // } else {
//       //   return true;
//       // }
//       return device.id !== id;
//     });
//     setDevices(newDevices);
//   }
//   function handleAddClick() {
//     // const newDevices = [...devices];
//     // newDevices.push(deviceName);
//     // setDevices(newDevices);
//     setDevices([...devices, { id: nextId, name: deviceName }]);
//     nextId++;
//   }
//   return (
//     <div className="App" style={{ paddingTop: "100px", fontSize: "30px" }}>
//       {devicesList}

//       <div>
//         <input
//           value={deviceName}
//           onChange={(event) => {
//             setDeviceName(event.target.value);
//           }}
//         />
//         <button onClick={handleAddClick}>Add</button>
//       </div>
//     </div>
//   );
// }

// export default App;

import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  function handlePlusClick() {
    setCount(count + 1);
    setCount((c) => {
      return c + 1;
    });
  }
  return (
    <div className="App">
      <h1>the count is: {count} </h1>
      <button onClick={handlePlusClick}>+</button>
    </div>
  );
}
export default App;
