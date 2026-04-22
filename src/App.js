import React, { useState, useEffect } from "react";
import Card from "./components/Card";

const App = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('echobytes-theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('echobytes-theme', theme);
  }, [theme]);

  return (
    <div className="container">
      <main>
        <Card theme={theme} setTheme={setTheme} />
      </main>
    </div>
  );
};

export default App;
