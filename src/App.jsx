import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { UI } from "./components/UI.jsx";
import { Experience } from "./components/Experience.jsx";


function App() {
  
  return (
    <>
      <UI />
      <Canvas
        camera={{
          position: [-1, 1, 5],
          fov: 45,
        }}
      >
        <color attach="background" args={["#333333"]} />
        <fog attach="fog" args={["#555", 15, 25]} />
        <group position-y={-1}>
          <Experience />
        </group>
      </Canvas>
    </>
  );
}

export default App;


