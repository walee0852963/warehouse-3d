import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import "./App.css";

// صندوق قابل للسحب
function DraggableBox({ position, color, setDraggingGlobal }) {
  const rigidRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [dynamic, setDynamic] = useState(false); // لتشغيل الجاذبية بعد الإفلات
  const { camera, mouse } = useThree();

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
        setDraggingGlobal(false);
        setDynamic(true); // بعد الإفلات، يتحول للصندوق الديناميكي
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dragging]);

  useFrame(() => {
    if (dragging && rigidRef.current) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pos = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, pos);

      const currentPos = rigidRef.current.translation();
      rigidRef.current.setNextKinematicTranslation({
        x: THREE.MathUtils.lerp(currentPos.x, pos.x, 0.2),
        y: currentPos.y,
        z: THREE.MathUtils.lerp(currentPos.z, pos.z, 0.2),
      });
    }
  });

  return (
    <RigidBody
      ref={rigidRef}
      colliders="cuboid"
      restitution={0.5}
      friction={0.5}
      type={dragging ? "kinematicPosition" : dynamic ? "dynamic" : "dynamic"}
    >
      <mesh
        position={position}
        castShadow
        onPointerDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            setDragging(true);
            setDraggingGlobal(true);
            setDynamic(false); // أثناء السحب، نعطل الجاذبية
          }
        }}
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={dragging ? "red" : color} />
      </mesh>
    </RigidBody>
  );
}


// المخزن الرئيسي
function Warehouse() {
  const [inventory, setInventory] = useState({ stored: 5, sold: 0 });
  const [boxes, setBoxes] = useState(
    Array.from({ length: 5 }).map(() => ({
      id: Math.random(),
      pos: [Math.random() * 3 - 1.5, 1, Math.random() * 2 - 1],
    }))
  );
  const [draggingGlobal, setDraggingGlobal] = useState(false);

  // إضافة صندوق جديد
  const addItem = () => {
    setInventory((prev) => ({ ...prev, stored: prev.stored + 1 }));
    setBoxes((prev) => [
      ...prev,
      { id: Math.random(), pos: [Math.random() * 3 - 1.5, 1, Math.random() * 2 - 1] },
    ]);
  };

  // بيع صندوق
  const sellItem = () => {
    if (inventory.stored > 0) {
      setInventory((prev) => ({ stored: prev.stored - 1, sold: prev.sold + 1 }));
      setBoxes((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="container">
      <div className="warehouse">
        <Canvas shadows camera={{ position: [6, 5, 6], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
          <Physics gravity={[0, -9.81, 0]}>
            {/* الأرضية ثابتة */}
            <RigidBody type="fixed">
              <mesh position={[0, -0.5, 0]} receiveShadow>
                <boxGeometry args={[10, 1, 10]} />
                <meshStandardMaterial color="#e0e0e0" />
              </mesh>
            </RigidBody>

            {/* الصناديق */}
            {boxes.map((box) => (
              <DraggableBox
                key={box.id}
                position={box.pos}
                color="#ff9800"
                setDraggingGlobal={setDraggingGlobal}
              />
            ))}
          </Physics>

          {/* التحكم بالكاميرا مع تعطيل أثناء السحب */}
          <OrbitControls enabled={!draggingGlobal} />
        </Canvas>
      </div>

      <div className="controls">
        <h2>📦 نظام إدارة المخزن</h2>
        <p>المخزون الحالي: {inventory.stored}</p>
        <p>المباع: {inventory.sold}</p>
        <button onClick={addItem}>➕ إضافة بضاعة</button>
        <button onClick={sellItem} style={{ marginLeft: "10px" }}>
          ➖ بيع بضاعة
        </button>
      </div>
    </div>
  );
}

export default Warehouse;
