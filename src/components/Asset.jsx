import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"

function disableTransmission(mat) {
    if (!mat) return mat
    const m = Array.isArray(mat) ? mat[0] : mat
    const clone = m.clone()
    if ("transmission" in clone) clone.transmission = 0
    if ("transparent" in clone) clone.transparent = false
    return clone
}

function simpleMaterialFrom(orig) {
    if (!orig) return new THREE.MeshStandardMaterial({ color: 0xcccccc })
    const m = Array.isArray(orig) ? orig[0] : orig
    const color = m.color instanceof THREE.Color ? m.color.clone() : new THREE.Color(0xcccccc)
    return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0,
    })
}

function safeGeometry(geom, options = {}) {
    const { forFallbackMesh = false, stripMorphOnly = false } = typeof options === "boolean" ? { forFallbackMesh: options } : options
    try {
        if (!geom || !geom.attributes || !geom.attributes.position) return null
        const pos = geom.attributes.position
        if (!pos?.array || typeof pos.array.length !== "number" || pos.array.length === 0) return null
        const clone = geom.clone()
        clone.computeVertexNormals()
        if (clone.attributes.index && (!clone.attributes.index.array || clone.attributes.index.array.length === 0)) {
            clone.setIndex(null)
        }
        if (!clone.attributes.normal?.array?.length) return null
        if (stripMorphOnly || forFallbackMesh) {
            clone.morphAttributes = {}
        }
        if (forFallbackMesh) {
            delete clone.attributes.skinIndex
            delete clone.attributes.skinWeight
            if (!clone.attributes.uv || !clone.attributes.uv.array?.length) {
                const count = clone.attributes.position.count
                const uvArray = new Float32Array(count * 2)
                clone.setAttribute("uv", new THREE.BufferAttribute(uvArray, 2))
            }
        }
        return clone
    } catch (_) {
        return null
    }
}

export const Asset = ({ url, skeleton, useMeshFallback = false, useSafeMaterial = false }) => {
    const { scene } = useGLTF(url)

    const attachedItems = useMemo(() => {
        const items = []
        scene.traverse((child) => {
            if (!child.isMesh || !child.geometry) return
            const geom = safeGeometry(child.geometry, {
                forFallbackMesh: useMeshFallback,
                stripMorphOnly: useSafeMaterial && !useMeshFallback,
            })
            if (!geom) return
            const material = useSafeMaterial || useMeshFallback
                ? simpleMaterialFrom(child.material)
                : disableTransmission(child.material)
            items.push({ geometry: geom, material })
        })
        return items
    }, [scene, useMeshFallback, useSafeMaterial])

    if (attachedItems.length === 0) return null
    if (!useMeshFallback && !skeleton) return null

    return attachedItems.map((item, index) =>
        useMeshFallback ? (
            <mesh key={index} geometry={item.geometry} material={item.material} />
        ) : (
            <skinnedMesh
                key={index}
                geometry={item.geometry}
                material={item.material}
                skeleton={skeleton}
            />
        )
    )
}