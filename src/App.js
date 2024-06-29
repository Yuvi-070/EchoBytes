import React, { useState } from "react";
import Card from "./components/Card";
const App = () => {
  const [musicNumber, setMusicNumber] = useState(0)
  return (
    <div className="container">
  <main >
        <Card props={{ musicNumber, setMusicNumber }}/>
  </main>


    </div>
  );
}

export default App;
