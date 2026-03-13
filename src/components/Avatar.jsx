import { useGLTF } from "@react-three/drei"
import { useRef, Component, useState, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { pb } from "../store"
import { useConfiguratorStore } from "../store"
import { Suspense } from "react"
import { Asset } from "./Asset"
import { useFBX } from "@react-three/drei"
import { useAnimations } from "@react-three/drei"
import { GLTFExporter } from "three-stdlib"

function disableTransmissionOnObject(obj) {
    if (!obj) return
    obj.traverse((child) => {
        if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material]
            mats.forEach((m) => {
                if (m && "transmission" in m) m.transmission = 0
                if (m && "transparent" in m) m.transparent = false
            })
        }
    })
}

class AssetErrorBoundary extends Component {
    state = { error: false }
    static getDerivedStateFromError() {
        return { error: true }
    }
    componentDidCatch(err) {
        console.warn("Asset failed to load, skipping:", err?.message)
    }
    render() {
        if (this.state.error) return null
        return this.props.children
    }
}

const AssetWithErrorBoundary = (props) => (
    <AssetErrorBoundary>
        <Asset {...props} />
    </AssetErrorBoundary>
)


export const Avatar = ({ ...props }) => {
    const group = useRef()
    const glb = useGLTF("/models/Armature.glb")
    const { nodes } = glb
    useEffect(() => {
        disableTransmissionOnObject(glb.scene)
    }, [glb.scene])
    const { animations } = useFBX("/models/Idle.fbx")
    const customization = useConfiguratorStore((state) => state.customization)
    const invalidate = useThree((s) => s.invalidate)
    const { actions } = useAnimations(animations, group)
    const setDownload = useConfiguratorStore((state) => state.setDownload)

    const skeleton =
        nodes.Plane?.skeleton ??
        Object.values(nodes).find((n) => n?.skeleton)?.skeleton

    const getModelFileField = (asset) =>
        asset?.model ? "model" : asset?.file ? "file" : "url"

    const [displayUrls, setDisplayUrls] = useState({})
    const [headEyesReady, setHeadEyesReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setHeadEyesReady(true), 600)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        const next = { ...displayUrls }
        let changed = false
        Object.keys(customization).forEach((key) => {
            const asset = customization[key]?.asset
            const field = asset ? getModelFileField(asset) : null
            const modelFile = field && asset?.[field]
            if (!asset || !modelFile) return
            const requestedUrl = pb.files.getUrl(asset, modelFile)
            if (next[key] === undefined || next[key] === null) {
                next[key] = requestedUrl
                changed = true
            } else if (next[key] !== requestedUrl) {
                const p = useGLTF.preload(requestedUrl)
                if (p && typeof p.then === "function") {
                    p.then(() => {
                        setDisplayUrls((prev) => ({ ...prev, [key]: requestedUrl }))
                    }).catch(() => {})
                } else {
                    setDisplayUrls((prev) => ({ ...prev, [key]: requestedUrl }))
                }
            }
        })
        if (changed) setDisplayUrls((prev) => ({ ...prev, ...next }))
    }, [customization])

    useEffect(() => {
        if (Object.keys(customization).length > 0 && Object.keys(displayUrls).length > 0) {
            invalidate()
        }
    }, [customization, displayUrls, invalidate])

    useEffect(() => {
        function download() {
            const exporter = new GLTFExporter()
            exporter.parse(
                group.current,
                function (result) {
                    save(
                        new Blob([result], {type: "octet-stream"}),
                        `avatar_${+new Date()}.glb`
                    )
                },
                function (error) {
                    console.error(error);
                },
                {binary: true}
                    
            )
        }
        const link = document.createElement("a")
        link.style.display = "none"
        document.body.appendChild(link)

        function save( blob, filename ) {
            link.href = URL.createObjectURL(blob)
            link.download = filename
            link.click()
        }
        setDownload(download)


    }, [])

    useEffect(() => {
        actions["mixamo.com"]?.play()
    }, [actions])

    return (
        <group ref={group} {...props} dispose={null}>
            <group name="Sceen">
                <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
                    <primitive object={nodes.mixamorigHips} />
                    {skeleton &&
                        (() => {
                                const headEyes = (k) => {
                                    const l = k.toLowerCase()
                                    return l === "head" || l === "eyes"
                                }
                                const keys = Object.keys(customization)
                                    .filter((key) => headEyes(key) ? headEyesReady : true)
                                    .sort((a, b) => (headEyes(a) && !headEyes(b) ? 1 : !headEyes(a) && headEyes(b) ? -1 : 0))
                                return keys.map((key) => {
                                    const asset = customization[key]?.asset
                                    const field = asset ? getModelFileField(asset) : null
                                    const modelFile = field && asset?.[field]
                                    const requestedUrl = asset && modelFile ? pb.files.getUrl(asset, modelFile) : null
                                    const url = displayUrls[key] ?? requestedUrl
                                    if (!asset || !modelFile || !url) return null
                                    const lower = key.toLowerCase()
                                    const isHeadOrEyes = lower === "head" || lower === "eyes"
                                    return (
                                        <Suspense key={key} fallback={null}>
                                            <AssetWithErrorBoundary
                                                url={url}
                                                skeleton={skeleton}
                                                useMeshFallback={false}
                                                useSafeMaterial={isHeadOrEyes}
                                            />
                                        </Suspense>
                                    )
                                })
                            })()}
                </group>
            </group>
        </group>
    )
}