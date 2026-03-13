import { Avatar } from "./Avatar"
import { OrbitControls, Environment, Backdrop } from "@react-three/drei"

export const Experience = () => {
    return (
        <>
            <OrbitControls
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
                minAzimuthAngle={-Math.PI / 4}
                maxAzimuthAngle={Math.PI / 4}
            />
            <Environment preset="sunset" environmentIntensity={0.3} />

            <Backdrop scale={[50, 10, 5]} floor={1.5} position={[0, 0, -4]}>
                <meshStandardMaterial color={"#555"} />
            </Backdrop>

            {/* Key Light - no castShadow to avoid transmission/length crash */}
            <directionalLight
                position={[5, 5, 5]}
                intensity={2.2}
            />
            {/*FillLight*/}
            <directionalLight position={[-5, 5, 5]} intensity={0.7} />
            {/*BackLights*/}
            <directionalLight position={[1, 0.1, -5]} intensity={3} color={"red"} />
            <directionalLight position={[-1, 0.1, -5]} intensity={8} color={"blue"} />
            
            <Avatar />
        </>
    )
}